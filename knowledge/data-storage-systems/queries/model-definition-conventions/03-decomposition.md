# Decomposition: 2.1 Model definition conventions (table name, primary key, timestamps, connection)

## Topic Overview
Eloquent model conventions define how a PHP class maps to a database table. The convention-over-configuration approach infers table names, primary keys, timestamps, and connection from class naming. Understanding these conventions and when to override them is foundational to Eloquent usage.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-1-model-definition-conventions/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.1 Model definition conventions (table name, primary key, timestamps, connection)
- **Purpose:** Eloquent model conventions define how a PHP class maps to a database table. The convention-over-configuration approach infers table names, primary keys, timestamps, and connection from class naming.
- **Difficulty:** Foundation
- **Dependencies:** 2.10 Query builder methods, 2.17 Casts, 2.18 Model serialization

## Dependency Graph
**Depends on:** "2.10 Query builder methods", "2.17 Casts", "2.18 Model serialization"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Table name**: Snake case plural of class name (`User` -> `users`, `PageCategory` -> `page_categories`). Override via `protected $table = 'custom_table'`.; - **Primary key**: `id` column, integer, auto-incrementing. Override via `protected $primaryKey = 'uuid'` and `public $incrementing = false`.; - **Timestamps**: Eloquent expects `created_at` and `updated_at` columns. Disable via `public $timestamps = false`.; - **Connection**: Uses default database connection. Override via `protected $connection = 'pgsql'`.; - **Key type**: `protected $keyType = 'string'` for UUID/ULID primary keys..
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