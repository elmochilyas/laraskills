# Skill: Design Functional/Expression Indexes

## Purpose

Create indexes on the result of an expression (not a raw column value) — `LOWER(email)`, `EXTRACT(YEAR FROM date)`, JSON path extraction — to make sargable queries that use functions in WHERE clauses, available in PostgreSQL and MySQL 8.0+.

## When To Use

- Case-insensitive unique constraints (`LOWER(email)`)
- Date-part filtering (`EXTRACT(YEAR FROM created_at)`)
- JSON path indexing for specific keys
- Queries that wrap columns in functions

## When NOT To Use

- Columns that can be rewritten without functions (use range instead of DATE())
- Volatile functions (random(), now())
- Functions that don't appear in the query WHERE clause

## Prerequisites

- Understanding of sargability and function wraps
- PostgreSQL or MySQL 8.0+ (earlier MySQL needs generated columns)

## Inputs

- Expression used in the WHERE clause
- Column data types
- Database type (PostgreSQL vs MySQL)

## Workflow

1. Identify the function wrapping a column in WHERE: `WHERE LOWER(email) = ?`
2. Create an index on the exact same expression: `CREATE INDEX ON users (LOWER(email))`
3. Ensure the query expression matches the index expression exactly
4. For MySQL 8.0+: `CREATE INDEX ON users ((LOWER(email)))`
5. Verify with EXPLAIN

## Validation Checklist

- [ ] Index expression exactly matches the query expression
- [ ] Function is immutable (same input always produces same output)
- [ ] MySQL 8.0+ for functional indexes on expressions
- [ ] B-Tree alternative (rewriting without function) was considered

## Common Failures

### Expression mismatch
Index on `LOWER(email)` but query uses `LCASE(email)`. Different function, index not used.

### Expression index on volatile function
`CREATE INDEX ON users (random())` — useless because the value changes constantly.

## Decision Points

### Functional index vs rewriting query?
Prefer rewriting the query to avoid function wraps (sargable). Use functional indexes when rewriting is impossible or impractical.

### Functional index vs generated column?
Functional index indexes the expression directly. Generated column stores a pre-computed value. Functional index is simpler; generated column allows regular index on a stored value.

## Performance Considerations

Functional indexes add write overhead because the function must be computed for every INSERT/UPDATE. The function should be fast (LOWER, EXTRACT, JSON extraction).

## Security Considerations

Functional indexes for case-insensitive uniqueness can prevent duplicate account creation with different casing. Ensure the function doesn't expose data through timing attacks.

## Related Rules

- Match the index expression exactly to the query expression
- Use only immutable functions in expression indexes
- Consider rewriting the query as an alternative

## Related Skills

- Apply the Sargability Rule for Index-Friendly WHERE Conditions
- Design GIN Indexes for JSONB and Full-Text
- Index Soft Delete Columns Effectively

## Success Criteria

- Expression indexes created for non-sargable function wraps
- Query expression exactly matches index expression
- Function is immutable (deterministic)
- EXPLAIN confirms index usage for the expression query
