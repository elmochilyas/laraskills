# Skill: Reclaim PostgreSQL Bloat with pg_repack

## Purpose

Use pg_repack to remove table and index bloat in PostgreSQL without requiring long-duration ACCESS EXCLUSIVE locks, reclaiming storage and improving query performance by creating a compact table copy with trigger-based sync and a brief final swap lock.

## When To Use

- Tables with > 20% bloat from heavy UPDATE/DELETE workloads
- Index bloat causing slow index scans
- After autovacuum tuning is insufficient to control bloat
- Scheduled maintenance for high-write tables

## When NOT To Use

- Tables with low write activity (autovacuum suffices)
- Insufficient disk space for the table copy
- Tables with triggers that conflict with pg_repack triggers

## Prerequisites

- pg_repack extension installed on the PostgreSQL server
- Free disk space approximately equal to the target table size
- Understanding of bloat measurement tools (pgstattuple)

## Inputs

- Target table name
- Repack type (full table or index-only)
- Schedule (one-time or recurring)

## Workflow

1. Measure bloat using `pgstattuple` or bloat estimation queries
2. If bloat > 20%, schedule a pg_repack during low-traffic window
3. Run `pg_repack --table public.orders` to start the repack
4. Monitor progress and trigger activity
5. After completion, verify reduced table size and improved query performance
6. Schedule regular repacks for high-write tables

## Validation Checklist

- [ ] Bloat measured and exceeds 20% threshold
- [ ] Free disk space exceeds target table size
- [ ] No conflicting triggers on the target table
- [ ] No long-running queries that could block the final swap
- [ ] After repack, table size is verified reduced
- [ ] Query performance improvement is measured

## Common Failures

### Disk space exhaustion
pg_repack requires ~2x the table size in free disk space. Running out mid-repack corrupts the temporary table and requires manual cleanup of the `repack` schema.

### Exclusive lock wait
The final swap requires a brief ACCESS EXCLUSIVE lock. Long-running queries holding conflicting locks cause pg_repack to hang. Kill blocking sessions before repacking.

## Decision Points

### Full table repack vs index-only repack?
Full table repack for both table and index bloat. Index-only repack when only indexes are bloated (less common). Full repack is the standard approach.

### Scheduled vs on-demand?
Schedule weekly for high-write tables. Run on-demand when bloat monitoring exceeds thresholds. Combination approach works best.

## Performance Considerations

Write performance degrades during repack due to trigger overhead and IO competition. After repack, query performance improves due to compacted storage. Requires sufficient WAL archiving capacity.

## Security Considerations

pg_repack installs triggers on the target table that can conflict with CDC tools. Verify no existing trigger conflicts. The `repack` schema left behind after failure requires manual cleanup.

## Related Rules

- Measure bloat before repacking
- Ensure sufficient disk space before starting
- Schedule during low-traffic windows

## Related Skills

- Run PostgreSQL Zero-Downtime Migrations with pgroll
- Configure PostgreSQL Lazy ADD COLUMN DEFAULT
- Monitor Index Bloat and Maintenance

## Success Criteria

- Table bloat is reduced below 10% after repack
- Query performance improves measurably
- No application downtime during repack
- Regular schedule prevents bloat re-accumulation
- Failed repacks leave clean state for retry
