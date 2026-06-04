# Decomposition: Subqueries

## Knowledge Unit Breakdown

### 1. Subquery Select
- 1.1 `addSelect(['alias' => $subQuery])` pattern
- 1.2 `selectSub($query, $alias)` explicit method
- 1.3 Closure-based subquery in `addSelect`
- 1.4 Correlated subquery in select
- 1.5 Aggregation subqueries (count, sum, max, min)

### 2. Subquery Where
- 2.1 Closure-based `where(fn $q => ...)` with subquery select
- 2.2 `whereIn($column, fn $q => ...)`
- 2.3 `whereNotIn($column, fn $q => ...)`
- 2.4 `whereExists(fn $q => ...)`
- 2.5 `whereNotExists(fn $q => ...)`
- 2.6 Comparison operators with subqueries: `where($column, $operator, fn $q => ...)`

### 3. Subquery From
- 3.1 `from(fn $q => ..., $alias)`
- 3.2 `table(fn $q => ..., $alias)`
- 3.3 Derived table patterns
- 3.4 Naming and alias requirements

### 4. Subquery in Order By
- 4.1 `orderBy($subQuery, $direction)`
- 4.2 `orderByDesc($subQuery)`
- 4.3 Performance implications

### 5. Correlated vs Non-Correlated Subqueries
- 5.1 Correlation via `whereColumn`
- 5.2 Execution plan differences
- 5.3 When the optimizer materializes subqueries
- 5.4 Performance characteristics

### 6. Binding Management
- 6.1 Subquery binding extraction
- 6.2 Merging into parent binding arrays
- 6.3 Binding position preservation
- 6.4 Raw bindings in subqueries

### 7. Relationship-Based Subqueries
- 7.1 `withExists()` — add exists column for relations
- 7.2 `withCount()` — add count column for relations
- 7.3 `withSum()`, `withAvg()`, `withMax()`, `withMin()`
- 7.4 Subquery select on relationship chains

### 8. JSON and Full-Text Subqueries
- 8.1 JSON column extraction subqueries
- 8.2 Full-text search subqueries (MySQL `MATCH AGAINST`, PostgreSQL `tsvector`)
- 8.3 Raw expression subqueries for database-specific features

### 9. Subquery Optimization
- 9.1 `EXISTS` vs `IN` performance
- 90.2 Materialized subquery CTEs (Common Table Expressions)
- 9.3 Subquery flattening by database optimizers
- 9.4 When to refactor subquery to join

### 10. Testing Subqueries
- 10.1 Verifying SQL output with `toSql()`
- 10.2 Testing correlation correctness
- 10.3 Performance testing with `explain()`
- 10.4 Edge cases: no results, multiple results, null values
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization