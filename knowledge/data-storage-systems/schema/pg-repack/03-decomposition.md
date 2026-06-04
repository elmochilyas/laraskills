# Decomposition: 1.15 pg_repack (bloat/index reorganization without ACCESS EXCLUSIVE lock)

## Topic Overview
pg_repack is a PostgreSQL extension that removes table bloat and reorganizes indexes without requiring an ACCESS EXCLUSIVE lock. It works by creating a new copy of the table, applying changes via triggers or a logged table, and swapping in the new copy with only a brief ACCESS EXCLUSIVE lock during the final swap. Essential for reclaiming storage and improving query performance in high-write PostgreSQL environments.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-15-pg-repack/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.15 pg_repack (bloat/index reorganization without ACCESS EXCLUSIVE lock)
- **Purpose:** pg_repack is a PostgreSQL extension that removes table bloat and reorganizes indexes without requiring an ACCESS EXCLUSIVE lock. It works by creating a new copy of the table, applying changes via triggers or a logged table, and swapping in the new copy with only a brief ACCESS EXCLUSIVE lock during the final swap.
- **Difficulty:** Advanced
- **Dependencies:** None

## Dependency Graph
**Depends on:** Foundational Laravel/DB knowledge.

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Bloat**: Dead tuples in PostgreSQL tables and indexes caused by UPDATE and DELETE operations. Autovacuum reclaims space but may not fully compact the table.; - **ACCESS EXCLUSIVE lock**: The most restrictive PostgreSQL lock — blocks all reads and writes. pg_repack avoids holding this lock for the duration of the reorganization.; - **Trigger-based sync**: Like pt-osc, pg_repack uses triggers to capture ongoing changes during the rebuild..
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