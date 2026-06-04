# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.2 Blueprint column types (all available types per driver)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's Schema builder Blueprint provides driver-agnostic column type methods that map to database-native types. Choosing the correct column type at migration time determines storage efficiency, query performance, indexing capability, and data integrity. Each type has specific semantics, storage footprint, and driver compatibility. Misunderstanding type behavior leads to silent data truncation, performance degradation, or application bugs.

---

# Core Concepts

- **Driver-agnostic API**: Methods like `string()`, `integer()`, `text()` generate different DDL per database driver but maintain consistent semantics.
- **Type families**: Numeric (integer, bigInteger, decimal, float, double), string (char, string, text, mediumText, longText), date/time (date, datetime, timestamp, time, year), binary (binary), JSON (json, jsonb), spatial (geometry, point, polygon), and specialized (enum, set, uuid, ulid, ipAddress, macAddress).
- **Auto-increment variants**: `id()`, `bigIncrements()`, `unsignedBigInteger()` for primary and foreign keys.
- **Precision and scale**: `decimal('amount', 10, 2)` specifies total digits and decimal places. `string('name', 100)` specifies max characters.
- **Driver-specific differences**: `jsonb` vs `json` (PostgreSQL), `geometry` vs `point` (MySQL spatial support), `enum` string representation.

---

# Mental Models

Think of column types as a contract between the application and the database about data shape and size. The type determines not just storage but what operations are allowed (sorting, indexing, arithmetic). Choosing the smallest correct type for the data range is a performance decision, not just a schema decision.

---

# Internal Mechanics

- **Numeric types**: `tinyInteger` (1 byte, -128 to 127), `smallInteger` (2 bytes), `integer` (4 bytes), `bigInteger` (8 bytes). Unsigned doubles positive range. `decimal` uses exact numeric storage; `float`/`double` use approximate.
- **String types**: `char(n)` is fixed-length, space-padded. `varchar(n)` is variable-length + 1-2 byte overhead. `text` variants (TINYTEXT, TEXT, MEDIUMTEXT, LONGTEXT in MySQL) have different max lengths.
- **Temporal types**: `date` (3 bytes, no time), `datetime` (5-8 bytes with fractional seconds), `timestamp` (4 bytes, timezone-aware in PostgreSQL), `time` (3-5 bytes).
- **JSON types**: `json` stores as text in MySQL, binary in PostgreSQL. `jsonb` (PostgreSQL) stores as decomposed binary, supports GIN indexing.
- **Spatial types**: Available only with MySQL or PostgreSQL via dedicated extensions.

---

# Patterns

**Smallest type for the data**: Use `tinyInteger` for boolean flags, `smallInteger` for small ranges, `integer` for most IDs, `bigInteger` for large counters or distributed IDs.

**Monetary values**: Use `integer` (minor units, e.g., cents) or `decimal(10,2)`. Never use `float`/`double` for money — floating-point rounding errors accumulate.

**UUID/ULID for public IDs**: `uuid()` or `ulid()` instead of auto-increment for public-facing identifiers. ULIDs are sortable and more index-friendly than UUIDv4.

**nullable timestamps**: Use `nullableTimestamps()` for tables where timestamps are optional. `softDeletes()` adds a nullable `deleted_at` timestamp.

---

# Architectural Decisions

| Type | Use Case | Avoid When |
|------|----------|------------|
| bigIncrements | Primary keys for high-volume tables | Small lookup tables (increments sufficient) |
| uuid/ulid | Public identifiers, distributed systems | Internal FK references (size overhead) |
| decimal | Monetary values, precise calculations | Counters, IDs (use integer types) |
| jsonb (PostgreSQL) | Flexible schemas, queryable JSON | Simple JSON storage (plain json may suffice) |
| geometry/point | Location data, spatial queries | Non-spatial data |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Driver abstraction | Type mapping is not 1:1 across databases | Migration may work on MySQL but fail on PostgreSQL
Rich type set | Choice overload leads to incorrect type selection | Storage waste, performance loss
Automatic FK type matching (foreignId) | Implicit decisions may not match actual PK type | FK constraint failures

---

# Performance Considerations

- `string('column', 255)` uses more storage than the data requires in MySQL (fixed overhead per row in some engines).
- `jsonb` indexing (PostgreSQL) enables performant JSON queries. `json` (MySQL) cannot be directly indexed, requiring generated columns.
- `text` columns cannot be fully indexed in MySQL (prefix index only). Use `string` for searchable columns.
- `decimal` operations are slower than integer operations due to software computation in some databases.

---

# Production Considerations

- Adding a column of a new type to an existing table may trigger a table rebuild (e.g., changing string length). Use `ALGORITHM=INPLACE` or `ALGORITHM=INSTANT` in MySQL where supported.
- PostgreSQL handles `ALTER TABLE ... ADD COLUMN ... DEFAULT` as a metadata-only operation (no table rewrite) since version 11.
- Spatial types require engine-specific handling — ensure the database version supports the chosen type.

---

# Common Mistakes

**Using float for currency**: Floating-point types introduce rounding errors that accumulate over thousands of transactions. Use `decimal` or integer minor units.

**Oversized string columns**: `string('bio', 65535)` or defaulting to `text` for every string wastes storage and limits in-memory sorting performance.

**unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. Defining the referenced PK as `increments()` (signed integer) causes FK constraint failure.

---

# Failure Modes

- **Type overflow**: Inserting a value outside a numeric type's range causes truncation or error depending on strict SQL mode.
- **Timestamp range errors**: `timestamp` type in MySQL covers only 1970-01-01 to 2038-01-19 (Year 2038 problem). Use `datetime` for dates outside this range.
- **JSON type incompatibility**: MySQL `json` columns reject invalid JSON at insert time. Application-level JSON encoding errors surface as database errors.

---

# Ecosystem Usage

Laravel's migration defaults (`$table->id()`, `$table->timestamps()`, `$table->softDeletes()`) establish conventions followed by most packages. Spatie packages frequently use `json` columns for settings/metadata. Nova's schema generator uses Blueprint types for CRUD scaffolding.

---

# Related Knowledge Units

1.3 Column modifiers | 1.4 Foreign key definition | 1.15 MySQL instant DDL | 12.1 JSONB column type

---

# Research Notes

The `foreignId()` method is a significant improvement over manual `unsignedBigInteger` + `constrained()` — it eliminates a class of FK type mismatch bugs. The Year 2038 problem with MySQL `timestamp` is underappreciated in Laravel projects that use `timestamps()` on tables storing long-lived data.
