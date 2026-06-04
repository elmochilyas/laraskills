# Skill: Execute pgroll Migrations on PostgreSQL with Full Reversibility

## Purpose

Use pgroll to run zero-downtime PostgreSQL schema changes with view-based expand-contract pattern, providing full migration reversibility at any phase, dual-write support via PostgreSQL views, and native PostgreSQL feature support (NOT VALID, generated columns, RLS).

## When To Use

- PostgreSQL-only deployments requiring zero-downtime
- Complex multi-step migrations needing rollback capability
- Adding NOT NULL constraints without full-table scans
- Column renames under live traffic

## When NOT To Use

- MySQL deployments (pgroll is PostgreSQL-only)
- Simple additive changes on small tables
- Tables with partition inheritance or FDW incompatibility

## Prerequisites

- PostgreSQL 14+
- Application code compatible with both old and new schema
- Understanding of pgroll phases (read-write, read-write-new, complete)

## Inputs

- Schema change definition
- Migration mode
- Rollback strategy

## Workflow

1. Start pgroll in `--mode=read-write` — applies migration in dual-write mode
2. Application writes to both old and new schema; reads from old schema
3. Monitor for errors, performance issues, and data consistency
4. Switch to `--mode=read-write-new` — reads from new schema, writes to both
5. Monitor again for regressions
6. Run `pgroll complete` to remove backward-compatibility layer
7. If issues arise at any phase, rollback by reverting to previous mode

## Validation Checklist

- [ ] PostgreSQL 14+ with required extensions
- [ ] Application handles both schema versions
- [ ] Dual-write verified for correctness
- [ ] Read switch tested on staging
- [ ] Rollback path confirmed working

## Common Failures

### Application incompatible with both schemas
pgroll requires handling both old and new schema simultaneously. Code must be forward-compatible during the migration window.

### View complexity limitations
Complex migrations involving multiple table relationships may not correctly map through views. Test complex migrations thoroughly in staging.

## Decision Points

### pgroll vs manual expand-contract?
pgroll for automated view management and built-in reversibility. Manual for simple changes where pgroll setup overhead isn't justified.

### pgroll vs MySQL tools?
pgroll is PostgreSQL-only. gh-ost/pt-osc are MySQL-only. Choose by database engine, not by preference.

## Performance Considerations

View-based schema versioning adds negligible query overhead. Column backfilling via triggers adds per-row overhead for INSERT/UPDATE. The `complete` phase is metadata-only. Long-running migrations generate increased WAL traffic.

## Security Considerations

pgroll creates new PostgreSQL schemas per migration version. Monitor for orphaned schemas after completion. Synchronization triggers can cause deadlocks under high concurrent write load.

## Related Rules

- Test both forward and backward migration paths
- Verify PostgreSQL 14+ compatibility
- Monitor lock wait times during migration

## Related Skills

- Execute Expand-Contract Pattern
- Use PostgreSQL Lazy ADD COLUMN DEFAULT
- Select Zero-Downtime Migration Approach

## Success Criteria

- Schema changes applied with zero application downtime
- Migration is fully reversible at any phase
- NOT NULL constraints added without full table scan
- View-based approach does not degrade query performance
- Application code is compatible throughout migration phases
