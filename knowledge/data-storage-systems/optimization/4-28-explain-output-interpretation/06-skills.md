# Skill: Interpret Cross-Platform EXPLAIN Output

## Purpose
Read EXPLAIN output from both MySQL and PostgreSQL to identify red flags: full table scans, filesort, temporary tables, and cost/row mismatches.

## When To Use
- When working with both MySQL and PostgreSQL databases
- When analyzing query plans across different database versions

## When NOT To Use
- When a simple query is already performant

## Prerequisites
- Understanding of index mechanics
- Knowledge of both MySQL and PostgreSQL EXPLAIN formats

## Inputs
- EXPLAIN output from MySQL or PostgreSQL

## Workflow
1. Identify the database platform (MySQL vs PostgreSQL)
2. MySQL: check `type` (ALL=bad), `Extra` (filesort/temporary), `rows` vs `filtered`
3. PostgreSQL: check node type (Seq Scan=bad on large tables), `cost`, actual vs estimated rows
4. Check for red flags:
   - MySQL: `type=ALL`, `Extra=Using filesort`, `Extra=Using temporary`
   - PostgreSQL: `Seq Scan` on large tables, `Sort Method: external merge Disk`
5. Check for row count mismatch (actual >> estimated) — stale statistics

## Validation Checklist
- [ ] MySQL: `type` not `ALL` for large tables
- [ ] MySQL: no `Using filesort` on large sorts
- [ ] PostgreSQL: no `Seq Scan` on tables >10K rows
- [ ] PostgreSQL: actual vs estimated rows match within 10x
- [ ] No `Sort Method: external merge Disk` (exceeded work_mem)

## Common Failures
- EXPLAIN without ANALYZE on PostgreSQL (estimates only, no actuals)
- Ignoring `filtered` column in MySQL (low filtered = poor index selectivity)
- Not running EXPLAIN after adding indexes to verify effectiveness

## Decision Points
- MySQL `type=ALL` + high rows: add index
- MySQL `Using filesort`: add ORDER BY column to index
- PostgreSQL `Seq Scan` on large table: add index or update statistics
- PostgreSQL large actual vs estimated divergence: run ANALYZE

## Performance
- EXPLAIN (without ANALYZE): negligible overhead
- EXPLAIN ANALYZE: executes the query — use on SELECT only or wrap in transaction

## Security
- EXPLAIN does not modify data
- EXPLAIN output may show table names and column references — no sensitive data

## Related Rules
- 4-28-1: Always EXPLAIN Before Optimizing
- 4-28-4: Review And Apply Core Concepts

## Related Skills
- Interpret EXPLAIN Output
- Run Explain Analyze
- Evaluate Access Type Column

## Success Criteria
- Red flags correctly identified for both MySQL and PostgreSQL
- Missing indexes identified from plan analysis
- Statistics freshness validated and addressed
