# Decomposition: 3.23 Over-indexing risks (write amplification, storage cost)

## Topic Overview
Every index adds write amplification: INSERT updates all indexes, UPDATE updates indexes on changed columns, DELETE updates all indexes. Over-indexing degrades write performance, consumes storage, and increases vacuum/maintenance overhead.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-23-over-indexing-risks/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.23 Over-indexing risks (write amplification, storage cost)
- **Purpose:** Every index adds write amplification: INSERT updates all indexes, UPDATE updates indexes on changed columns, DELETE updates all indexes. Over-indexing degrades write performance, consumes storage, and increases vacuum/maintenance overhead.
- **Difficulty:** Intermediate
- **Dependencies:** 3.22 Index size estimation, 3.19 Index maintenance

## Dependency Graph
**Depends on:** "3.22 Index size estimation", "3.19 Index maintenance"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Write amplification factor**: Each index multiplies the write cost of data modifications. 5 indexes = 5x the write IO of a non-indexed table.; - **Storage cost**: Indexes can exceed data size. A table with 10 indexes may have 15x data-to-index storage ratio.; - **Vacuum load (PostgreSQL)**: More indexes = more dead tuples = more vacuum work..
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