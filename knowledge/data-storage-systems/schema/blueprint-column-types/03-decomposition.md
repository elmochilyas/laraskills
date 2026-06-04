# Decomposition: 1.2 Blueprint column types (all available types per driver)

## Topic Overview
Laravel's Schema builder Blueprint provides driver-agnostic column type methods that map to database-native types. Choosing the correct column type at migration time determines storage efficiency, query performance, indexing capability, and data integrity. Each type has specific semantics, storage footprint, and driver compatibility.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-2-blueprint-column-types/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.2 Blueprint column types (all available types per driver)
- **Purpose:** Laravel's Schema builder Blueprint provides driver-agnostic column type methods that map to database-native types. Choosing the correct column type at migration time determines storage efficiency, query performance, indexing capability, and data integrity.
- **Difficulty:** Foundation
- **Dependencies:** 1.3 Column modifiers, 1.4 Foreign key definition, 1.15 MySQL instant DDL, 12.1 JSONB column type

## Dependency Graph
**Depends on:** "1.3 Column modifiers", "1.4 Foreign key definition", "1.15 MySQL instant DDL", "12.1 JSONB column type"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Driver-agnostic API**: Methods like `string()`, `integer()`, `text()` generate different DDL per database driver but maintain consistent semantics.; - **Type families**: Numeric (integer, bigInteger, decimal, float, double), string (char, string, text, mediumText, longText), date/time (date, datetime, timestamp, time, year), binary (binary), JSON (json, jsonb), spatial (geometry, point, polygon), and specialized (enum, set, uuid, ulid, ipAddress, macAddress).; - **Auto-increment variants**: `id()`, `bigIncrements()`, `unsignedBigInteger()` for primary and foreign keys.; - **Precision and scale**: `decimal('amount', 10, 2)` specifies total digits and decimal places. `string('name', 100)` specifies max characters.; - **Driver-specific differences**: `jsonb` vs `json` (PostgreSQL), `geometry` vs `point` (MySQL spatial support), `enum` string representation..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization