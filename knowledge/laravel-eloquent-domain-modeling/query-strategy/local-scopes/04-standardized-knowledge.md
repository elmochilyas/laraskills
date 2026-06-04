# Local Scopes — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Local Scopes
- **ECC Version:** 1.0

## Overview
Local scopes are model methods (prefixed with `scope`) that encapsulate reusable query constraints. They provide a fluent, readable API for common query patterns — `User::active()->admin()->recent()` — keeping query logic in the model. They are the primary mechanism for domain-specific query expressions in Eloquent, bridging raw SQL logic with expressive domain language.

## Core Concepts
- `scope` prefix convention: `scopeActive()` on model is callable as `Model::active()`
- Fluent chaining: scopes receive the builder and must return it
- Parameterized scopes: `scopeOfType($query, $type)` callable as `Model::ofType('premium')`
- Dynamic resolution: Eloquent uses `__callStatic` on Model and `__call` on Builder to route calls
- Return value: scope must return the builder (or fallback `?? $this` applies)

## When To Use
- Reusable query constraints used in multiple places (controllers, jobs, tests)
- Domain-specific query expressions: `active()`, `verified()`, `recent()`, `subscribed()`
- Parameterized filters: `ofType('premium')`, `betweenDates($from, $to)`
- Scopes that encapsulate `whereHas` / `whereDoesntHave` logic
- Scopes that add common joins or subqueries used across the codebase

## When NOT To Use
- Do NOT use scopes for one-off constraints used in a single controller — inline `where()` is fine
- Do NOT use scopes with side effects (logging, API calls, cache operations)
- Do NOT use scopes that terminate the query (calling `get()` inside a scope)
- Do NOT create scopes for trivial constraints that add no abstraction value
- Do NOT put 15+ scopes on a single model — extract to a custom builder or query objects

## Best Practices (WHY)
- Name scopes as domain terms: `->active()` not `->whereActive()` — scope names should read as business language
- Always return the builder from scope methods; use `return $q` explicitly
- Keep scopes focused: one scope, one concern; compose multiple scopes at the call site
- Add return type hints: `public function scopeActive(Builder $q): Builder|static`
- Document scopes that add joins or non-obvious constraints
- Test each scope independently and in combination with other scopes

## Architecture Guidelines
- Group related scopes on the model; if there are 10+ scopes, consider a custom builder
- Use scopes for the "vocabulary" of your domain query language
- Combine scopes with `when()` for conditional application
- Prefer scope methods over inline `where()` in controllers for maintainability
- Use `@method` annotations on the model for IDE autocompletion

## Performance
- Scope invocation overhead is negligible (one extra method call per scope)
- Scopes that use joins or subqueries add database cost — profile with `explain()`
- Chaining many scopes can produce complex SQL — verify with `toSql()`
- Reusing scopes in loops is fine; rebuilding the query in each iteration is not

## Security
- Parameterized scopes accept user input — validate parameters before passing to scopes
- Scopes that accept column names should whitelist allowed columns
- Avoid scopes that accept raw SQL fragments
- Document any scope that bypasses security constraints (e.g., `withTrashed()`)

## Common Mistakes
- Forgetting to return the builder — the scope silently does nothing
- Modifying a different builder instance inside the scope (captured from outer scope)
- Naming collision: `scopeWhereStatus` collides with dynamic `whereStatus` — use domain names
- Terminating scope: calling `$q->get()` inside a scope instead of constraining
- Over-narrowing: scope that adds both a filter and a limit — better as two separate scopes

## Anti-Patterns
- **Side Effect Scopes**: logging, caching, or API calls inside scope methods
- **Terminating Scopes**: calling `get()`, `first()`, or `count()` inside a scope
- **Scope Obesity**: 20+ scopes on one model — extract to custom builder
- **Trivial Scopes**: `scopeActive($q) { $q->where('active', true); }` used once — inline it
- **Hidden Complexity**: scope that adds 3 joins and a subquery without documentation

## Examples
```php
class User extends Model
{
    public function scopeActive(Builder $q): Builder
    {
        return $q->where('active', true);
    }

    public function scopeVerified(Builder $q): Builder
    {
        return $q->whereNotNull('email_verified_at');
    }

    public function scopeOfType(Builder $q, string $type): Builder
    {
        return $q->where('type', $type);
    }

    public function scopeRecentlyJoined(Builder $q, int $days = 7): Builder
    {
        return $q->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeWithRecentPosts(Builder $q): Builder
    {
        return $q->whereHas('posts', fn($q) =>
            $q->where('created_at', '>=', now()->subDays(30))
        );
    }
}

// Usage
$users = User::active()
    ->verified()
    ->ofType('premium')
    ->recentlyJoined(14)
    ->get();
```

## Related Topics
- Builder Fundamentals — constraint methods and method chaining
- Dynamic Scopes — parameterized scopes and runtime scope dispatch
- Global Scopes — always-applied scopes vs opt-in local scopes
- Custom Builder Pattern — extracting scopes from model to builder class
- Domain-Specific Query Methods — evolving scopes into domain language

## AI Agent Notes
- Always return `$q` from scope methods
- Name scopes with domain language, not technical descriptions
- Keep scopes focused on a single constraint
- Use parameterized scopes for reusable filter logic
- Prefer scopes over inline constraints when the logic is used in multiple places

## Verification
- [ ] All scope methods explicitly return the builder
- [ ] Scopes named with domain language, not technical column names
- [ ] No side effects (logging, API calls) inside scope methods
- [ ] Scopes tested independently and in combinations
- [ ] No terminating methods (`get`, `first`) inside scopes
- [ ] Model has < 15 scopes (otherwise extract to custom builder)
- [ ] `@method` annotations added to model for IDE support
