# Decomposition: 1.14 pgroll tool (PostgreSQL, reversible expand-contract)

## Topic Overview
pgroll is a zero-downtime migration tool for PostgreSQL that implements a view-based expand-contract pattern. Rather than using triggers or binlogs, pgroll uses PostgreSQL views to present the new schema while maintaining backward compatibility. Migrations are fully reversible — pgroll tracks every change and can roll back at any point.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-14-pgroll-tool/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.14 pgroll tool (PostgreSQL, reversible expand-contract)
- **Purpose:** pgroll is a zero-downtime migration tool for PostgreSQL that implements a view-based expand-contract pattern. Rather than using triggers or binlogs, pgroll uses PostgreSQL views to present the new schema while maintaining backward compatibility.
- **Difficulty:** Advanced
- **Dependencies:** 1.10 Zero-downtime migration patterns, 1.18 Expand-contract pattern, 1.17 PostgreSQL lazy ADD COLUMN DEFAULT

## Dependency Graph
**Depends on:** "1.10 Zero-downtime migration patterns", "1.18 Expand-contract pattern", "1.17 PostgreSQL lazy ADD COLUMN DEFAULT"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **View-based approach**: Instead of modifying tables directly, pgroll creates PostgreSQL views that provide both old and new schema interfaces simultaneously.; - **Reversibility**: Every migration is tracked. Rollback is a first-class operation, not an afterthought.; - **Two-phase deployment**: Phase 1 applies the migration (safe). Phase 2 finalizes it (removes backward-compatibility layer).; - **No triggers, no binlogs**: Pure PostgreSQL DDL and views. No external dependencies..
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