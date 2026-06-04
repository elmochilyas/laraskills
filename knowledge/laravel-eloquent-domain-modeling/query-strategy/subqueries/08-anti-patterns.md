# Anti-Patterns: Subqueries

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Subqueries

## Anti-Patterns

### Correlated Subquery in Loop
A correlated subquery inside a PHP loop is effectively N+1 at the database level. Each iteration executes a separate correlated subquery against the database.

**Problem:** N+1 query pattern at the database level; severe performance degradation from repeated subquery execution.

**Solution:** Use a single query with joins or `addSelect()` with a correlated subquery instead of looping. Keep subquery execution in the database, not in PHP loops.

### Raw String Subqueries
Using `DB::raw("(SELECT ...)")` with string interpolation instead of closure-based subqueries. Raw strings require manual `?` placeholder management and binding merging.

**Problem:** SQL injection vulnerability from unescaped raw SQL strings; binding order mismatches causing data corruption; reduced portability across database drivers.

**Solution:** Use closure-based subquery syntax for automatic binding management. Reserve `DB::raw()` only for database-specific features not supported by the builder.

### Subquery for Simple Joins
Using a subquery when a simple `LEFT JOIN` would be faster and clearer. Subqueries (especially correlated ones) execute per outer row and may prevent index usage.

**Problem:** Slower query execution than equivalent JOIN; harder-to-read SQL; potential for incorrect results from missing correlation.

**Solution:** Use JOINs for simple related data access. Reserve subqueries for "latest X per Y" patterns, scalar aggregations, and existence checks.

### Hidden Subqueries
Subqueries inside accessors or computed attributes that fire on every row access. Each accessor invocation triggers the subquery independently.

**Problem:** N+1 performance problem hidden inside what looks like a simple attribute access; unexpected database load.

**Solution:** Eager-load subquery results via `addSelect()` on the initial query. Avoid database queries inside accessors.

### Unbounded Subqueries
Subqueries without `LIMIT 1` that could return multiple rows in scalar context. A scalar subquery that returns multiple rows causes a database error.

**Problem:** "Subquery returns more than 1 row" runtime error in production; 500 errors for users; downtime.

**Solution:** Always append `->take(1)` to any subquery used in a scalar context (SELECT column, WHERE comparison, ORDER BY).

### Missing Correlation
A correlated subquery without `whereColumn()` linking to the outer query. The subquery runs once and returns the same value for every row — almost always a logic error.

**Problem:** Silent incorrect results — every row shows the same value; data corruption in reports and exports.

**Solution:** Always include `whereColumn()` to link the inner query to the outer query. Verify correlation with `toSql()`.

### Missing Alias
A subquery SELECT without an alias causes a SQL syntax error in most databases. The query fails at execution time with an unhelpful error.

**Problem:** SQL syntax errors at query execution time; production outages; wasted debugging time.

**Solution:** Always provide an alias for every subquery used in a SELECT clause. Use `addSelect(['alias' => $subQuery])` or the second argument of `selectSub()`.
