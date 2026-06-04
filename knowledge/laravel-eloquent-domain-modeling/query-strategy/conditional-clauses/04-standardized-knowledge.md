# Conditional Clauses — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Conditional Clauses
- **ECC Version:** 1.0

## Overview
`when()` and `unless()` enable fluent, conditional query composition without breaking the chain. Instead of imperative if/else trees, these methods accept a condition and a closure invoked only when the condition is met. This keeps query composition declarative, testable, and chainable — foundational for building filter APIs, search endpoints, and permission-aware queries.

## Core Concepts
- `when(condition, callback [, default])` — invokes callback when condition is truthy
- `unless(condition, callback [, default])` — invokes callback when condition is falsy
- Condition value is passed as the second argument to the callback
- Callback must return the builder (or relies on `?? $this` fallback)
- Conditions can be booleans, callables (deferred evaluation), or any value

## When To Use
- Filter/search endpoints where request parameters determine query constraints
- Permission-scoped queries: `when($user->isAdmin(), fn($q) => $q->withTrashed())`
- Feature-flag-aware queries: `when(config('features.discounts'), fn($q) => $q->where('discounted', true))`
- Multi-tenant filter chains: `when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))`
- Dynamic report generation with optional filter dimensions

## When NOT To Use
- Do NOT use `when()` for fixed, unconditional constraints — use explicit `where()` calls
- Do NOT use `when()` inside hot loops with millions of iterations (closure overhead, though negligible)
- Do NOT use `when()` as a replacement for parameterized scopes when the logic is reusable across multiple controllers
- Do NOT nest `when()` more than 2-3 levels deep — extract to named methods

## Best Practices (WHY)
- Always explicitly `return $q` from callbacks; `?? $this` hides unintentional void returns
- Prefer `$request->filled()` over `$request->has()` as conditions — `filled` rejects empty strings
- Use callable conditions for expensive checks: `when(fn() => Auth::user()->isAdmin(), ...)` (deferred evaluation)
- Use `when` with a default closure to provide fallback ordering: `when($sort, ..., fn($q) => $q->orderBy('created_at'))`
- Tag filter application with comments for observability and debugging

## Architecture Guidelines
- Extract filter logic into named scope methods when the same `when` pattern appears in multiple places
- Keep filter chains in dedicated query classes or service methods, not in controllers
- Sort `when()` calls consistently (e.g., status filters first, date ranges second, search terms last)
- Use `when()` with `match` expressions for multi-value conditions instead of nested `when` chains

## Performance
- `when()` overhead is a single closure invocation — negligible for normal request volumes
- Closure allocation is cheap in PHP 8+ with JIT
- For extremely hot paths (processing 1000+ queries per request), precompute conditions outside the builder chain
- Callable conditions are evaluated only once at call time, not deferred to execution time

## Security
- Sanitize user-provided filter values before passing them to `when()` callbacks
- Whitelist allowed filter parameters when using dynamic filter arrays with `when()`
- Never pass raw user input as the condition without validation
- Log applied filters for audit trails, especially in permission-scoped queries

## Common Mistakes
- Forgetting `return $q` — the most common bug; the constraint silently does nothing
- Modifying a different builder instance inside the callback (captured from outer scope)
- Passing a collection or non-empty array as condition (always truthy)
- `when($request->status, ...)` where status is `""` — empty string is falsy in PHP, may unexpectedly skip the filter
- Deeply nested `when()` chains that reduce readability

## Anti-Patterns
- **Hidden Conditions**: `when()` with a condition that is always true or always false — use explicit constraints
- **Side Effect Callbacks**: performing logging, caching, or API calls inside `when()` closures
- **Nested When Spaghetti**: `when(a, fn => when(b, fn => when(c, ...)))` — extract to a filter strategy class
- **Unnecessary When**: `when(true, fn($q) => $q->where('x', 1))` — just write `where('x', 1)`
- **Condition Pollution**: using `when()` for every single constraint, including ones that are always applied

## Examples
```php
// Search/filter endpoint
$query = User::query()
    ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
    ->when($request->filled('role'), fn($q) => $q->where('role', $request->role))
    ->when($request->filled('search'), fn($q) => $q->where('name', 'like', "%{$request->search}%"))
    ->when(
        $request->filled('sort'),
        fn($q) => $q->orderBy($request->sort, $request->direction ?? 'asc'),
        fn($q) => $q->orderBy('created_at', 'desc')
    );

// Permission-scoped
$posts = Post::query()
    ->when(!Auth::user()->isAdmin(), fn($q) => $q->where('user_id', Auth::id()))
    ->when(Auth::user()->isEditor(), fn($q) => $q->whereIn('status', ['draft', 'published']))
    ->get();

// Callable condition (deferred)
$query->when(
    fn() => Feature::active('new-recommendations'),
    fn($q) => $q->where('score', '>', 0.8)
);
```

## Related Topics
- Builder Fundamentals — method chaining and constraint methods
- Local Scopes — reusable named query constraints; complement `when()` for reusable logic
- Dynamic Scopes — runtime scope resolution; `when()` can select which scope to apply
- Decision Framework — when to use Eloquent vs Query Builder for conditional queries

## AI Agent Notes
- Always verify `when()` callbacks return `$q` to avoid silent no-ops
- Use `$request->filled()` (not `$request->has()`) as the condition for nullable query params
- Prefer `when()` chains over if/else blocks for query construction
- For complex multi-value filters, combine `when()` with `match()` or a filter registry

## Verification
- [ ] All `when()` callbacks explicitly return `$q`
- [ ] Filter chains produce correct SQL for all condition combinations
- [ ] No side effects (logging, API calls) inside `when()` callbacks
- [ ] User-provided filter values sanitized before use in callbacks
- [ ] Conditions evaluate correctly for edge cases (null, empty string, zero, false)
- [ ] Nested `when()` chains are extracted to named methods when exceeding 3 levels
