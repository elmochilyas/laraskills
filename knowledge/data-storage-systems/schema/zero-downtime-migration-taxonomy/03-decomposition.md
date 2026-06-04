# Decomposition: 11.1 Zero-downtime migration taxonomy (expand-contract, online DDL, shadow tables)

## Topic Overview
Zero-downtime migrations prevent application outages during schema changes. Three approaches: expand-contract pattern (add new column/app code/remove old — multi-deploy), online DDL (database-native: MySQL INSTANT/INPLACE, PostgreSQL without locks), shadow tables (create new table, dual-write, swap). Choose based on migration type, database engine, and risk tolerance.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-1-zero-downtime-migration-taxonomy/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.1 Zero-downtime migration taxonomy (expand-contract, online DDL, shadow tables)
- **Purpose:** Zero-downtime migrations prevent application outages during schema changes. Three approaches: expand-contract pattern (add new column/app code/remove old — multi-deploy), online DDL (database-native: MySQL INSTANT/INPLACE, PostgreSQL without locks), shadow tables (create new table, dual-write, swap).
- **Difficulty:** Advanced
- **Dependencies:** 11.6 Expand-contract, 11.2 gh-ost, 11.3 pt-online-schema-change

## Dependency Graph
**Depends on:** "11.6 Expand-contract", "11.2 gh-ost", "11.3 pt-online-schema-change"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Expand-contract**: Step 1 (expand): add column, app writes to both old and new. Step 2 (migrate): backfill data. Step 3 (contract): remove old column/app code. Multi-deploy, safe.; - **Online DDL**: MySQL `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` — non-blocking DML during DDL. PostgreSQL `ALTER TABLE ... ADD COLUMN` — fast if no default.; - **Shadow table**: Create `new_orders` with desired schema. Set up triggers or dual-write. Backfill data. Atomic rename..
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