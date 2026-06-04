# Decomposition: 1.17 PostgreSQL lazy ADD COLUMN DEFAULT (PostgreSQL 11+)

## Topic Overview
Since PostgreSQL 11, `ALTER TABLE ... ADD COLUMN ... DEFAULT (non-volatile)` is a metadata-only operation that does not rewrite the table.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
1-17-postgresql-lazy-add-column-default/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 1.17 PostgreSQL lazy ADD COLUMN DEFAULT (PostgreSQL 11+)
- **Purpose:** Since PostgreSQL 11, `ALTER TABLE ... ADD COLUMN ...
- **Difficulty:** Advanced
- **Dependencies:** None

## Dependency Graph
**Depends on:** Foundational Laravel/DB knowledge.

**Depended on by:** More advanced KUs in Schema Design & Migration Engineering and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Metadata-only operation**: The column definition and default value are stored in the catalog. Existing rows return the default value on read without physical storage.; - **Non-volatile requirement**: Only works with immutable expressions (constants, `NOW()` is considered stable, not immutable in older versions). Volatile defaults (random, clock_timestamp) still require a table rewrite.; - **No NULL storage**: If the column is NOT NULL with a DEFAULT, existing rows don't store the value — it's computed on read from the catalog default.; - **NULL behavior**: If the column is nullable with no DEFAULT, existing rows implicitly have NULL. No rewrite needed..
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