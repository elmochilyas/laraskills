# Skill: Detect Implicit Type Conversion That Breaks Indexes

## Purpose

Prevent implicit type conversion in WHERE conditions that bypasses indexes — by comparing values with the correct type matching the column definition, casting PHP values to match database column types, and ensuring FK/PK column types are consistent.

## When To Use

- Writing WHERE conditions for string columns
- Defining FK columns referencing PKs
- Passing values from request inputs to query builder
- Debugging queries that don't use expected indexes

## When NOT To Use

- Integer-to-integer or string-to-string comparisons (no conversion needed)
- Columns with matching types in PHP and database

## Prerequisites

- Understanding of how database engines coerce types in comparisons
- Knowledge of column types in the schema

## Inputs

- Column type (VARCHAR, INTEGER, BIGINT, etc.)
- PHP value type being compared
- EXPLAIN output showing unexpected full table scan

## Workflow

1. Identify the column type in the database schema
2. Ensure the PHP comparison value matches: `->where('status', (string) $request->status)` for VARCHAR columns
3. For FK columns: ensure FK column type matches the referenced PK column type
4. Check EXPLAIN for "Using where" with type=ALL (full table scan)
5. Fix by casting the input to match the column type

## Validation Checklist

- [ ] String columns compared with string values, not integers
- [ ] FK column types match their referenced PK types
- [ ] Eloquent query bindings use correct types
- [ ] EXPLAIN shows index usage after type fixes

## Common Failures

### Eloquent's automatic type binding
Eloquent passes values as-is to PDO. If the controller passes an integer from request validation, it compares against a string column without explicit casting.

## Decision Points

### Cast input or cast column?
Always cast the input to match the column type. Casting the column in SQL (CAST(col AS ...)) breaks sargability.

### Schema design vs query casting?
Prefer matching types in schema design. When types differ (legacy schema), cast the input value, not the column.

## Performance Considerations

Implicit type conversion can cause full table scans on previously indexed queries. The EXPLAIN output shows type=ALL instead of type=ref or type=range.

## Security Considerations

Type conversion doesn't directly affect security. However, unexpected type coercion can cause incorrect results (e.g., string "0" matching integer 0 for all non-numeric strings) that may bypass authorization.

## Related Rules

- Cast input values to match column types
- Ensure FK/PK column types match
- Check EXPLAIN for type conversion issues

## Related Skills

- Apply the Sargability Rule for Index-Friendly WHERE Conditions
- Design B-Tree Indexes for Equality and Range Queries
- Index Foreign Key Columns for JOIN Performance

## Success Criteria

- All WHERE comparisons use matching types (string vs string, int vs int)
- FK columns have matching types with their referenced PKs
- EXPLAIN shows index usage after type fixes
- No unexpected type coercion in query execution
