# Decomposition: 11.18 Last-mile migration validation (pre-deployment checklist)

## Topic Overview
Before deploying a production migration, run a final validation checklist: verify database storage space, check for long-running queries that may block DDL, confirm backup is recent, test rollback plan, verify CI tests passed, run migration against staging with production-like data, check replica lag baseline, and schedule during maintenance window.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-18-last-mile-migration-validation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.18 Last-mile migration validation (pre-deployment checklist)
- **Purpose:** Before deploying a production migration, run a final validation checklist: verify database storage space, check for long-running queries that may block DDL, confirm backup is recent, test rollback plan, verify CI tests passed, run migration against staging with production-like data, check replica lag baseline, and schedule during maintenance window.
- **Difficulty:** Advanced
- **Dependencies:** 11.16 Testing in CI, 11.10 Verification, 11.12 Migration locking

## Dependency Graph
**Depends on:** "11.16 Testing in CI", "11.10 Verification", "11.12 Migration locking"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Storage check**: `SELECT SUM(data_length + index_length) / 1024 / 1024 AS size_mb FROM information_schema.tables WHERE table_name = 'orders'`. Ensure enough free space for shadow table/rebuild.; - **Query check**: `SHOW FULL PROCESSLIST` or `SELECT * FROM pg_stat_activity`. Kill long-running queries before migration.; - **Backup confirmation**: Verify recent backup exists. Run `SELECT NOW() - MIN(check_time)` on backup tooling..
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