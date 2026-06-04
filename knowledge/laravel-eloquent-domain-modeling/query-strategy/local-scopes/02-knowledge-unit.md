# Local Scopes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Local scopes are methods on Eloquent models (prefixed with `scope`) that encapsulate reusable query constraints. They provide a fluent, readable API for common query patterns — `User::active()->admin()->recent()` — while keeping query logic in the model where it belongs. Local scopes can accept parameters for flexibility and compose freely with other query methods. They are the primary mechanism for domain-specific query expressions in Eloquent, bridging raw SQL logic with expressive domain language.

## Core Concepts
- **`scope` prefix convention** — a method named `scopeActive()` on a model is callable as `Model::active()`
- **Fluent chaining** — scopes receive the builder and must return it; they can be chained arbitrarily
- **Parameterized scopes** — `scopeOfType($query, $type)` is callable as `Model::ofType('premium')`
- **`$query` parameter** — the first parameter is always the Eloquent Builder instance
- **Return value** — the scope must return the builder (explicitly or implicitly via `?? $this` behavior)
- **Dynamic resolution** — Eloquent uses `__callStatic` on the Model and `__call` on the Builder to route method calls to scope methods

## Mental Models
- **Named Filters** — scopes are reusable, named query filters that read like domain language
- **Builder Extension** — scopes effectively extend the builder with domain-specific methods for that model
- **Query Building Block** — scopes are composable blocks that build up a query; chain them like LEGO bricks

## Internal Mechanics
When you call `User::active()->get()`, the flow is:
1. `User::active()` triggers `__callStatic` on Model
2. Model creates a new Eloquent Builder via `newQuery()`
3. Calls `active()` on the builder
4. Builder's `__call` method prepends `scope` to the method name
5. Builder calls `$model->scopeActive($builder)`
6. The scope modifies `$builder` and returns it (or Laravel uses `?? $this` if no explicit return)
7. The builder is returned with the applied scope constraints

For parameterized scopes like `User::ofType('premium')`, the additional parameters are passed through the chain: `scopeOfType($query, $type)`.

## Patterns
- **Simple Filter** — `scopeActive($q) { $q->where('active', true); }`
- **Parameterized Filter** — `scopeWhereStatus($q, $status) { $q->where('status', $status); }`
- **Scope with Relationship** — `scopeHasRecentOrders($q, $days = 30) { $q->whereHas('orders', fn($q) => $q->where('created_at', '>=', now()->subDays($days))); }`
- **Scope with Join** — `scopeWithLastLogin($q) { $q->leftJoin('logins', ...)->addSelect(...); }`
- **Scope Returning Boolean** — `scopeVerified($q) { $q->whereNotNull('email_verified_at'); }`
- **Combined Scope** — `scopeStandard($q) { $q->active()->verified(); }` — scopes can call other scopes

## Architectural Decisions
- **Scopes vs `when()`** — scopes encapsulate fixed query constraints; `when()` handles conditional application. Use scopes for reusable named constraints; use `when()` for runtime conditions.
- **Scopes vs Custom Builders** — scopes are simpler and attached to individual models; custom builders allow extending the entire builder class. Use scopes for model-specific logic; use custom builders for cross-model query methods.
- **Scopes vs Global Scopes** — local scopes must be explicitly applied; global scopes always apply. Use local scopes for opt-in constraints; use global scopes for mandatory constraints.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Expressive domain language | Scope methods can accumulate on models | Extract to query objects or custom builders |
| Reusable query constraints | Scopes can hide complexity (join in scope) | Document what each scope does |
| Composable with other scopes | Scope order can matter (eager vs lazy evaluation) | Test scope combinations |
| Parameterized for flexibility | Too many parameters reduce readability | Limit parameters to 1-3 |
|  |  |  |

## Performance Considerations
- Scope invocation overhead is negligible (one extra method call per scope)
- Scopes that use joins or subqueries add database cost regardless of syntactic sugar
- Chaining many scopes can produce complex SQL; verify with `->toSql()` and `->explain()`
- Scope reuse in loops should be avoided — build the query once with all scopes, execute it, then iterate results

## Production Considerations
- **Name scopes as domain terms** — `->active()` not `->whereActive()`; scope names should read as business language
- **Document scope behavior** — if a scope adds a join, document it so developers aren't surprised by the extra table
- **Avoid side effects** — scopes should only modify the query; no logging, caching, or API calls inside scopes
- **Test scope isolation** — each scope should be tested independently and in combination with other scopes
- **Use return type hints** — declare `return Builder|static` to help IDEs understand the chain

## Common Mistakes
- **Forgetting to return the builder** — the most common bug; the scope returns `null` and Eloquent applies `?? $this` (the unchanged builder), so the constraint silently does nothing
- **Modifying a different query** — capturing and modifying a different builder instance inside the scope
- **Scope expecting no parameters** — defining `scopeFoo($query)` and calling `Model::foo()` works; calling `Model::foo('bar')` fails because `foo` is called with `bar` but the scope only accepts `$query`
- **Naming collision** — a scope named `scopeWhereStatus` that collides with a dynamic `whereStatus` method; prefer domain names like `scopeActive` over `scopeWhereActive`
- **Over-narrowing scope** — a scope that calls `$q->get()` instead of `$q->where(...)` — terminating the builder instead of constraining it

## Failure Modes
- **Scope in scope confusion** — calling `$this->active()` inside another scope may not work as expected because `$this` is the model instance, not the builder. Use `$q->active()` instead.
- **Infinite recursion** — a scope that calls itself (directly or through a chain) can cause infinite recursion
- **Missing eager load awareness** — a scope that adds a `whereHas` with a closure that uses a relationship name that doesn't exist throws a `RelationNotFoundException`
- **Parameter injection** — accepting user input directly in a scope (without validation) could lead to unexpected query behavior if the input is malformed

## Ecosystem Usage
- **Laravel Nova** — Nova resource queries use scopes defined on the model for filtering and search
- **Laravel Filament** — table filters can use Eloquent scopes as filter options
- **Spatie/QueryBuilder** — can apply model scopes based on request query parameters
- **Laravel Telescope** — uses scopes internally for query filtering in its own data layer
- **Laravel Breeze/Jetstream** — use scopes for team/user filtering in multi-tenant features

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Conditional Clauses

### Related Topics
Dynamic Scopes, Global Scopes, Custom Builder Pattern

### Advanced Follow-up Topics
Domain-Specific Query Methods, Global Scope Suppression, Decision Framework

## Research Notes
- **Source Analysis:** Scope resolution is in `Illuminate\Database\Eloquent\Builder::__call`. The method prepends `scope` and calls `$model->{'scope'. $method}($this, ...$parameters)`.
- **Key Insight:** Local scopes are the primary tool for creating a domain-specific query language within Eloquent. Well-named scopes make controller code read like business requirements: `User::subscribed()->active()->recentlyJoined()->get()`.
- **Version-Specific Notes:** Laravel 9+ added `scope` method return-type detection in IDE stubs. Laravel 11 supports PHP 8.1+ `pure` attributes on scopes for static analysis. No breaking changes to scope resolution since Laravel 5.x.
