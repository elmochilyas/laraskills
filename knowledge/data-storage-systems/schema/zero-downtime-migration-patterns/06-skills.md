# Skill: Execute Zero-Downtime Schema Changes via Expand-Contract

## Purpose

Apply the expand-contract migration pattern across multiple deployments to add, rename, or remove database columns without blocking application reads or writes, ensuring backward compatibility at each phase and enabling safe rollback at any point.

## When To Use

- Adding columns to large production tables
- Renaming or changing column types
- Adding NOT NULL constraints to existing columns
- Any schema change on tables receiving live traffic

## When NOT To Use

- Simple additive changes on small tables (use instant DDL)
- Development or staging environments where downtime is acceptable
- Tables that can be locked during a maintenance window

## Prerequisites

- Understanding of deploy cycles and application code separation
- Ability to deploy code changes independently of schema changes
- Monitoring for error rates and performance during migration phases

## Inputs

- Schema change to perform (add, rename, remove, type change)
- Table size and write throughput
- Database engine version and capabilities

## Workflow

1. **Phase 1 — Add**: Deploy migration that adds the new column as nullable. No application code changes needed yet.
2. **Phase 2 — Dual-write**: Deploy application code that writes the same value to both old and new columns. Old reads still use old column.
3. **Phase 3 — Backfill**: Run chunked queued jobs to populate existing rows. Verify consistency between old and new columns.
4. **Phase 4 — Switch reads**: Deploy code that reads from the new column. Keep dual-write for rollback safety.
5. **Phase 5 — Remove**: Wait 24-48 hours for all code paths (including delayed queue jobs) to migrate. Deploy migration to drop the old column.

## Validation Checklist

- [ ] Each phase is a separate deployable unit
- [ ] Dual-write writes the same value to both columns
- [ ] Backfill is idempotent and runs asynchronously via queue
- [ ] Backfill verification confirms old and new data match
- [ ] Compatibility window between switch and remove is 24-48 hours
- [ ] Rollback at any phase is possible without data loss

## Common Failures

### Short compatibility window
Dropping the old column too soon causes delayed queue jobs to fail. Wait 24-48 hours after the read switch before the remove phase.

### Backfill in same deploy as column addition
The backfill may take hours. Always run backfill as a separate background process, not in the deploy pipeline.

## Decision Points

### Expand-contract vs online DDL tools?
Expand-contract for complex changes (renames, type changes, multi-table). Online DDL tools for simple index or column additions. Expand-contract is safer but requires more deploy cycles.

### Add nullable vs add with default?
Add nullable for columns that semantically allow NULL. Add with default for columns that must have a value — but only if the database supports instant default addition (PostgreSQL 11+, MySQL ALGORITHM=INSTANT).

## Performance Considerations

Dual-write doubles write throughput. Backfill should be throttled with chunked processing. Monitor write IOPS during the dual-write phase. Shadow-table operations double storage temporarily.

## Security Considerations

The compatibility window must account for all running code paths including delayed queue jobs, long-running processes, and cron jobs. Missing any reference causes data integrity issues.

## Related Rules

- Add columns as nullable for zero-downtime
- Backfill asynchronously after schema change
- Maintain 24-48h compatibility window before removal

## Related Skills

- Execute Data Backfill Strategies
- Design Rollback Strategies
- Configure MySQL ALGORITHM/LOCK Options

## Success Criteria

- Schema changes applied with zero application downtime
- Each phase is independently deployable and rollback-safe
- Backfill completes without blocking production traffic
- Compatibility window prevents delayed-job failures
- Old structures are removed only after all references cease
