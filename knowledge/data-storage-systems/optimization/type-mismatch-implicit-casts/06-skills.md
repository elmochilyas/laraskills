# Skill: Prevent Implicit Type Cast Mismatches

## Purpose
Prevent implicit type conversion that bypasses indexes by ensuring query parameters match column types.

## When To Use
- When writing WHERE conditions on string columns with numeric-looking values
- When establishing foreign key relationships
- When receiving parameters from HTTP requests

## When NOT To Use
- When types already match (implicit cast won't occur)

## Prerequisites
- Understanding of MySQL/PostgreSQL type casting rules
- Knowledge of Eloquent attribute casting

## Inputs
- Query comparing a column to a potentially mismatched type

## Workflow
1. Identify column types in WHERE conditions
2. Check if the bound parameter type matches the column type
3. For string columns: ensure values are cast to string: `where('uuid', (string) $value)`
4. For FK relationships: ensure both sides use same type (`foreignId()` = `unsignedBigInteger`)
5. Verify with EXPLAIN that index is used

## Validation Checklist
- [ ] Query parameters explicitly cast to match column types
- [ ] FK and referenced PK use identical types
- [ ] `$request` input cast before use in queries
- [ ] EXPLAIN shows index usage

## Common Failures
- Request parameter not cast: `where('uuid', $request->uuid)` — if null or integer, implicit cast occurs
- FK type mismatch: `string` UUID PK with `unsignedBigInteger` FK
- `where('status', $value)` with `$value` as integer when column is varchar

## Decision Points
- Cast in PHP before passing to query: `(string)`, `(int)`, `(float)`
- Use Eloquent `$casts` property for attribute type enforcement
- Use migration type hints to ensure consistent column definitions

## Performance
- Implicit cast: full table scan — O(n), column value cast per row
- Correct type: index lookup — O(log n)
- Wrong results on MySQL: non-numeric strings cast to 0

## Security
- Type confusion can expose unintended data (string "admin" = 0 matches many rows)
- Explicit casting prevents SQL injection from type-based attacks

## Related Rules
- 4-12-1: Always EXPLAIN Before Optimizing
- 4-12-4: Review And Apply Core Concepts

## Related Skills
- Write Sargable WHERE Conditions

## Success Criteria
- Query parameters match column types exactly
- EXPLAIN confirms index usage
- No implicit cast warnings in query logs
