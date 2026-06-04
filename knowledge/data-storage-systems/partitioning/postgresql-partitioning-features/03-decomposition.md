# Decomposition: 8.11 PostgreSQL partitioning features (declarative partitioning, table inheritance)

## Topic Overview
PostgreSQL supports declarative partitioning (PARTITION BY RANGE/LIST/HASH) since v10 and native partitioning for subpartitioning since v13. Global indexes are supported (unlike MySQL). Partition pruning is sophisticated, including dynamic pruning via parameterized queries.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
8-11-postgresql-partitioning-features/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 8.11 PostgreSQL partitioning features (declarative partitioning, table inheritance)
- **Purpose:** PostgreSQL supports declarative partitioning (PARTITION BY RANGE/LIST/HASH) since v10 and native partitioning for subpartitioning since v13. Global indexes are supported (unlike MySQL).
- **Difficulty:** Advanced
- **Dependencies:** 8.1 Range partitioning, 8.8 Partition indexes

## Dependency Graph
**Depends on:** "8.1 Range partitioning", "8.8 Partition indexes"

**Depended on by:** More advanced KUs in Table Partitioning & Data Lifecycle and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Declarative partitioning**: `CREATE TABLE orders (...) PARTITION BY RANGE (created_at)`. Partitions are separate tables: `CREATE TABLE orders_2024 PARTITION OF orders FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')`.; - **Global indexes**: `CREATE INDEX ON orders(user_id)` — single B-tree index across all partitions. Works without partition key in WHERE.; - **Partition-wise JOIN**: PostgreSQL can join matching partitions directly (v12+). Reduces JOIN overhead for partitioned tables..
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