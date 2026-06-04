# Decomposition: 11.17 Migration order dependencies (foreign keys, referenced tables)

## Topic Overview
Migration order matters: referenced tables must be created before referencing tables. Laravel's migration filenames are prefixed with timestamps — executed in order. When adding an FK, ensure the referenced table exists before running the FK migration.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-17-migration-order-dependencies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.17 Migration order dependencies (foreign keys, referenced tables)
- **Purpose:** Migration order matters: referenced tables must be created before referencing tables. Laravel's migration filenames are prefixed with timestamps — executed in order.
- **Difficulty:** Intermediate
- **Dependencies:** 1.13 Migration structure, 15.1 Foreign key constraints

## Dependency Graph
**Depends on:** "1.13 Migration structure", "15.1 Foreign key constraints"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Timestamp ordering**: `2026_01_01_000001_create_users_table.php` runs before `2026_01_02_000001_create_orders_table.php`. Order determined by filename prefix.; - **FK addition**: Add FK after both tables exist. Separate migration: `2026_01_03_000001_add_user_fk_to_orders.php`.; - **Circular dependencies**: Table A references Table B, and Table B references Table A. Create tables without FK, then add FK in subsequent migration..
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