# Skill: Apply Column Modifiers for Data Integrity and Migration Safety

## Purpose

Use Blueprint column modifiers (`nullable()`, `default()`, `unsigned()`, `virtualAs()`, `storedAs()`) to enforce schema-level data integrity, support zero-downtime column additions, and enable indexed JSON path expressions — while avoiding common modifier pitfalls during `change()` operations.

## When To Use

- Adding new columns to existing tables
- Setting database-level defaults for business rules
- Creating generated columns for computed values
- Configuring charset and collation per-column

## When NOT To Use

- Default values better handled at the application layer (timezone-sensitive defaults)
- Computed values that depend on application logic not expressible in SQL

## Prerequisites

- Understanding of column types from the Blueprint
- Knowledge of target database row format limitations
- Awareness of MySQL vs PostgreSQL modifier differences

## Inputs

- Column type and name
- Nullability requirement (required or optional)
- Default value expression (constant or SQL expression)
- Generated column expression (for virtualAs/storedAs)
- Charset and collation overrides

## Workflow

1. Determine nullability: use `nullable()` for optional columns, omit for required columns
2. Set default value: use `default($value)` for database-level defaults on INSERT
3. For zero-downtime column additions, add as `nullable()` or with `default()` to prevent NOT NULL violations on existing rows
4. For MySQL table layout, use `after('column')` to position the new column
5. For querying JSON fields, use `virtualAs('data->>"$.field"')->index()` to enable indexed access
6. When using `->change()` to modify a column, re-specify ALL existing modifiers — omitting one drops it
7. Use `unsigned()` on integer FK columns and counters for double the positive range

## Validation Checklist

- [ ] Nullable columns use `nullable()` explicitly
- [ ] New columns on existing tables are nullable or have a default
- [ ] `->change()` calls include all existing modifiers
- [ ] Generated columns use the correct `virtualAs()` vs `storedAs()` based on read/write ratio
- [ ] Charset and collation are specified only when overriding table defaults

## Common Failures

### Modifiers dropped during change()
`$table->string('name')->nullable()->change()` — if the original column had `default('')`, the default is dropped because it wasn't re-specified. Always include ALL original modifiers in change() calls.

### NOT NULL without default on existing tables
Adding a NOT NULL column to a table with existing rows fails immediately. Use `nullable()` or `default()` first, then backfill, then add NOT NULL constraint.

## Decision Points

### nullable() vs default() for zero-downtime?
Use `nullable()` when the column should truly allow NULLs. Use `default()` when the column must have a value but existing rows need a placeholder. Combine both for maximum safety.

### virtualAs vs storedAs?
`virtualAs` computes on read — no storage cost, but computed each time. `storedAs` computes on write — storage cost, but faster reads. Use `virtualAs` for indexing JSON, `storedAs` for frequently read derived values.

## Performance Considerations

`nullable` columns add per-row NULL bitmap overhead in MySQL. `storedAs` adds write cost on every INSERT/UPDATE. `virtualAs` adds read cost on every SELECT referencing the column. `after()` only affects MySQL physical layout — no query performance impact.

## Security Considerations

Default values enforce data consistency but can mask application-level bugs if they silently fill in incorrect values. Review defaults for correctness in all business scenarios.

## Related Rules

- Re-specify all modifiers when using change()
- Add columns as nullable for zero-downtime
- Use virtualAs for JSON path indexing

## Related Skills

- Select Optimal Blueprint Column Types
- Define Foreign Key Constraints
- Create Anonymous Migration Classes

## Success Criteria

- Zero-downtime column additions use nullable() or default()
- JSON path indexes use virtualAs() generated columns
- change() operations preserve all existing modifiers
- NOT NULL enforcement is deferred until after backfill
- Generated columns use virtualAs for indexing, storedAs for frequent reads
