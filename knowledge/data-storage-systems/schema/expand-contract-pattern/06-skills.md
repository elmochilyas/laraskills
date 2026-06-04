# Skill: Execute the Expand-Contract Pattern for Safe Schema Evolution

## Purpose

Apply the multi-phase expand-contract (parallel change) pattern across separate deployments to add, rename, or remove database schema elements with zero downtime, ensuring backward compatibility at each phase and enabling rollback without data loss by maintaining dual-read/write capability.

## When To Use

- Adding new columns to production tables
- Renaming columns or tables
- Changing column types
- Adding NOT NULL constraints to existing data
- Removing deprecated schema elements

## When NOT To Use

- Simple additive columns with instant DDL support
- Changes on tables that can tolerate a maintenance window
- Non-production environments where downtime is acceptable

## Prerequisites

- Separate deploy cycles for each phase
- Application code that can write to both old and new structures
- Monitoring for error rates and data consistency

## Inputs

- Schema change to execute
- Table size and write throughput
- Database engine capabilities

## Workflow

1. **Phase 1 — Add**: Deploy migration adding the new column (nullable) or table. No app code changes.
2. **Phase 2 — Dual-write**: Deploy app code writing the same value to both old and new. Reads still use old.
3. **Phase 3 — Backfill**: Queue chunked jobs to populate existing rows. Verify correctness.
4. **Phase 4 — Switch reads**: Deploy code reading from new. Continue dual-write for rollback.
5. **Phase 5 — Contract**: After 24-48h, deploy migration dropping old column. This is the only destructive step.

## Validation Checklist

- [ ] Add phase creates backward-compatible schema (nullable or default)
- [ ] Dual-write writes identical values to old and new
- [ ] Backfill is idempotent and runs asynchronously
- [ ] Read switch is feature-flagged for safe rollback
- [ ] Contract phase delayed 24-48h after switch
- [ ] Rollback at each phase is tested before proceeding

## Common Failures

### Short compatibility window
A queue job delayed 2 hours fails because the old column was already dropped. Always maintain the old structure for at least 24-48h after switching reads.

### Inconsistent dual-write
Writing different values to old and new columns causes data drift. Switching reads produces incorrect results. Always write the same value to both.

## Decision Points

### Add nullable vs add with default?
Nullable for columns where NULL is semantically valid. Default for columns that require a value. In either case, the addition must not fail on existing rows.

### One deploy per phase or combine?
Each phase should be a separate deployment. Combining phases increases risk — a backfill failure in the same deploy as a column addition blocks the entire pipeline.

## Performance Considerations

Dual-write doubles write throughput temporarily. Backfill should use chunked processing with throttling. Read path adds constant-time overhead (ternary or feature flag check). Monitor write IOPS during dual-write phase.

## Security Considerations

The contract phase is destructive. Ensure all code paths (queue jobs, long-running processes, cron tasks) have stopped referencing the old structure. Use monitoring to verify zero references before dropping.

## Related Rules

- Backward-compatible additions only
- 24-48h compatibility window before contract
- Backfill asynchronously after schema change

## Related Skills

- Execute Data Backfill Strategies
- Design Rollback Strategies
- Execute Zero-Downtime Schema Changes

## Success Criteria

- Each phase is independently deployable and rollback-safe
- Dual-write maintains data consistency between old and new
- Backfill completes without blocking production traffic
- Contract phase happens only after verified zero old-structure references
- No data loss occurs at any phase
