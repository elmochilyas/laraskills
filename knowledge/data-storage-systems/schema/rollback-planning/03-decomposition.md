# Decomposition: 11.11 Rollback planning (reversible migrations, data preservation)

## Topic Overview
Every migration must have a tested rollback plan. For expand-contract: rollback = stop writing to new structure, fall back to old. For online DDL: rollback depends on tool (gh-ost: stop before cutover, pt-osc: stop before rename).

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-11-rollback-planning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.11 Rollback planning (reversible migrations, data preservation)
- **Purpose:** Every migration must have a tested rollback plan. For expand-contract: rollback = stop writing to new structure, fall back to old.
- **Difficulty:** Advanced
- **Dependencies:** 11.6 Expand-contract, 11.13 Destructive operations

## Dependency Graph
**Depends on:** "11.6 Expand-contract", "11.13 Destructive operations"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Expand-contract rollback**: At any phase, revert to previous phase. Phase 1→2: stop writing new, delete new. Phase 3→2: revert reads to old, keep dual-write. No data loss.; - **Online DDL rollback**: gh-ost: `gh-ost --stop` before cutover. Shadow table is dropped. Original untouched. pt-osc: stop before rename. Triggers dropped.; - **DROP column rollback**: Impossible if no backup. Always backup column data before destructive DDL..
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