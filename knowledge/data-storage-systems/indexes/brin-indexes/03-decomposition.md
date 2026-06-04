# Decomposition: 3.5 BRIN indexes (correlated physical ordering, large append-only tables)

## Topic Overview
BRIN (Block Range INdex) stores min/max value summaries for contiguous physical block ranges. Designed for append-only tables where data is inserted in roughly sorted order (time-series, event logs, audit trails). BRIN indexes are 100-1000x smaller than B-Tree indexes and perform well on range queries over correlated data.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-5-brin-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.5 BRIN indexes (correlated physical ordering, large append-only tables)
- **Purpose:** BRIN (Block Range INdex) stores min/max value summaries for contiguous physical block ranges. Designed for append-only tables where data is inserted in roughly sorted order (time-series, event logs, audit trails).
- **Difficulty:** Advanced
- **Dependencies:** 3.1 B-Tree, 3.19 Index maintenance, 8.1 Range partitioning, 8.7 Time-based partitioning

## Dependency Graph
**Depends on:** "3.1 B-Tree", "3.19 Index maintenance", "8.1 Range partitioning", "8.7 Time-based partitioning"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Block range summary**: Each index entry covers a range of physical blocks (default 128 blocks, ~1MB). Stores min and max value for the indexed column.; - **Correlation requirement**: BRIN is effective only when data insertion order correlates with indexed column value (time-series, monotonically increasing IDs).; - **Size advantage**: For a 1TB table, a B-Tree on a timestamp column might be 30GB. A BRIN index might be 10-50MB.; - **Range query performance**: Excellent for `WHERE timestamp > '2026-01-01' AND timestamp < '2026-02-01'`. Poor for point lookups..
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