# Skill: Suppress Global Scopes Safely with Permission Gating

## Purpose
Temporarily remove specific global scopes from a query (e.g., for admin panels, data exports) with proper permission checks, audit logging, and precise scope targeting to avoid security breaches.

## When To Use
- Admin panels showing soft-deleted records
- Data exports including all tenants' data (admin-only, permission-gated)
- Selective feature bypassing a specific constraint for edge cases
- Testing — verifying behavior with and without a global scope
- Scheduled jobs that need to process all records

## When NOT To Use
- `withoutGlobalScopes()` (all scopes) when only one scope is needed
- Suppression for regular user-facing queries — use local scopes instead
- Suppression without a permission check for security-enforcing scopes
- Suppression on stored/reused builder instances — the suppression persists
- Suppressing scopes in library/package code without documentation

## Prerequisites
- Understanding of global scope registration and behavior
- Permission/authorization system
- Knowledge of which scopes are security-critical

## Inputs
- Query builder instance
- Scope class name(s) to suppress
- Permission check logic
- Business reason for suppression

## Workflow
1. Identify the exact scope class to suppress — use `withoutGlobalScope(Specific::class)`
2. Prefer `withTrashed()` over `withoutGlobalScope(SoftDeletingScope::class)` for soft deletes
3. Gate suppression behind a permission check: `$query->when($user->isAdmin(), fn($q) => $q->withoutGlobalScope(...))`
4. Add a code comment explaining the business reason for suppression
5. Log the suppression event with user ID and reason for audit trails
6. Test both suppressed and unsuppressed query paths
7. Encapsulate suppression logic in named methods (query objects, repositories)

## Validation Checklist
- [ ] All suppression calls specify which scope(s) to suppress, not blanket `withoutGlobalScopes()`
- [ ] Suppression gated behind permission checks for security scopes
- [ ] Suppression reason documented in code comments
- [ ] Suppressed queries tested for correct expanded results
- [ ] No suppressed builder instances stored and reused across requests
- [ ] Audit trail captures suppression events
- [ ] Relationship builder suppression handled independently of parent builder

## Common Failures
- Calling `withoutGlobalScopes()` (all scopes) when only one scope is intended — removes security scopes
- Suppressing the wrong scope class name (case-sensitive, must match exactly)
- Suppressing scope after execution — calling on an already-executed query
- Assuming suppression applies to related queries — suppress on relationship builder separately
- Storing a suppressed builder and reusing it — scope remains suppressed

## Decision Points
- `withoutGlobalScope(Specific::class)` vs `withoutGlobalScopes()`: always use the specific form — never use blanket removal
- `withTrashed()` vs `withoutGlobalScope(SoftDeletingScope::class)`: use `withTrashed()` — it's self-documenting and standard

## Performance Considerations
- Suppression itself is negligible — simple array removal
- Removing a scope may remove an index-friendly WHERE clause, causing full table scans
- Test query plans before and after suppression to ensure performance is acceptable
- Suppression affects the Query Builder clone internally — no additional query cost

## Security Considerations
- CRITICAL: suppressing a multi-tenant scope exposes all tenants' data
- CRITICAL: suppressing without permission check is a data breach vector
- Suppression is per-builder-instance — if the builder is reused, the scope stays suppressed
- Auditing: log all suppression events with user ID and reason
- Code review: every suppression call should have an explicit permission check

## Related Rules
- Always Use withoutGlobalScope(Specific::class) Instead of withoutGlobalScopes() (query-strategy/global-scope-suppression)
- Gate Scope Suppression Behind Permission Checks (query-strategy/global-scope-suppression)
- Prefer withTrashed() over withoutGlobalScope(SoftDeletingScope::class) (query-strategy/global-scope-suppression)
- Encapsulate Suppression in Named Query Methods (query-strategy/global-scope-suppression)
- Document Why Each Suppression Is Needed (query-strategy/global-scope-suppression)
- Log All Scope Suppression Events for Audit Trails (query-strategy/global-scope-suppression)
- Never Suppress Scopes on Stored or Reused Builder Instances (query-strategy/global-scope-suppression)

## Related Skills
- Implement Global Scopes for Cross-Cutting Concerns
- Implement toBase Pattern for Hydration Bypass
- Choose Between Eloquent and Query Builder

## Success Criteria
- All suppression calls specify exact scope class — no blanket removal
- Permission checks gate every security-relevant suppression
- Audit trail captures user ID, scope, reason, and timestamp for each suppression
- Suppressed and unsuppressed paths both tested
- No suppressed builder instances leak across requests
