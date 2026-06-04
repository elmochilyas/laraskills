# Decomposition: 1.6 Migration ordering and naming conventions (YYYY_MM_DD_HHmmss)

## Topic Overview
Migration execution order is determined by filename sorting. The `YYYY_MM_DD_HHmmss` timestamp prefix ensures deterministic ordering. Naming conventions encode intent (create, alter, add, drop) and help teams understand migration purpose from filenames.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-6-migration-ordering-naming-conventions/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.6 Migration ordering and naming conventions (YYYY_MM_DD_HHmmss)
- **Purpose:** Migration execution order is determined by filename sorting. The `YYYY_MM_DD_HHmmss` timestamp prefix ensures deterministic ordering.
- **Difficulty:** Foundation
- **Dependencies:** 1.1 Migration file structure, 1.7 Migration batch tracking, 1.4 Foreign key definition

## Dependency Graph
**Depends on:** "1.1 Migration file structure", "1.7 Migration batch tracking", "1.4 Foreign key definition"

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Timestamp prefix**: `2026_06_02_000000_create_users_table.php`. Laravel generates this via `date('Y_m_d_His')`.; - **Name components**: Timestamp + action + target (e.g., `create_`, `alter_`, `add_`, `drop_`, `change_`) + descriptive name.; - **Collision handling**: If two developers create migrations in the same second, the sort order is then alphabetical by the rest of the name. Anonymous classes (Laravel 9+) prevent class name collisions but not ordering collisions.; - **Ordering fixes**: If a migration needs to run before another, manually prepend a slightly earlier timestamp. Use `migrate:status` to verify order..
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