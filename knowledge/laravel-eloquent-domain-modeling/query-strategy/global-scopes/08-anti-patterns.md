# Anti-Patterns: Global Scopes

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Global Scopes

## Anti-Patterns

### Invisible Filter
Global scopes that surprise developers because they're undocumented. A `User::get()` call returns different results depending on which scopes are registered, but calling code sees no indication.

**Problem:** Developers surprised by invisible filters; wasted debugging time; queries returning "wrong" results due to undocumented scopes.

**Solution:** Document every global scope on the model class with a docblock or README. List the scope class name, what it filters, and any security implications.

### Scope Leak
A scope that modifies state beyond the query — e.g., writing to the session, updating a cache, or making an API call inside `apply()`. Global scopes execute on EVERY query for the model.

**Problem:** Side effects triggered on every model query; unpredictable behavior from query construction code.

**Solution:** Restrict `apply()` to adding query constraints only. No database queries, API calls, HTTP requests, or file I/O.

### Heavy Scope
Scopes with JOINs or subqueries that execute on every query for the model. A global scope with a JOIN executes that JOIN on every query — even simple counts.

**Problem:** Every query pays the JOIN cost; complex scopes add cost to simple operations like `count()` or `find()`.

**Solution:** Keep `apply()` to simple WHERE clauses on indexed columns. Move complex logic to local scopes that only apply when explicitly requested.

### False Security
Relying on a global scope for security (multi-tenant isolation, access control) but using Query Builder in some code path. Query Builder bypasses all Eloquent global scopes.

**Problem:** Security-critical scopes silently bypassed via `DB::table()`; multi-tenant data leakage; soft-deleted records in results.

**Solution:** Never use `DB::table()` for queries on models with security-critical global scopes. Audit all Query Builder usage on scoped models.

### Scope Soup
7+ global scopes on a single model — a clear indication of poor separation of concerns. Multiple scopes compound their WHERE clauses, increasing complexity and potential for conflict.

**Problem:** Difficult to understand what filters apply; performance impact from multiple constraints; testing complexity; hard to suppress specific scopes.

**Solution:** Keep one scope per concern. Review whether all scopes genuinely need to be global — some should be local scopes that callers opt into.

### Forgotten Registration
Defining a scope class but never calling `addGlobalScope()` or adding the `#[ScopedBy]` attribute. The scope class exists but is never applied.

**Problem:** Scope constraint not enforced; security-critical filters missing from all queries; silent data exposure.

**Solution:** Verify scope registration immediately after creating the class. Test that the scope is applied to queries.

### Unintentional Blanket Suppression
Calling `withoutGlobalScopes()` with no arguments thinking it requires parameter — removes ALL scopes including security-critical ones. This is easy to type accidentally.

**Problem:** All global scopes removed; security boundaries collapsed; data breach.

**Solution:** Use `withoutGlobalScope(Specific::class)` for single scope suppression. Never call `withoutGlobalScopes()` without explicitly listing which scopes to remove.
