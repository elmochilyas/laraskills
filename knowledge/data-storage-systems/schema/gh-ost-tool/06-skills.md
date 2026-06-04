# Skill: Run MySQL Online Schema Changes with gh-ost

## Purpose

Use gh-ost (GitHub Online Schema Transfer) to execute MySQL ALTER TABLE operations on large production tables without blocking reads or writes, leveraging binlog-based change capture to avoid trigger overhead and support pause/resume/throttle controls.

## When To Use

- Tables > 50GB requiring schema changes
- MySQL 8.0+ environments with binlog enabled
- Operations requiring pause/resume capability
- High-concurrency OLTP tables where trigger overhead is unacceptable

## When NOT To Use

- Small tables (< 10GB) where simpler tools or instant DDL suffice
- MySQL < 5.7 without row-based binlog
- Environments where gh-ost installation is not feasible

## Prerequisites

- MySQL configured with `binlog_format=ROW` and `binlog_row_image=FULL`
- Database user with required privileges (ALTER, CREATE, DELETE, DROP, INDEX, INSERT, SELECT, UPDATE, TRIGGER, SUPER)
- Sufficient disk space for shadow table (1x table size)

## Inputs

- Target table name and database
- ALTER TABLE statement
- Throttle thresholds (replication lag, CPU, threads)
- Test-on-replica flag

## Workflow

1. Verify binlog settings: `SHOW VARIABLES LIKE 'binlog_format'` must return ROW
2. Run a test migration on a replica first: `gh-ost --test-on-replica --host=replica_host --alter "ADD COLUMN status INT" --table orders --database myapp --execute`
3. Review the test output for row count, timing, and any errors
4. Run the migration on the primary: `gh-ost --alter "ADD COLUMN status INT" --table orders --database myapp --execute`
5. Monitor progress via the socket file: `echo progress | nc -U /tmp/gh-ost.orders.sock`
6. After cut-over, verify the new schema and data integrity
7. Clean up any remaining ghost table artifacts

## Validation Checklist

- [ ] binlog_format is ROW with row_image FULL
- [ ] Test-on-replica completed successfully before production run
- [ ] Disk space is sufficient for the shadow table
- [ ] Throttle thresholds are configured for the workload
- [ ] Cut-over lock duration is measured and acceptable
- [ ] Binlog retention covers the migration duration

## Common Failures

### Insufficient binlog retention
gh-ost must read binlogs from the start of the migration. If binlog retention is too short, gh-ost fails with "binlog not found". Set `binlog_expire_logs_seconds` to cover the estimated migration time.

### Cut-over timeout under high write load
The ghost table falls behind on catching up. Increase write timeout or throttle the source workload during cut-over.

## Decision Points

### gh-ost vs pt-osc?
gh-ost for binlog-based trigger-free operation (no trigger deadlocks). pt-osc for older MySQL versions or FK-heavy schemas where trigger support is more mature.

### Automatic vs manual cut-over?
Automatic (default) for most cases. Manual cut-over for advanced scenarios where precise control over the swap timing is needed.

## Performance Considerations

gh-ost reads the source table in chunks. Binlog streaming adds < 5% write amplification. Throttle by replication lag — if replica lag exceeds threshold, gh-ost pauses row copy. Network latency between gh-ost and MySQL affects throughput.

## Security Considerations

gh-ost requires SUPER privilege for some operations. Use a dedicated database user with minimal required privileges. The socket file for progress monitoring should be in a secure location.

## Related Rules

- Always test on replica first
- Monitor binlog retention before starting
- Configure throttle thresholds for the workload

## Related Skills

- Run MySQL Online Schema Changes with pt-osc
- Run MySQL Online Schema Changes with Spirit
- Execute Zero-Downtime Schema Changes

## Success Criteria

- Schema change completes without production downtime
- Test-on-replica validates the migration before primary execution
- Throttling prevents replication lag spikes
- Cut-over completes within sub-second lock window
- Binlog retention covers the full migration duration
