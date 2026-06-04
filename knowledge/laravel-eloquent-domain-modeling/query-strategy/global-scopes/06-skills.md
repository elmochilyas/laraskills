# Skill: Implement Global Scopes for Cross-Cutting Query Constraints

## Purpose
Define global scopes that automatically apply cross-cutting constraints (multi-tenant isolation, soft deletes, published-only filtering) to every query on a model, with performant `apply()` methods and proper security considerations.

## When To Use
- Multi-tenant data isolation (always filter by `tenant_id`)
- Soft deletes (always exclude soft-deleted records)
- Published content filtering (only show published records)
- Language/locale filtering in multilingual apps
- Access control (only show records owned by the current user)

## When NOT To Use
- Optional filters that should be explicitly applied — use local scopes
- Constraints requiring frequent suppression — indicates it shouldn't be global
- Database queries inside `apply()` — the scope runs on every query
- Models where Query Builder queries must also apply the constraint — QB bypasses scopes
- Scopes that change behavior based on request state without clear documentation

## Prerequisites
- Understanding of the `Scope` interface
- Service provider or attribute-based registration
- Knowledge of security implications

## Inputs
- Cross-cutting constraint logic (WHERE clause, JOIN)
- Scope class or anonymous closure
- Registration method (`#[ScopedBy]` attribute or `booted()`)

## Workflow
1. Create a scope class implementing the `Scope` interface (one class per concern)
2. In `apply()`: add only query constraints — no database queries, no external calls
3. Register the scope:
   - Laravel 11+: use `#[ScopedBy(ScopeClass::class)]` attribute on the model
   - Laravel 10-: call `static::addGlobalScope(new ScopeClass())` in `booted()`
4. Add a database index on the column used in the scope's WHERE clause
5. Document every global scope on the model class with a docblock
6. Test both suppression paths (with `withoutGlobalScope()`) and normal application
7. Never rely on `DB::table()` for queries that need global scope constraints

## Validation Checklist
- [ ] Each global scope has a dedicated scope class with single responsibility
- [ ] `apply()` methods contain no database queries or external calls
- [ ] Global scopes documented on the model class (docblock or README)
- [ ] Suppression paths tested for correctness and security
- [ ] No unintentional `withoutGlobalScopes()` calls
- [ ] QB queries on models with security-critical scopes are reviewed
- [ ] Index exists for columns used in global scope WHERE clauses

## Common Failures
- Forgetting to register the scope — define the class but never call `addGlobalScope()`
- Unintentional `withoutGlobalScopes()` — calling with no arguments removes ALL scopes
- Scope on wrong model — putting a tenant scope on a related model instead of the main model
- Running queries inside `apply()` — adds a query to every model operation
- Assuming Query Builder uses scopes — `DB::table('users')` does not apply Eloquent scopes
- Forgetting that relationship queries also apply global scopes

## Decision Points
- `#[ScopedBy]` attribute vs `booted()`: use `#[ScopedBy]` (Laravel 11+) for declarative, visible registration; use `booted()` only for dynamic registration logic
- Class-based scope vs anonymous closure: use class-based for named suppression and single responsibility; use anonymous closures for simple, never-suppressed constraints

## Performance Considerations
- Global scopes call `apply()` on every query — the method must be lightning fast
- Complex scopes with joins or subqueries add cost to EVERY query on the model
- Index the columns used in global scope WHERE clauses
- Multiple global scopes compound — profile combined scope performance

## Security Considerations
- Global scopes can enforce security boundaries (multi-tenant isolation) — treat suppression as a security decision
- Query Builder bypasses all global scopes — never use QB for queries depending on scope security
- Scope suppression without permission check is a security vulnerability
- Anonymous closure scopes are harder to suppress by class name — prefer named classes

## Related Rules
- Keep apply() Methods Lightning Fast (query-strategy/global-scopes)
- Use #[ScopedBy] Attribute Over booted() for Scope Registration (query-strategy/global-scopes)
- Test Each Suppression Path (query-strategy/global-scopes)
- One Scope Class Per Concern (query-strategy/global-scopes)
- Document Every Global Scope on the Model Class (query-strategy/global-scopes)
- Never Rely on Query Builder for Queries Needing Global Scope Constraints (query-strategy/global-scopes)
- Index the Columns Used in Global Scope WHERE Clauses (query-strategy/global-scopes)

## Related Skills
- Suppress Global Scopes Safely with Permission Gating
- Implement Local Scopes for Reusable Constraints
- Choose Between Eloquent and Query Builder

## Success Criteria
- Global scope correctly filters all queries on the model
- `apply()` method contains no database queries or I/O
- Suppression paths tested and working correctly
- Index exists on the scope's WHERE column
- All developers on the team are aware of which scopes are applied
- Security-critical scopes never bypassed via Query Builder
