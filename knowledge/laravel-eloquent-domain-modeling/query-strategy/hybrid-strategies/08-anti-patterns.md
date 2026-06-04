# Anti-Patterns: Hybrid Strategies

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Hybrid Strategies

## Anti-Patterns

### Hybrid Sprawl
Inline `toBase()` calls scattered across 20+ controllers instead of encapsulated in query objects. Hybrid patterns are optimization decisions with trade-offs — scattering them makes them impossible to audit or refactor.

**Problem:** Scattered optimization logic impossible to audit; difficulty measuring performance impact; high refactoring cost when the hybrid strategy needs to change.

**Solution:** Encapsulate all hybrid query logic in dedicated query-object or repository classes. Never write inline `toBase()` or `getQuery()` calls in controllers.

### Expensive Hydration
Calling `Model::hydrate()` on 10k+ rows after using `toBase()`. Manual hydration calls all the same model instantiation, trait booting, and attribute casting logic as Eloquent.

**Problem:** Double overhead (stdClass + hydration) with no performance benefit; increased memory usage; confusion about whether the path is optimized.

**Solution:** Either stay with `stdClass` results for performance, or use Eloquent directly if models are needed. Selective hydration is acceptable only for individual rows.

### Lost Scopes
Assuming all global scopes work transparently with `toBase()` without verification. Some global scopes apply at execution time (during `get()`) rather than at construction time.

**Problem:** Security-critical global scopes silently bypassed; multi-tenant data leakage; soft-deleted records appearing in output.

**Solution:** Test that all global scopes are correctly applied when using `toBase()`. Compare the SQL produced with and without `toBase()`.

### Ignored Eager Loads
Using `with()` then `toBase()` and wondering why relations aren't loaded. `toBase()` does NOT preserve eager loads — the `with()` calls are silently ignored.

**Problem:** Missing relationship data in results without any error; silent data loss; debugging time wasted.

**Solution:** Replace all `with()` calls with explicit JOINs or subqueries before calling `toBase()`. Only use `toBase()` without eager loads when relationship data is not needed.

### Manual Raw
Dropping to raw `DB::raw()` when `toBase()` would suffice. `toBase()` preserves all Eloquent builder constraints applied before it while `DB::raw()` bypasses them entirely.

**Problem:** Unnecessary complexity; loss of Eloquent builder features; duplicated scope logic across codebase.

**Solution:** Use `toBase()` as the primary hybrid tool. It provides ~80% of the performance benefit with 10% of the code change. Only use `DB::raw()` for database-specific features.

### Premature Hybrid
Applying hybrid patterns before profiling confirms hydration is a bottleneck. For result sets under 100 rows, the savings from `toBase()` are negligible (~20-50µs).

**Problem:** Optimization effort wasted on non-bottleneck; unnecessary code complexity; reduced readability for no measurable gain.

**Solution:** Profile first. Only apply hybrid patterns when profiling confirms that hydration overhead is a measurable bottleneck.
