# Anti-Patterns: Decision Framework

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Decision Framework

## Anti-Patterns

### Eloquent for Everything
Using Eloquent for bulk reporting/export queries with 100k+ rows. Eloquent hydration adds 2-5µs per model and 2-4KB memory per model — at 50k rows this is 100-250ms and 100-200MB of unnecessary overhead.

**Problem:** Memory exhaustion, slow response times, higher hosting costs from unnecessary hydration of large result sets.

**Solution:** Use `toBase()` as the first optimization step to skip hydration while preserving Eloquent builder features. For maximum performance, use Query Builder for read-heavy analytics paths.

### Query Builder for Everything
Losing model events, scopes, and relationship features across the codebase by using `DB::table()` for all queries. Query Builder bypasses Eloquent events (`created`, `saved`, `deleted`), global scopes (soft deletes, tenant isolation), and relationship features.

**Problem:** Stale cache entries from bypassed events; missing audit trails; multi-tenant data leakage; soft-deleted records in user-facing results.

**Solution:** Use Eloquent as the default for all queries. Reserve Query Builder for specific read-heavy paths where profiling confirms a bottleneck.

### Premature QB
Switching to Query Builder before profiling confirms a bottleneck. For typical web requests (1-50 records), the overhead of Eloquent is ~0.1-0.25ms — invisible to users.

**Problem:** Increased code complexity; loss of model features; optimization effort wasted on non-bottlenecks.

**Solution:** Always start with Eloquent. Profile first. Only optimize when profiling confirms a measurable bottleneck.

### Mixed Signals
Using Eloquent for SELECT and Query Builder for UPDATE/INSERT on the same model in the same request. This creates inconsistent behavior — events fire on some paths but not others.

**Problem:** Inconsistent caching, auditing, and business logic execution depending on which code path is taken.

**Solution:** Choose one approach per model per request. Use Eloquent for writes (events needed) and consider `toBase()` for reads.

### Hidden QB
Using `DB::table()` inside an Eloquent model method, bypassing the model's own scopes. This is especially dangerous when the model has security-critical global scopes.

**Problem:** Security-critical scopes silently bypassed within the model itself; data leakage from self-inflicted scope bypass.

**Solution:** Never use `DB::table()` inside model methods. If raw operations are needed, use `toBase()` or document the bypass with explicit justification.
