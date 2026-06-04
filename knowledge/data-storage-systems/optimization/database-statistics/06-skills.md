# Skill: Maintain Database Statistics

## Purpose
Keep table statistics fresh with regular ANALYZE to ensure the query optimizer makes good index choices for execution plans.

## When To Use
- After bulk data changes (imports, deletes, updates)
- When queries suddenly become slow without schema changes
- After table migrations affecting large datasets

## When NOT To Use
- When auto-analyze is keeping statistics fresh (check last_analyze)

## Prerequisites
- Understanding of how the query optimizer uses statistics
- Database permissions for ANALYZE

## Inputs
- Table or database where statistics may be stale

## Workflow
1. Check when table statistics were last updated: `SHOW TABLE STATUS` (MySQL) or `SELECT relname, last_analyze FROM pg_stat_user_tables` (PostgreSQL)
2. Run ANALYZE if stale or after bulk changes: `ANALYZE TABLE table` (MySQL) or `ANALYZE table` (PostgreSQL)
3. Verify improvement: re-run the slow query and check EXPLAIN for plan change
4. For PostgreSQL: tune `autovacuum_analyze_scale_factor` for frequently updated tables

## Validation Checklist
- [ ] Statistics refreshed after bulk data changes
- [ ] EXPLAIN shows more accurate row estimates after ANALYZE
- [ ] Auto-analyze configured appropriately for table update frequency

## Common Failures
- Assuming ANALYZE is unnecessary — "query was fast yesterday, slow today" is often stale stats
- Skipping ANALYZE after import — freshly imported tables have default statistics
- Not checking last_analyze before debugging query plan issues

## Decision Points
- MySQL auto-recompute: triggers at ~10% rows changed — manual ANALYZE still useful
- PostgreSQL auto-analyze: based on threshold + scale factor — tune for write-heavy tables
- After bulk load: always run ANALYZE immediately

## Performance
- ANALYZE: reads a sample of rows — fast (seconds for large tables)
- OPTIMIZE TABLE: rebuilds table + stats — slower, use only when fragmentation is an issue
- Stale statistics: can cause 10-100x slower queries due to bad plans

## Security
- ANALYZE is a read-only operation — safe for production
- Statistics metadata doesn't expose sensitive data

## Related Rules
- 4-29-1: Always EXPLAIN Before Optimizing
- 4-29-4: Review And Apply Core Concepts

## Related Skills
- Interpret Cross-Platform EXPLAIN Output
- Apply Production Optimization Workflow

## Success Criteria
- Statistics refreshed after bulk data changes
- Query plan row estimates match actuals within 10x
- Auto-analyze configured for workload patterns
