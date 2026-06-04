# Decomposition: 1.18 Expand-contract pattern (add column, dual-write, backfill, dual-read, remove old)

## Topic Overview
The expand-contract pattern is the most reliable approach for zero-downtime schema changes. It separates a single logical schema change into multiple deployment phases, ensuring old and new code can coexist during the transition. The phases are: add (new schema element), dual-write (write to both old and new), backfill (populate historical data), dual-read (read from new while verifying old), and remove (drop old structures).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-18-expand-contract-pattern/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.18 Expand-contract pattern (add column, dual-write, backfill, dual-read, remove old)
- **Purpose:** The expand-contract pattern is the most reliable approach for zero-downtime schema changes. It separates a single logical schema change into multiple deployment phases, ensuring old and new code can coexist during the transition.
- **Difficulty:** Advanced
- **Dependencies:** 1.10 Zero-downtime migration patterns, 1.19 Data backfill strategies, 11.6 Expand-contract detailed

## Dependency Graph
**Depends on:** "1.10 Zero-downtime migration patterns", "1.19 Data backfill strategies", "11.6 Expand-contract detailed"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Phase 1 — Add**: Deploy migration that adds the new column (nullable), creates the new table, or adds the new index. Old code works unchanged. No application deploy needed.; - **Phase 2 — Dual-write**: Deploy application code that writes to both old and new columns/tables. Old reads continue using old structures. New reads can optionally use new structures.; - **Phase 3 — Backfill**: Populate existing rows with data for the new column/table. Runs as queued jobs or chunked batch processing.; - **Phase 4 — Dual-read**: Switch reads to the new column/table. Monitor for correctness. Keep old as verification.; - **Phase 5 — Remove**: Deploy migration to drop old column/table. This is destructive — only safe after all code references to old structures are removed..
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