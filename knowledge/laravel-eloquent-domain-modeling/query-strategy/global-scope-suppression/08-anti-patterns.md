# Anti-Patterns: Global Scope Suppression

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Global Scope Suppression

## Anti-Patterns

### Nuclear Option
Using `withoutGlobalScopes()` with no arguments to remove ALL global scopes. This removes security-critical scopes that enforce multi-tenant isolation, soft-delete filtering, and access control.

**Problem:** Critical data breach exposing soft-deleted records, cross-tenant data, or records outside the user's access boundaries; compliance violations; legal liability.

**Solution:** Always specify exactly which scope(s) to suppress using `withoutGlobalScope(ClassName::class)` or `withoutGlobalScopes([Class1, Class2])`. Never use blanket removal.

### Unchecked Suppression
Suppressing a scope without verifying the user has permission. Scope suppression removes constraints that may enforce data security.

**Problem:** Ungated tenant scope suppression exposes all tenants' data; unauthorized users bypass access control.

**Solution:** Gate every scope suppression behind an explicit permission or authorization check. Log all suppression events for audit trails.

### Hidden Suppression
Suppressing scopes deep in a repository or service method without documentation. Developers calling the method are unaware that scope suppression occurs.

**Problem:** Surprising query behavior; difficulty auditing suppression calls; risk of data leakage from undocumented suppression.

**Solution:** Encapsulate suppression in named methods that clearly indicate what is happening (e.g., `includeSoftDeletes()` vs `includeAllTenants()`). Add code comments explaining the business reason.

### Reused Suppression
Storing a builder with suppressed scopes and reusing it for multiple queries. Suppression persists on the builder instance, affecting all subsequent queries.

**Problem:** Scope suppression leaks into unintended queries; data exposure in user-facing pages that should respect scope isolation.

**Solution:** Always create a fresh builder if you need the scope to be applied. Do not store suppressed builder instances.

### Suppression Sprawl
20+ places in the codebase suppressing the same scope without centralization. Scattered suppression calls are impossible to audit, review, or refactor.

**Problem:** Hard-to-find suppression calls during security audit; inconsistent permission gating across suppression locations; increased risk of accidental suppression.

**Solution:** Encapsulate common suppression patterns in repository methods or query objects. Centralize permission gating and audit logging in one place.

### Suppressing Instead of Rethinking
Suppressing a global scope frequently (in 20%+ of queries) indicates the scope shouldn't be global. Frequent suppression is a code smell suggesting the constraint should be a local scope instead.

**Problem:** Global scope applied and removed on many queries — wasted overhead; confusing codebase where the "global" constraint is often bypassed.

**Solution:** Review global scopes with high suppression rates. Convert frequently-suppressed scopes to local scopes that callers opt into.
