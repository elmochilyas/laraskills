# Decomposition: 11.6 Expand-contract pattern (add, backfill, switch readers, remove old)

## Topic Overview
Expand-contract (parallel change) is the safest zero-downtime migration pattern. Phase 1 (expand): add new column/table, write to both old and new. Application reads from old.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-6-expand-contract-detailed/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.6 Expand-contract pattern (add, backfill, switch readers, remove old)
- **Purpose:** Expand-contract (parallel change) is the safest zero-downtime migration pattern. Phase 1 (expand): add new column/table, write to both old and new.
- **Difficulty:** Advanced
- **Dependencies:** 11.1 Zero-downtime taxonomy, 11.9 Data backfill

## Dependency Graph
**Depends on:** "11.1 Zero-downtime taxonomy", "11.9 Data backfill"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Phase 1 — Expand**: Deploy app update that writes to both old and new structures. Old structure is still source of truth for reads.; - **Phase 2 — Backfill**: Fill new structure with existing data (batch job). Not a deploy step.; - **Phase 3 — Switch**: Deploy app update that reads from new structure. Old structure is still written to (fallback).; - **Phase 4 — Contract**: Deploy app update that removes old structure writes and code. Old structure dropped..
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