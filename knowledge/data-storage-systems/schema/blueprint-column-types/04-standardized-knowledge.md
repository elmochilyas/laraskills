# 1-2 Blueprint Column Types

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-2 |
| Knowledge Unit Title | Blueprint Column Types |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 1.3 Column modifiers | 1.4 Foreign key definition | 1.15 MySQL instant DDL | 12.1 JSONB column type |
| Last Updated | 2026-06-02 |

## Overview

Laravel's Schema builder Blueprint provides driver-agnostic column type methods that map to database-native types. Choosing the correct column type at migration time determines storage efficiency, query performance, indexing capability, and data integrity. Each type has specific semantics, storage footprint, and driver compatibility. Misunderstanding type behavior leads to silent data truncation, performance degradation, or application bugs.

---

## Core Concepts

- **Driver-agnostic API**: Methods like `string()`, `integer()`, `text()` generate different DDL per database driver but maintain consistent semantics.
- **Type families**: Numeric (integer, bigInteger, decimal, float, double), string (char, string, text, mediumText, longText), date/time (date, datetime, timestamp, time, year), binary (binary), JSON (json, jsonb), spatial (geometry, point, polygon), and specialized (enum, set, uuid, ulid, ipAddress, macAddress).
- **Auto-increment variants**: `id()`, `bigIncrements()`, `unsignedBigInteger()` for primary and foreign keys.
- **Precision and scale**: `decimal('amount', 10, 2)` specifies total digits and decimal places. `string('name', 100)` specifies max characters.
- **Driver-specific differences**: `jsonb` vs `json` (PostgreSQL), `geometry` vs `point` (MySQL spatial support), `enum` string representation.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Smallest type for the data**: Use `tinyInteger` for boolean flags, `smallInteger` for small ranges, `integer` for most IDs, `bigInteger` for large counters or distributed IDs.
- **Monetary values**: Use `integer` (minor units, e.g., cents) or `decimal(10,2)`. Never use `float`/`double` for money — floating-point rounding errors accumulate.
- **UUID/ULID for public IDs**: `uuid()` or `ulid()` instead of auto-increment for public-facing identifiers. ULIDs are sortable and more index-friendly than UUIDv4.
- **nullable timestamps**: Use `nullableTimestamps()` for tables where timestamps are optional. `softDeletes()` adds a nullable `deleted_at` timestamp.


## Architecture Guidelines

- | Type | Use Case | Avoid When |
- |------|----------|------------|
- | bigIncrements | Primary keys for high-volume tables | Small lookup tables (increments sufficient) |
- | uuid/ulid | Public identifiers, distributed systems | Internal FK references (size overhead) |
- | decimal | Monetary values, precise calculations | Counters, IDs (use integer types) |
- | jsonb (PostgreSQL) | Flexible schemas, queryable JSON | Simple JSON storage (plain json may suffice) |
- | geometry/point | Location data, spatial queries | Non-spatial data |


## Performance Considerations

- - `string('column', 255)` uses more storage than the data requires in MySQL (fixed overhead per row in some engines).
- - `jsonb` indexing (PostgreSQL) enables performant JSON queries. `json` (MySQL) cannot be directly indexed, requiring generated columns.
- - `text` columns cannot be fully indexed in MySQL (prefix index only). Use `string` for searchable columns.
- - `decimal` operations are slower than integer operations due to software computation in some databases.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Using float for currency**: Floating-point types introduce rounding errors that accumulate over thousands of transactions. Use `decimal` or integer minor units. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Oversized string columns**: `string('bio', 65535)` or defaulting to `text` for every string wastes storage and limits in-memory sorting performance. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. Defining the referenced PK as `increments()` (signed integer) causes FK constraint failure. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Type overflow**: Inserting a value outside a numeric type's range causes truncation or error depending on strict SQL mode.
- - **Timestamp range errors**: `timestamp` type in MySQL covers only 1970-01-01 to 2038-01-19 (Year 2038 problem). Use `datetime` for dates outside this range.
- - **JSON type incompatibility**: MySQL `json` columns reject invalid JSON at insert time. Application-level JSON encoding errors surface as database errors.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

