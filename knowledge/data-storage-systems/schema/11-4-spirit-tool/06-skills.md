# Skill: Execute Spirit Tool Migrations on MySQL 8.0+ Tables

## Purpose

Use Spirit (by CashApp/Block) to run MySQL 8.0+ online schema changes via physical replication — creating a new table copy with the desired schema, using physical file copy for fast data transfer, and performing atomic cut-over without triggers or binlog dependencies.

## When To Use

- MySQL 8.0+ with large tables (> 50GB)
- RDS/Aurora environments where physical copy is more efficient than row copy
- Teams wanting faster row copy than gh-ost provides

## When NOT To Use

- MySQL < 8.0 (not supported)
- Environments without sufficient disk space for physical copy
- Tables where pause/resume is critical (use gh-ost instead)

## Prerequisites

- MySQL 8.0+ with binlog enabled
- Performance_schema enabled for throttling feedback
- Disk space for both original and shadow table

## Inputs

- Target table name and database
- ALTER TABLE statement
- Connection configuration

## Workflow

1. Verify MySQL 8.0+ compatibility and performance_schema is enabled
2. Run Spirit with the ALTER statement, similar to gh-ost CLI syntax
3. Monitor progress via Spirit's status output
4. Verify cut-over completed and new schema is active
5. Confirm no artifacts remain after migration

## Validation Checklist

- [ ] MySQL 8.0+ with performance_schema enabled
- [ ] Disk space sufficient for original + shadow table
- [ ] Test migration run on staging environment
- [ ] Row copy speed is acceptable
- [ ] Cut-over lock duration is minimal

## Common Failures

### performance_schema disabled
Spirit loses its primary throttling data source. Enable performance_schema in MySQL configuration before using Spirit.

### Disk space exhaustion
Physical copy requires space for both original and shadow table. Monitor free space throughout the migration. Ensure at least 1.5x table size free.

## Decision Points

### Spirit vs gh-ost?
Spirit for MySQL 8.0+ with up to 2x faster row copy. gh-ost for broader MySQL version support and more mature pause/resume capabilities.

### Spirit vs pt-osc?
Spirit for trigger-free physical copy (no trigger deadlocks). pt-osc for FK-heavy schemas where trigger approach is better established.

## Performance Considerations

Physical copy is faster than row-by-row copy for multi-hundred-GB tables. No trigger overhead since Spirit doesn't use triggers. Performance-schema-based metrics enable accurate self-regulation. WAL generation may increase during the migration.

## Security Considerations

Spirit requires specific MySQL 8.0+ settings. Missing configuration causes runtime failures. Ensure proper database user privileges matching the tool's requirements.

## Related Rules

- Verify MySQL 8.0+ compatibility
- Ensure performance_schema is enabled
- Monitor disk space throughout migration

## Related Skills

- Execute gh-ost Migrations
- Execute pt-osc Migrations
- Select Zero-Downtime Migration Approach

## Success Criteria

- Migration completes without production downtime
- Row copy is measurably faster than row-by-row tools
- Physical copy does not exceed disk space limits
- Cut-over completes within acceptable lock window
- Performance schema metrics enable accurate throttling
