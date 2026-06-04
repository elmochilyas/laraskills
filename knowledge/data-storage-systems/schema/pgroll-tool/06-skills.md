# Skill: Run PostgreSQL Zero-Downtime Migrations with pgroll

## Purpose

Use pgroll to execute PostgreSQL schema changes with view-based expand-contract migration, providing full reversibility, dual-write support via PostgreSQL views, and zero-downtime schema evolution without triggers or binlogs.

## When To Use

- PostgreSQL-only deployments requiring zero-downtime
- Complex multi-step migrations needing reversibility
- Adding NOT NULL constraints without table scans
- Renaming columns or tables under live traffic

## When NOT To Use

- MySQL deployments (pgroll is PostgreSQL-only)
- Simple additive migrations on small tables (native DDL suffices)
- Tables with extremely complex view definitions
- PostgreSQL features incompatible with pgroll (partitioning, FDW)

## Prerequisites

- PostgreSQL 14+
- Application compatibility with both old and new schema simultaneously
- Monitoring for migration performance impact

## Inputs

- Schema change definition
- Migration mode (read-write dual, read-write-new, complete)
- Rollback strategy

## Workflow

1. Start pgroll with `--mode=read-write` to apply the migration in dual-write mode
2. Application writes to both old and new schema; reads served from old schema
3. Monitor for errors, performance degradation, data inconsistencies
4. Switch to `--mode=read-write-new` — application reads from new schema, writes to both
5. Monitor again for errors
6. Run `pgroll complete` to finalize — removes backward-compatibility layer
7. If issues arise at any phase, rollback is instant by reverting to previous mode

## Validation Checklist

- [ ] PostgreSQL 14+ with required extensions
- [ ] Application code is compatible with both schema versions
- [ ] Dual-write mode verified for correctness
- [ ] Read switch tested on staging first
- [ ] Rollback path tested and confirmed working
- [ ] Migration monitored for performance impact

## Common Failures

### Application not compatible with both schemas
pgroll requires the application to handle both old and new schema simultaneously during the dual-write phase. Code must be forward-compatible.

### View complexity limitations
Complex migrations involving multiple table relationships may not correctly map old and new schemas through views. Test complex migrations thoroughly.

## Decision Points

### pgroll vs manual expand-contract?
pgroll for automated view management and built-in reversibility. Manual expand-contract for simple changes where the overhead of pgroll setup isn't justified.

### pgroll vs gh-ost/pt-osc?
pgroll for PostgreSQL (view-based, triggerless). gh-ost/pt-osc for MySQL (shadow-table, binlog/triggers). Never interchangeable — choose by database engine.

## Performance Considerations

View-based schema versioning adds negligible overhead. Column backfilling triggers add per-row overhead for INSERT/UPDATE. The `complete` phase is metadata-only and completes in milliseconds. Long-running migrations generate increased WAL traffic.

## Security Considerations

pgroll creates new PostgreSQL schemas for each migration version. Monitor for orphaned schemas after migration completion. The synchronization triggers can cause deadlocks under high concurrent write load.

## Related Rules

- Test both forward and backward migration paths
- Verify PostgreSQL 14+ compatibility
- Monitor lock wait times during migration

## Related Skills

- Execute Zero-Downtime Schema Changes
- Execute Expand-Contract Pattern
- Configure PostgreSQL Lazy ADD COLUMN DEFAULT

## Success Criteria

- Schema changes applied with zero application downtime
- Migration is fully reversible at any phase
- Dual-write is verified for data consistency
- NOT NULL constraints added without full table scan
- View-based approach does not degrade query performance
