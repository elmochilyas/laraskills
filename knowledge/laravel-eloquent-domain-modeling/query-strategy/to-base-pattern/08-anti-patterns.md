# Anti-Patterns: To Base Pattern

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** To Base Pattern

## Anti-Patterns

### Early toBase
Calling `toBase()` before applying scopes or constraints specific to Eloquent. Constraints added after `toBase()` are applied to the underlying Query Builder, bypassing Eloquent features like global scope re-application.

**Problem:** Scopes and constraints applied after `toBase()` may not benefit from Eloquent's scope re-application logic; inconsistent behavior.

**Solution:** Call `toBase()` at the end of the chain, after all Eloquent-specific constraints are applied.

### Lost Eager Loads
Using `with()` then `toBase()` without converting to explicit JOINs or subqueries. `toBase()` does NOT preserve eager loads — the `with()` calls are silently ignored.

**Problem:** Missing relationship data in results without any error; silent data loss; debugging time wasted on "missing" related data.

**Solution:** Replace all `with()` calls with explicit JOINs or subqueries before calling `toBase()`. Only use `toBase()` without eager loads when relationship data is not needed.

### Shared Mutations
Modifying the `toBase()` return value and unintentionally changing the original Eloquent Builder. `toBase()` returns a reference to the SAME internal Query Builder instance.

**Problem:** Silent mutation of Eloquent builder state; unexpected filters appearing in queries; debugging time wasted.

**Solution:** Clone the underlying Query Builder (`clone $builder->getQuery()`) when you need to modify the query independently without affecting the original.

### toBase for Single Row
Using `toBase()` for a `find()` or `first()` query where savings are negligible (~2-5µs). The loss of model features (accessors, casts, methods) outweighs the tiny performance gain.

**Problem:** Loss of model features with no measurable performance benefit; code that optimizes prematurely; reduced readability for no gain.

**Solution:** Use Eloquent for single-record queries. Reserve `toBase()` for result sets > 100 rows where savings are measurable.

### Hidden toBase
Using `toBase()` in a repository without documenting the non-model return type. Callers expect hydrated models and get `stdClass`, causing runtime errors.

**Problem:** Runtime errors when callers try to call model methods on `stdClass` results; confusion about return types; debugging time wasted.

**Solution:** Document that a query uses `toBase()` and returns `stdClass` (not models). Add return type hints and docblocks.

### Skipping to DB::table()
Jumping directly to `DB::table()` without trying `toBase()` first. `toBase()` provides ~80% of the performance benefit with minimal code changes while preserving all Eloquent constraints.

**Problem:** Unnecessary code complexity; duplicated scope logic; higher risk from bypassed security scopes; more difficult refactoring.

**Solution:** Use `toBase()` as the first optimization step before considering `DB::table()`. Only skip to raw QB when `toBase()` is insufficient.

### Not Verifying Scopes
Assuming global scopes are preserved with `toBase()` without verification. Some global scopes apply at execution time — `toBase()` transfers control to the Query Builder earlier, potentially before certain scopes have been applied.

**Problem:** Security-critical global scopes silently bypassed; multi-tenant data leakage; soft-deleted records in output.

**Solution:** Compare the SQL output with `toSql()` before and after `toBase()` to confirm all global scopes are applied identically in both paths.
