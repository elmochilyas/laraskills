# Skill: Execute Multi-Phase Expand-Contract for Complex Schema Changes

## Purpose

Implement the four-phase expand-contract pattern — expand, backfill, switch, contract — for complex schema changes (column renames, table migrations, type changes) that require multiple deploy cycles, ensuring backward compatibility at each phase and enabling rollback without data loss.

## When To Use

- Renaming columns under live traffic
- Migrating data to a new table structure
- Changing column types that require application-level transformation
- Any schema change that can't be done atomically

## When NOT To Use

- Simple additive columns with instant DDL
- Changes during scheduled maintenance windows
- Small tables where lock-and-switch is acceptable

## Prerequisites

- Multiple deploy cycles for the multi-phase approach
- Application code supporting dual-write
- Monitoring for data consistency and error rates

## Inputs

- Schema change to execute
- Table size and write throughput
- Phase progression criteria

## Workflow

1. **Phase 1 — Expand**: Deploy new column/table and app code that writes to both old and new structures. Old is still source of truth for reads.
2. **Phase 2 — Backfill**: Run batch job to populate new structures with existing data. Not a deploy step — runs asynchronously.
3. **Phase 3 — Switch**: Deploy app code that reads from the new structure. Both old and new are still written to for fallback safety.
4. **Phase 4 — Contract**: Deploy app code removing old-structure writes. Drop old column/table in a subsequent migration. This is the only destructive step.

## Validation Checklist

- [ ] Each phase is a separate, independently deployable change
- [ ] Dual-write writes the same value to both structures
- [ ] Backfill is verified for completeness and correctness
- [ ] Rollback from any phase is tested and documented
- [ ] Contract phase only after verified zero old-structure references

## Common Failures

### Skipping dual-write phase
Direct switch from old to new without dual-write means rollback requires full data backfill. Always include dual-write for safe fallback.

### Backfill not verified before switch
Incomplete or incorrect backfill data produces incorrect results when reads switch to the new structure. Always verify before switching.

## Decision Points

### How long between phases?
At least one full deploy cycle between Expand and Backfill. Backfill can run concurrently with Switch preparation. Wait 24-48h between Switch and Contract.

### Verify dual-write correctness?
Compare old and new row counts, key column checksums, and sample data. Automate this verification to run in CI or as a separate command.

## Performance Considerations

Dual-write doubles write throughput temporarily. Backfill should use chunked processing with throttling. Read path has constant-time overhead (ternary or feature flag check). Monitor write IOPS during dual-write phase.

## Security Considerations

The contract phase is destructive. Ensure all code paths (queue jobs, long-running processes, cron tasks) have stopped referencing the old structure. Use monitoring to verify zero references before removing.

## Related Rules

- Never skip the dual-write phase
- Verify backfill completeness before switching reads
- Maintain 24-48h between switch and contract

## Related Skills

- Execute Zero-Downtime Schema Changes
- Execute Data Backfill Strategies
- Design Rollback Strategies

## Success Criteria

- Each phase is independently deployable and rollback-safe
- Dual-write maintains data consistency between old and new
- Backfill verification confirms correctness before switch
- Contract phase happens only after zero old-structure references
- No data loss occurs at any phase
