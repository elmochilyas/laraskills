# Decomposition: Index Tuning Cost

## Topic Overview
Database indexes speed up read queries at the cost of write performance and storage space. For Laravel applications, proper indexing can reduce query time from seconds to milliseconds, directly reducing database CPU and enabling smaller instance sizes. However, over-indexing slows writes and consumes storage. The goal is to index for actual query patterns while avoiding unused or duplicate indexes.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-index-tuning-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Index Tuning Cost
- **Purpose:** Database indexes speed up read queries at the cost of write performance and storage space. For Laravel applications, proper indexing can reduce query time from seconds to milliseconds, directly reducing database CPU and enabling smaller instance sizes. However, over-indexing slows writes and consumes storage. The goal is to index for actual query patterns while avoiding unused or duplicate indexes.
- **Difficulty:** Foundation
- **Dependencies:** - Query Optimization Cost (ku-01), - Data Archival (ku-03), - Storage Tier Selection (ku-04)

## Dependency Graph
**Depends on:**
- Query Optimization Cost (ku-01)
- Data Archival (ku-03)
- Storage Tier Selection (ku-04)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Index on WHERE columns: Every query's WHERE clause column should be indexed
- Index on JOIN columns: Foreign keys used in JOINs need indexes
- Index on ORDER BY columns: Columns used in ORDER BY benefit from index (avoids filesort)
- Composite indexes: Queries filtering on multiple columns (e.g., `WHERE status = 'active' AND created_at > '2024-01-01'`)
- Partial indexes: PostgreSQL; index only relevant subset of rows (e.g., `WHERE status = 'active'`)
- Index monitoring: Any production database with queries taking >100ms
**Out of scope:**
- Index on low-cardinality columns: Boolean or enum columns with few values (index rarely used)
- Index on never-queried columns: Indexes on columns never in WHERE/JOIN/ORDER BY are pure overhead
- Index on write-heavy tables: Tables with high INSERT/UPDATE/DELETE volume (logs, events)
- Over-indexing small tables: Tables < 1000 rows; full table scan is faster than index + table access
- Duplicate indexes: Same column indexed multiple times (check with `pt-duplicate-key-checker`)
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization