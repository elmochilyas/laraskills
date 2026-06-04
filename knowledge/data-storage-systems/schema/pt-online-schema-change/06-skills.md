# Skill: Run MySQL Online Schema Changes with pt-online-schema-change

## Purpose

Use pt-online-schema-change (pt-osc) from Percona Toolkit to execute MySQL ALTER TABLE operations on production tables by creating a shadow table with triggers, copying data in chunks, and performing an atomic swap — enabling schema changes without blocking reads or writes.

## When To Use

- MySQL 5.7+ environments (including older versions without online DDL)
- FK-heavy schemas where gh-ost has limitations
- Established Percona tooling environments
- Tables up to hundreds of GB in size

## When NOT To Use

- MySQL 8.0+ with available INSTANT/INPLACE DDL for simple operations
- High-concurrency OLTP tables where trigger deadlocks are a risk
- Tables with existing triggers that conflict with pt-osc triggers

## Prerequisites

- Percona Toolkit installed
- MySQL user with CREATE, ALTER, DROP, SELECT, INSERT, UPDATE, DELETE, INDEX, TRIGGER privileges
- Sufficient disk space for the shadow table

## Inputs

- Target table and database
- ALTER TABLE statement
- Chunk size and sleep interval
- Replication lag threshold
- FK handling method

## Workflow

1. Perform a dry run: `pt-online-schema-change --dry-run D=myapp,t=orders --alter "ADD COLUMN status INT"`
2. Review the dry run output for potential issues (FKs, triggers, replicas)
3. Run the migration: `pt-online-schema-change --alter "ADD COLUMN status INT" D=myapp,t=orders --execute`
4. Monitor progress in the output (row copy percentage, timing)
5. After completion, verify the new schema and data integrity

## Validation Checklist

- [ ] Dry run completes without warnings or errors
- [ ] Chunk size is appropriate for the table size and workload
- [ ] Replication lag threshold is configured
- [ ] FK handling method is specified for FK-referenced tables
- [ ] Disk space is sufficient for the shadow table
- [ ] No existing triggers on the target table

## Common Failures

### Trigger deadlock cascade
Under high concurrency, pt-osc's triggers can interact with application locks, causing deadlocks. Reduce chunk size or switch to gh-ost for triggerless operation.

### FK constraint rebuild fails
If a referencing table is large, the FK rebuild during swap takes significant time and blocks writes. Test on staging first.

## Decision Points

### pt-osc vs gh-ost?
pt-osc for older MySQL versions and FK-heavy schemas. gh-ost for triggerless operation on MySQL 8.0+. pt-osc is more battle-tested for FK scenarios.

### Chunk size?
Start with 1000 rows. Lower for high-write tables (500). Raise for archive/slow tables (5000). Monitor replication lag to find the sweet spot.

## Performance Considerations

Triggers fire on every INSERT/UPDATE/DELETE during migration — ~5-10% performance impact. Chunk copying competes with application workload. FK constraint rebuild during swap requires locking referencing tables.

## Security Considerations

pt-osc installs triggers that remain until the migration completes or is stopped. If the migration process is killed, triggers must be manually cleaned up. Use `--check-interval` for periodic progress checks.

## Related Rules

- Always run dry-run first
- Monitor trigger overhead on write-heavy tables
- Clean up triggers after interrupted migrations

## Related Skills

- Run MySQL Online Schema Changes with gh-ost
- Configure MySQL ALGORITHM/LOCK Options
- Execute Zero-Downtime Schema Changes

## Success Criteria

- Migration completes without production downtime
- Dry run validates the operation before execution
- Trigger overhead is within acceptable limits
- FK constraints are properly rebuilt after swap
- Interrupted migrations leave clean state for retry
