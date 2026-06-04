# Skill: Verify Data Integrity After Schema Migrations

## Purpose

Run automated verification checks after migration and backfill — comparing row counts, checksums, and sample data between old and new structures, and validating constraints (NOT NULL, FK, UNIQUE) — to catch data corruption, truncation, and mapping errors before switching production traffic.

## When To Use

- After any data backfill completes
- Before switching reads to a new column or table
- As part of CI/CD pipeline for migration validation

## When NOT To Use

- Additive-only migrations with no data movement
- Trivial schema changes where data integrity cannot be affected

## Prerequisites

- Access to both old and new data structures
- Verification script or command
- Defined pass/fail criteria

## Inputs

- Old and new table/column references
- Row count query
- Checksum or aggregate query
- Constraint validation queries

## Workflow

1. Compare row counts: `SELECT COUNT(*) FROM old` vs `SELECT COUNT(*) FROM new` — must match exactly
2. Compare checksums: `SELECT MD5(GROUP_CONCAT(col ORDER BY id)) FROM old` vs new — catches data differences
3. Check for NULL violations: `SELECT COUNT(*) FROM new WHERE required_col IS NULL`
4. Check FK violations: `SELECT COUNT(*) FROM child WHERE NOT EXISTS (SELECT 1 FROM parent WHERE id = child.parent_id)`
5. Sample comparison: compare 1000 random rows side-by-side
6. If any check fails, fail the migration and initiate rollback plan
7. Automate verification in CI: `php artisan migrate:verify --table=orders`

## Validation Checklist

- [ ] Row counts match between old and new structures
- [ ] Checksums or aggregates match
- [ ] No unexpected NULLs in required columns
- [ ] No FK violations in the new structure
- [ ] Sample comparison confirms data correctness
- [ ] Verification is automated and part of CI/CD

## Common Failures

### No verification before cut-over
"Will correct afterward" — old structure is dropped, data is gone. Always verify before the contract phase.

### Row count matches but data differs
If dual-write wrote different values to old and new, counts match but data is incorrect. Include content checks (checksum, sample comparison) not just counts.

## Decision Points

### Full verification vs sample verification?
Full row count and checksum for all data. Sample comparison (1000 random rows) for content verification. Both are needed — counts + checksums catch bulk issues, samples catch semantic issues.

### Automated vs manual verification?
Automated in CI for every migration. Manual verification only for emergency hotfix migrations where CI was bypassed.

## Performance Considerations

Full checksum verification on large tables reads all rows — can take minutes. Schedule during low-traffic windows or use batched verification. Row count queries use index-only scans and are fast even on large tables.

## Security Considerations

Verification scripts access all rows in the affected tables. Ensure the verification user has read-only access. Checksum results may reveal data patterns — secure verification output.

## Related Rules

- Always verify before switching traffic
- Include content checks, not just row counts
- Automate verification in CI/CD

## Related Skills

- Execute Data Backfill Best Practices
- Execute Expand-Contract Pattern
- Design Rollback Strategies

## Success Criteria

- Row counts match exactly between old and new structures
- Checksum/aggregate comparison confirms data correctness
- No constraint violations in the new structure
- Verification is automated and runs before traffic switch
- Failed verification triggers automated rollback
