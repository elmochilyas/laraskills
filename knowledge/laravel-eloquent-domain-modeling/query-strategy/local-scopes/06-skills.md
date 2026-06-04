# Skill: Implement Local Scopes for Reusable Query Constraints

## Purpose
Create named, reusable query constraints as local scopes on Eloquent models, providing a fluent, domain-readable API for common query patterns.

## When To Use
- Reusable query constraints used in multiple places (controllers, jobs, tests)
- Domain-specific query expressions: `active()`, `verified()`, `recent()`
- Parameterized filters: `ofType('premium')`, `betweenDates($from, $to)`
- Scopes that encapsulate `whereHas` / `whereDoesntHave` logic
- Scopes that add common joins or subqueries used across codebase

## When NOT To Use
- One-off constraints used in a single controller — inline `where()` is fine
- Scopes with side effects (logging, API calls, cache operations)
- Scopes that terminate the query (calling `get()` inside a scope)
- Trivial constraints that add no abstraction value
- 15+ scopes on a single model — extract to custom builder or query objects

## Prerequisites
- Builder Fundamentals — method chaining and constraint methods
- Understanding of the `scope` prefix convention

## Inputs
- Model class
- Reusable constraint logic
- Optional: parameters for parameterized scopes

## Workflow
1. Create a method prefixed with `scope` on the model: `scopeActive(Builder $q): Builder`
2. Always explicitly `return $q` from the scope method
3. Name scopes with domain language (`active()`), not column names (`whereActiveTrue()`)
4. Keep scopes focused on a single constraint — compose at the call site
5. Add return type hints: `public function scopeActive(Builder $q): Builder`
6. Add `@method` PHPDoc annotations on the model for IDE autocompletion
7. Test each scope independently and in combination with other scopes

## Validation Checklist
- [ ] All scope methods explicitly return the builder
- [ ] Scopes named with domain language, not technical column names
- [ ] No side effects (logging, API calls) inside scope methods
- [ ] Scopes tested independently and in combinations
- [ ] No terminating methods (`get`, `first`) inside scopes
- [ ] Model has < 15 scopes (otherwise extract to custom builder)
- [ ] `@method` annotations added to model for IDE support

## Common Failures
- Forgetting to return the builder — the scope silently does nothing
- Modifying a different builder instance inside the scope (captured from outer scope)
- Naming collision: `scopeWhereStatus` collides with dynamic `whereStatus` — use domain names
- Terminating scope: calling `$q->get()` inside a scope instead of constraining
- Over-narrowing: scope that adds both a filter and a limit — better as two separate scopes

## Decision Points
- Local scope vs inline `where()`: use a scope when the constraint is used in multiple places; inline for one-off constraints
- Local scope vs custom builder method: use scopes on the model for <15 scopes; extract to a custom builder when exceeding 15
- Domain naming vs technical naming: always use domain language — `active()`, not `whereStatusActive()`

## Performance Considerations
- Scope invocation overhead is negligible (one extra method call per scope)
- Scopes that use joins or subqueries add database cost — profile with `explain()`
- Chaining many scopes can produce complex SQL — verify with `toSql()`
- Reusing scopes in loops is fine; rebuilding the query in each iteration is not

## Security Considerations
- Parameterized scopes accept user input — validate parameters before passing
- Scopes that accept column names should whitelist allowed columns
- Avoid scopes that accept raw SQL fragments
- Document any scope that bypasses security constraints (e.g., `withTrashed()`)

## Related Rules
- Always Explicitly return $q from Scope Methods (query-strategy/local-scopes)
- Name Scopes with Domain Language, Not Column Names (query-strategy/local-scopes)
- Keep Scopes Focused on a Single Constraint (query-strategy/local-scopes)
- Never Terminate the Query Inside a Scope (query-strategy/local-scopes)
- Limit Scopes to 15 Per Model (query-strategy/local-scopes)
- Use @method Annotations for IDE Autocompletion on Scopes (query-strategy/local-scopes)
- Test Each Scope Independently and in Combinations (query-strategy/local-scopes)

## Related Skills
- Implement Domain-Specific Query Methods on Custom Builders
- Implement Dynamic Scopes with Whitelisted Dispatch
- Implement Custom Builder Pattern for Rich Query APIs

## Success Criteria
- All scopes explicitly return builder — no silent no-ops
- Scope names use domain language understood by non-technical stakeholders
- Each scope focuses on a single constraint — composable at call site
- Scopes tested at SQL level both independently and in combination
- Model stays under 15 scopes; otherwise extracted to custom builder
- IDE autocompletion works for all scopes
