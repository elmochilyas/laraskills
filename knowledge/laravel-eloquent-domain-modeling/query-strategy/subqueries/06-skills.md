# Skill: Write Advanced Subqueries with Closure-Based Builder Syntax

## Purpose
Embed SELECT statements within other query clauses using Eloquent's closure-based subquery syntax — enabling single-query optimizations like "latest post per user" or "count of related records as a column" without raw SQL.

## When To Use
- "Latest X per Y" queries (latest post per user, last login per account)
- Aggregation columns from related tables without joins (count, sum, latest date)
- Existence checks where `has()` / `whereHas()` produce suboptimal SQL
- ORDER BY based on related data: `orderByDesc(Login::select('created_at')->whereColumn(...))`
- Filtering by aggregated conditions: users with more than 5 orders

## When NOT To Use
- Correlated subqueries for large result sets where joins would be more efficient
- Subqueries in SELECT when the subquery may return multiple rows (use `take(1)`)
- When a simple `withCount()` or `withExists()` suffices — prefer those first
- Deeply nesting subqueries beyond 2-3 levels

## Prerequisites
- Builder Fundamentals — constraint methods and binding management
- Understanding of correlated vs uncorrelated subqueries

## Inputs
- Outer query builder
- Subquery builder with SELECT, WHERE, and correlation conditions
- Subquery alias for SELECT clauses

## Workflow
1. Use closure-based subquery syntax instead of raw SQL strings for automatic binding management
2. Provide an alias for every subquery in SELECT: `addSelect(['alias' => $subQuery])`
3. Add `->take(1)` to scalar subqueries to prevent multi-row errors
4. For correlated subqueries: always include `whereColumn()` to link inner to outer query
5. Prefer `withCount()`, `withExists()`, `withSum()` etc. before writing manual subqueries
6. Verify subquery SQL with `toSql()` before deploying
7. Encapsulate common subquery patterns (used in 3+ places) as builders methods or scopes

## Validation Checklist
- [ ] Subquery closures use automatic binding management (no raw strings)
- [ ] All subquery selects have aliases
- [ ] Scalar subqueries include `->take(1)` to prevent multi-row errors
- [ ] Correlated subqueries include `whereColumn()` linking to outer query
- [ ] SQL verified with `toSql()` and `explain()`
- [ ] Subquery performance tested against actual data volumes
- [ ] Common subquery patterns extracted to named builder methods

## Common Failures
- Missing `whereColumn` correlation — subquery returns the same scalar for all rows
- Subquery in SELECT without alias — SQL syntax error
- Binding order mismatch when mixing `whereRaw` with subqueries
- Over-nesting — subqueries 4+ levels deep are nearly impossible to debug
- Scalar subquery returns multiple rows — always ensure aggregate subqueries return one row

## Decision Points
- Closure-based vs raw SQL: always prefer closure-based for automatic binding management and SQL injection safety
- `withCount()` vs manual subquery: use `withCount()` / `withExists()` for simple relationship aggregates before writing manual subqueries
- Correlated vs uncorrelated: use correlated for per-row computation; use uncorrelated for single-execution subqueries

## Performance Considerations
- Correlated subqueries execute per outer row — expensive on large tables
- `whereExists` with `SELECT 1` is the most efficient existence check
- Subqueries in ORDER BY may prevent index usage — test with `EXPLAIN`
- Deep nesting may hit database binding limits
- Database optimizers may materialize or flatten subqueries; test with actual data volumes

## Security Considerations
- Closure-based subqueries use parameterized bindings automatically — safe from SQL injection
- Raw subqueries (`DB::raw('(SELECT ...)')`) must use `?` placeholders for user input
- Validate any user-provided values used inside subquery closures

## Related Rules
- Use Closure-Based Subqueries Over Raw SQL Strings (query-strategy/subqueries)
- Always Alias Subquery Selects (query-strategy/subqueries)
- Add take(1) to Scalar Subqueries to Prevent Multi-Row Errors (query-strategy/subqueries)
- Always Include whereColumn in Correlated Subqueries (query-strategy/subqueries)
- Use withCount() and withExists() Before Writing Manual Subquery Selects (query-strategy/subqueries)
- Encapsulate Common Subquery Patterns as Scopes or Builder Methods (query-strategy/subqueries)
- Verify Subquery SQL with toSql() Before Deploying (query-strategy/subqueries)

## Related Skills
- Optimize Subquery Performance with Indexing
- Implement toBase Pattern for Hydration Bypass
- Compose Conditional Query Chains with when()

## Success Criteria
- Subquery uses closure-based syntax — no raw SQL strings
- All subquery selects include aliases
- Scalar subqueries include `->take(1)` — no multi-row errors
- Correlated subqueries use `whereColumn()` for proper correlation
- SQL verified with `toSql()` before deployment
