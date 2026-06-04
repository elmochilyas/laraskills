# Skill: Select Optimal Blueprint Column Types for Storage Efficiency

## Purpose

Choose and apply the correct Laravel Blueprint column type method for each data field based on its semantic meaning, storage footprint, query patterns, and driver compatibility, ensuring efficient storage, correct indexing, and prevention of silent data truncation.

## When To Use

- Defining columns in migration `up()` methods
- Reviewing existing schema for type appropriateness
- Designing new tables or adding columns to existing tables

## When NOT To Use

- Columns backed by database-specific types not exposed via Blueprint (use raw SQL)
- Transient or computed values better handled at the application layer

## Prerequisites

- Understanding of the data domain and value ranges
- Knowledge of target database engine (MySQL, PostgreSQL, SQLite)
- Awareness of type-specific indexing limitations

## Inputs

- Data field name and semantic type (monetary amount, identifier, text, date)
- Expected value range (minimum and maximum values)
- Query pattern (equality, range, sorting, full-text search)
- Database engine (MySQL, PostgreSQL, SQLite)

## Workflow

1. Identify the semantic type: numeric (amount, count, ID), string (name, description), date/time, JSON, spatial, or binary
2. Choose the smallest type that fits the data: `tinyInteger` for flags, `smallInteger` for small ranges, `integer` for most IDs, `bigInteger` for distributed IDs
3. For monetary values, use `decimal(precision, scale)` or `integer` storing minor units — never `float` or `double`
4. For public-facing identifiers, use `uuid()` or `ulid()` instead of auto-increment
5. For text searchable columns, use `string(length)` instead of `text` to enable full indexing
6. For JSON data in PostgreSQL, prefer `jsonb()` over `json()` for indexing support
7. Ensure FK columns use `foreignId()` (unsignedBigInteger) to match `id()` or `bigIncrements()` PKs

## Validation Checklist

- [ ] Smallest type that fits the data range is selected
- [ ] Monetary values use `decimal` or integer minor units
- [ ] String columns have explicit length limits
- [ ] Public-facing IDs use `uuid()` or `ulid()`
- [ ] `foreignId()` matches referenced PK type
- [ ] `jsonb` used in PostgreSQL when querying JSON is needed
- [ ] `text` columns aren't used where `string` with indexing is needed

## Common Failures

### float for currency
Floating-point rounding errors accumulate. Use `decimal` or integer minor units.

### unsigned mismatch
`foreignId()` creates `unsignedBigInteger`. Defining the referenced PK as `increments()` (signed) causes FK failure. Always ensure type consistency.

## Decision Points

### integer vs bigInteger vs tinyInteger?
tinyInteger (-128 to 127) for flags. smallInteger (-32768 to 32767) for small ranges. integer for most PKs and counters. bigInteger for distributed IDs or large counters.

### uuid vs ulid?
UUID v4 is random, unguessable. ULID is sortable, more index-friendly, and encodes timestamp + random. Prefer ULID for most public IDs.

## Performance Considerations

`string(255)` uses more storage than needed in MySQL row formats. `text` columns can't be fully indexed in MySQL (prefix only). `jsonb` in PostgreSQL enables performant JSON queries. `decimal` operations are slower than integer operations in some databases.

## Security Considerations

Column type constraints enforce data integrity at the database level. Type mismatches between migration and application code can cause silent truncation or query failures.

## Related Rules

- Use foreignId() for FK columns to match PK type
- Use smallest type for the data range
- Monetary values must use decimal or integer
- UUID/ULID for public-facing identifiers

## Related Skills

- Define Migration File Structure
- Configure Column Modifiers
- Define Foreign Key Constraints

## Success Criteria

- Every column uses the smallest appropriate type for its data
- Monetary values avoid floating-point errors
- FK columns use unsignedBigInteger matching the referenced PK
- Public IDs use UUID/ULID for security and distribution
- String columns set explicit length bounds
- JSON columns use jsonb in PostgreSQL for indexability
