# Skill: Run MySQL Online Schema Changes with Spirit Tool

## Purpose

Use Spirit (by CashApp/Block) to execute MySQL 8.0+ online schema migrations using a binlog-based, trigger-free approach with improved cut-over reliability and performance-schema-based throttling, designed as a modern successor to gh-ost for large-scale MySQL environments.

## When To Use

- MySQL 8.0+ with large tables (> 50GB)
- Environments needing up to 2x faster row copy than gh-ost
- Teams already using ghost-like tooling wanting improved performance
- High-concurrency workloads requiring accurate throttling

## When NOT To Use

- MySQL 5.7 or earlier (not supported)
- Environments without performance_schema enabled
- FK-heavy schemas with complex constraint relationships

## Prerequisites

- MySQL 8.0+ with `binlog_format=ROW`
- `performance_schema` enabled
- `innodb_autoinc_lock_mode=2`
- Sufficient disk space for shadow table

## Inputs

- Target table name and database
- ALTER TABLE statement
- Throttle configuration
- Cut-over preferences

## Workflow

1. Verify MySQL 8.0+ compatibility and required settings
2. Ensure `performance_schema` is enabled for throttling data
3. Run Spirit with the ALTER statement, similar to gh-ost CLI syntax
4. Monitor progress via Spirit's status output
5. Verify cut-over completed and new schema is active
6. Confirm no artifacts remain after migration

## Validation Checklist

- [ ] MySQL 8.0+ with performance_schema enabled
- [ ] binlog_format is ROW
- [ ] Disk space sufficient for shadow table
- [ ] Test migration run on staging first
- [ ] Row copy speed monitored and acceptable
- [ ] Cut-over lock duration measured

## Common Failures

### performance_schema disabled
Spirit loses its primary throttling data source and falls back to less accurate metrics. Enable performance_schema in MySQL configuration.

### Replica lag amplification
Multi-threaded row copying can cause significant replica lag. Reduce chunk size and increase throttle sensitivity for write-heavy workloads.

## Decision Points

### Spirit vs gh-ost?
Spirit for MySQL 8.0+ with up to 2x faster row copy. gh-ost for broader MySQL version support and more mature ecosystem.

### Spirit vs pt-osc?
Spirit for trigger-free operation (no deadlocks). pt-osc for FK-heavy schemas where Percona has better FK handling.

## Performance Considerations

Spirit provides up to 2x faster row copy than gh-ost on large tables in benchmarks. Reduced binlog storage requirements during migration. More accurate throttling via performance_schema reduces workload impact.

## Security Considerations

Spirit requires specific MySQL settings. Missing configuration causes runtime failures. Ensure proper database user permissions matching the tool's requirements.

## Related Rules

- Verify MySQL 8.0+ compatibility before using Spirit
- Enable performance_schema for accurate throttling
- Test on staging before production

## Related Skills

- Run MySQL Online Schema Changes with gh-ost
- Run MySQL Online Schema Changes with pt-osc
- Execute Zero-Downtime Schema Changes

## Success Criteria

- Migration completes without production downtime
- Row copy is measurably faster than legacy tools
- Throttling accurately prevents resource contention
- Cut-over completes within acceptable lock window
- Performance schema metrics enable self-regulation
