# Skill: Compose Conditional Query Chains with when() and unless()

## Purpose
Build fluent, conditional query composition using `when()` and `unless()` to apply runtime-determined constraints without breaking the builder chain or resorting to imperative if/else trees.

## When To Use
- Filter/search endpoints where request parameters determine query constraints
- Permission-scoped queries: `when($user->isAdmin(), fn($q) => $q->withTrashed())`
- Feature-flag-aware queries
- Multi-tenant filter chains
- Dynamic report generation with optional filter dimensions

## When NOT To Use
- Fixed, unconditional constraints — use explicit `where()` calls
- Inside hot loops with millions of iterations (closure overhead)
- As replacement for parameterized scopes when logic is reusable across controllers
- Nesting more than 2-3 levels deep — extract to named methods

## Prerequisites
- Builder Fundamentals — method chaining and constraint methods
- Understanding of closure syntax in PHP

## Inputs
- Query builder instance
- Condition (boolean, callable, or value)
- Callback applying constraints when condition is truthy
- Optional: default closure for fallback when condition is falsy

## Workflow
1. Start with `Model::query()` or a base builder
2. Chain `->when($condition, fn($q) => return $q->where(...))` for conditional constraints
3. Always explicitly `return $q` from the callback — never rely on `?? $this`
4. Use `$request->filled()` instead of `$request->has()` for query parameter conditions
5. For expensive conditions, pass a callable as the first argument for deferred evaluation
6. For fallback behavior (especially ordering), pass a third argument (default closure)
7. Extract recurring `when()` patterns to named local scopes when duplicated 3+ times

## Validation Checklist
- [ ] All `when()` callbacks explicitly return `$q`
- [ ] Filter chains produce correct SQL for all condition combinations
- [ ] No side effects (logging, API calls) inside `when()` callbacks
- [ ] User-provided filter values sanitized before use in callbacks
- [ ] Conditions evaluate correctly for edge cases (null, empty string, zero, false)
- [ ] Nested `when()` chains extracted to named methods when exceeding 3 levels
- [ ] Default closure provided for ordering fallback

## Common Failures
- Forgetting `return $q` — constraint silently does nothing
- Modifying a different builder instance inside the callback (captured from outer scope)
- Passing a collection or non-empty array as condition (always truthy)
- `when($request->status, ...)` where status is `""` — empty string is falsy, may skip filter
- Deeply nested `when()` chains that reduce readability

## Decision Points
- `when()` vs `if/else`: use `when()` to keep the builder chain fluent and declarative; use `if/else` when side effects (logging, caching) are needed alongside query construction
- `$request->filled()` vs `$request->has()`: use `filled()` — it rejects empty strings; `has()` returns true for empty parameters
- Callable vs scalar condition: use callable for expensive/deferred evaluation; use scalar for simple boolean checks

## Performance Considerations
- `when()` overhead is a single closure invocation — negligible for normal request volumes
- Closure allocation is cheap in PHP 8+ with JIT
- For extremely hot paths (1000+ queries per request), precompute conditions outside the chain
- Callable conditions evaluated only once at call time

## Security Considerations
- Sanitize user-provided filter values before passing them to `when()` callbacks
- Whitelist allowed filter parameters when using dynamic filter arrays
- Never pass raw user input as the condition without validation
- Log applied filters for audit trails, especially in permission-scoped queries

## Related Rules
- Always Explicitly return $q from when() and unless() Callbacks (query-strategy/conditional-clauses)
- Use $request->filled() Instead of $request->has() as when() Conditions (query-strategy/conditional-clauses)
- Never Nest when() Calls Beyond 3 Levels (query-strategy/conditional-clauses)
- Never Place Side Effects Inside when() Callbacks (query-strategy/conditional-clauses)
- Use when() with a Default Closure for Fallback Ordering (query-strategy/conditional-clauses)
- Use Callable Conditions for Expensive Checks in when() (query-strategy/conditional-clauses)
- Extract Recurring when() Patterns into Named Scope Methods (query-strategy/conditional-clauses)

## Related Skills
- Compose Fluent Eloquent Query Chains with Correct Termination
- Implement Local Scopes for Reusable Constraints
- Implement Dynamic Scopes with Whitelist Dispatch

## Success Criteria
- All conditional branches produce correct SQL
- Callbacks explicitly return builder — no silent no-ops
- Side effects separated from query construction
- Recurring patterns extracted to named scopes
