# Skill: Execute pt-osc Migrations on Production MySQL Tables

## Purpose

Use pt-online-schema-change (Percona Toolkit) to run MySQL ALTER TABLE operations via trigger-based shadow table synchronization, supporting older MySQL versions and FK-heavy schemas with chunked row copy and dry-run validation.

## When To Use

- MySQL 5.7+ environments including older versions without online DDL
- FK-heavy schemas where trigger-based sync is well-supported
- Environments where Percona Toolkit is already established

## When NOT To Use

- MySQL 8.0+ with available INSTANT/INPLACE for simple operations
- High-concurrency OLTP where trigger deadlocks are a risk
- Tables with existing triggers that conflict

## Prerequisites

- Percona Toolkit installed on the migration host
- MySQL user with CREATE, ALTER, DROP, SELECT, INSERT, UPDATE, DELETE, INDEX, TRIGGER privileges
- Sufficient disk space for the shadow table

## Inputs

- Target table and database
- ALTER TABLE statement
- Chunk size and sleep interval
- FK handling method

## Workflow

1. Perform dry run: `pt-online-schema-change --dry-run D=myapp,t=orders --alter "ADD COLUMN status INT"`
2. Review dry run output for FK issues, trigger conflicts, and replica checks
3. Run migration: `pt-online-schema-change --alter "ADD COLUMN status INT" D=myapp,t=orders --execute`
4. Monitor progress (row copy percentage, timing) in the output
5. After completion, verify the new schema and data integrity

## Validation Checklist

- [ ] Dry run completes without warnings or errors
- [ ] Chunk size is appropriate for the workload
- [ ] Replication lag threshold is configured
- [ ] FK handling method specified for FK-referenced tables
- [ ] No existing triggers on the target table

## Common Failures

### Trigger deadlock cascade
Under high concurrency, pt-osc triggers interact with application locks, causing deadlocks. Reduce chunk size or switch to gh-ost for triggerless operation.

### FK constraint rebuild fails
If a referencing table is large, the FK rebuild during swap takes significant time and blocks writes. Test on staging before production.

## Decision Points

### pt-osc vs gh-ost?
pt-osc for older MySQL versions and FK-heavy schemas. gh-ost for triggerless operation on MySQL 8.0+. pt-osc has more mature FK handling.

### Chunk size selection?
Start with 1000 rows. Lower for high-write tables (500). Raise for archive tables (5000). Monitor replication lag and adjust.

## Performance Considerations

Triggers add ~5-10% latency to every DML during migration. Chunk copying competes with application workload. FK constraint rebuild during swap requires locking referencing tables. The final RENAME locks the table briefly.

## Security Considerations

pt-osc installs triggers that persist if the process is killed. Clean up manually with `DROP TRIGGER`. Use `--check-interval` for progress checks. The tool requires significant database user privileges.

## Related Rules

- Always run dry-run first
- Monitor trigger overhead on write-heavy tables
- Clean up triggers after interrupted migrations

## Related Skills

- Execute gh-ost Migrations
- Select Zero-Downtime Migration Approach
- Configure MySQL ALGORITHM/LOCK Options

## Success Criteria

- Migration completes without production downtime
- Dry run validates operation before execution
- Trigger overhead is within acceptable limits
- FK constraints are properly rebuilt after swap
- Interrupted migrations leave clean state for retry
