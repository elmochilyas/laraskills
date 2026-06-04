# Dynamic Scopes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Dynamic scopes in Laravel Eloquent refer to two related but distinct concepts: (1) parameterized local scopes — scope methods that accept runtime parameters (`scopeOfType($query, $type)`), and (2) dynamically applied scopes — using a dynamic variable to determine which scope to call at runtime. Together, they enable flexible query composition where the specific filter logic is determined by runtime data rather than compile-time code. Dynamic scopes are essential for building generic filtering systems, role-based query adaptation, and feature-flag-aware queries without repetitive if/else chains.

## Core Concepts
- **Parameterized Local Scopes** — `scopeFoo($query, $param)` that accepts parameters at call time: `Model::foo($value)`
- **Dynamic Method Dispatch** — calling scopes via variable method names: `$query->{$scopeName}($param)`
- **Runtime Scope Resolution** — determining which scope to apply based on runtime conditions
- **Scope Registry** — maintaining a map of available scopes that can be applied dynamically
- **First-Class Callables** — PHP 8.1+ `$scopeCallable = $model->scopeName(...)` for passing scopes as values

## Mental Models
- **Scope Factory** — dynamic scopes are like a factory: given a name and parameters, produce a query constraint
- **Strategy Pattern** — each scope is a strategy for constraining the query; dynamic dispatch picks the strategy at runtime
- **Plugin Architecture** — scopes act as plugins that can be applied selectively based on configuration or context

## Internal Mechanics
Parameterized scope resolution follows the same path as local scopes:
1. `Model::scopeName($param)` triggers `__callStatic` on Model
2. Resolves to `$model->scopeName($builder, $param)`
3. The scope applies constraints and returns the builder

For dynamic dispatch via variable:
```php
$scope = 'active';
User::{$scope}()->get(); // calls User::active()
```

For runtime scope application from a registry or configuration:
```php
$filters = ['status' => 'active', 'type' => 'premium'];
foreach ($filters as $scope => $value) {
    if (method_exists($model, 'scope'.ucfirst($scope))) {
        $query->{$scope}($value);
    }
}
```

## Patterns
- **Generic Filter System** — accept an array of filter names/values from a request and apply corresponding scopes dynamically
- **Role-Based Scopes** — determine which scope to apply based on authenticated user role: `$scope = $user->isAdmin() ? 'all' : 'own'; Model::{$scope}();`
- **Feature-Flagged Scopes** — conditionally apply scopes based on feature flags or configuration: `$scopes = config('queries.users.scopes', ['active']);`
- **Scope Parameters from Request** — `User::status($request->status)->type($request->type)->get()` where each scope is parameterized
- **Priority-Ordered Scopes** — apply scopes in a defined priority order from a configuration array

## Architectural Decisions
- **Dynamic vs Explicit** — dynamic scope dispatch is flexible but less readable than explicit chaining. Use dynamic dispatch for generic/framework code; use explicit chaining for business-logic-specific queries.
- **Scope Registry vs Convention** — a formal scope registry (e.g., a `$filterableScopes` property on the model) is safer than relying on method existence checks, which can accidentally call non-scope methods.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Generic filter system with minimal code | Magic dispatch reduces readability | Use dynamic scopes in infrastructure; explicit in business logic |
| Runtime flexibility for role-based queries | No static analysis for dynamic calls | Add validation/whitelist for allowed dynamic scopes |
| Parameterized scopes reduce N filter methods | Too many parameters make scopes complex | Keep parameters focused; extract to query objects if > 3 params |
|  |  |  |

## Performance Considerations
- Dynamic scope dispatch has negligible overhead (method lookup + call)
- Parameterized scopes themselves cost no more than any other query constraint
- The overhead of a dynamic filter loop is proportional to the number of filters applied (microseconds)

## Production Considerations
- **Whitelist dynamic scopes** — never apply arbitrary user input as a scope method name; maintain an explicit whitelist of allowed scope names
- **Validate scope parameters** — sanitize and validate user-provided values before passing to parameterized scopes
- **Log scope application** — for auditing, log which dynamic scopes were applied to a query
- **Document available scopes** — maintain a list of available dynamic scopes with parameter types for API consumers

## Common Mistakes
- **Calling non-existent scopes dynamically** — `User::{$userInput}()` can call ANY method on the model; always validate against a whitelist
- **Forgetting scope prefix in dynamic dispatch** — `$scope = 'scopeActive'` should be `$scope = 'active'`; the builder prepends `scope`
- **Over-parameterization** — `scopeFilter($q, $type, $status, $from, $to, $sort)` is a code smell; break into focused scopes
- **Mixing dynamic and explicit** — applying a dynamic scope that duplicates another explicit constraint in the same chain
- **Missing default parameter values** — calling a parameterized scope without arguments when the method defines no defaults

## Failure Modes
- **Method injection via dynamic scope** — if user input can control scope names without validation, an attacker could call any public method on the model or builder that accepts builder-like parameters
- **Runtime error on missing scope** — calling `User::{$typo}()` calls `User::typo()` which triggers `__callStatic` → `scopeTypo()` which doesn't exist → `BadMethodCallException`
- **Parameter type mismatch** — passing a string to a scope that expects an integer causes a query binding error

## Ecosystem Usage
- **Spatie/QueryBuilder** — the `allowedFilters()` method is a formalized dynamic scope registry; apply filters from request query parameters
- **Laravel Nova** — resource filters are dynamically applied based on the filter configuration
- **Laravel Filament** — table filters use dynamic scope application with parameterized filter classes
- **Laravel REST API packages** — many API packages use dynamic scopes to build filter, sort, and include functionality from request parameters

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Local Scopes

### Related Topics
Conditional Clauses, Decision Framework, Custom Builder Pattern

### Advanced Follow-up Topics
Domain-Specific Query Methods, Global Scope Suppression

## Research Notes
- **Source Analysis:** Dynamic scope dispatch piggybacks on the same `__call` mechanism in `Illuminate\Database\Eloquent\Builder`. The builder does not distinguish between explicit scope calls and dynamic scope calls — both go through the same `scope` prefix resolution.
- **Key Insight:** Dynamic scopes are most powerful when combined with a formal `$filterable` property on models that acts as a whitelist. This gives the flexibility of dynamic dispatch without the security risk.
- **Version-Specific Notes:** Laravel 9+ allows first-class callable syntax for scopes: `$scope = $model->active(...)`. Laravel 11 improved error messages for missing scopes by showing available scope methods. PHP 8.1+ `callable` type hints work with dynamic scope references.
