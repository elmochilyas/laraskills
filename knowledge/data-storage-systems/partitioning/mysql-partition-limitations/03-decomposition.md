# Decomposition: 8.10 MySQL partition limitations (no FK support, unique key must include partition key, max 8192 partitions)

## Topic Overview
MySQL partitioning has significant constraints: foreign keys are not supported on partitioned tables (cannot reference partitioned tables with FK), every unique index must include the partition key, and a maximum of 8192 partitions per table. These limitations often require architectural workarounds.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-10-mysql-partition-limitations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.10 MySQL partition limitations (no FK support, unique key must include partition key, max 8192 partitions)
- **Purpose:** MySQL partitioning has significant constraints: foreign keys are not supported on partitioned tables (cannot reference partitioned tables with FK), every unique index must include the partition key, and a maximum of 8192 partitions per table. These limitations often require architectural workarounds.
- **Difficulty:** Advanced
- **Dependencies:** 8.8 Partition indexes, 15.1 Foreign key constraints

## Dependency Graph
**Depends on:** "8.8 Partition indexes", "15.1 Foreign key constraints"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **No foreign keys**: Partitioned tables cannot be referenced by or contain foreign keys. Workaround: application-level referential integrity or triggers.; - **Unique key restriction**: All columns in a unique index must be part of the partition key. `UNIQUE (user_id)` on a table partitioned by `created_at` is not allowed.; - **8192 partition limit**: Maximum total partitions across all partitioned tables on a MySQL instance. Practical limit: 500-1000 per table..
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