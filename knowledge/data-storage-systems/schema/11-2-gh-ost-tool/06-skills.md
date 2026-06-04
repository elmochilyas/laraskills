# Skill: Execute gh-ost Migrations on Production MySQL Tables

## Purpose

Use gh-ost (GitHub Online Schema Transfer) to run MySQL ALTER TABLE operations without triggers or long-duration locks, leveraging binlog stream capture for change synchronization, automatic throttling, and test-on-replica validation for safe cut-over.

## When To Use

- Large MySQL tables (> 50GB) needing schema changes
- High-concurrency environments where trigger overhead is unacceptable
- Tables requiring pause/resume capability during migration

## When NOT To Use

- Small tables where instant DDL or standard ALTER suffices
- MySQL < 5.7 without row-based binlog
- Environments without SUPER privilege access

## Prerequisites

- MySQL 5.7+ with `binlog_format=ROW` and `binlog_row_image=FULL`
- Proper database user privileges
- Sufficient disk space for shadow table

## Inputs

- Target table and database
- ALTER TABLE statement
- Throttle thresholds
- Test-on-replica flag

## Workflow

1. Verify binlog settings: `binlog_format=ROW`, `binlog_row_image=FULL`
2. Run test on replica: `gh-ost --test-on-replica --host=replica_host --alter "ADD COLUMN ..." --table t --database d --execute`
3. Review test output for row count, timing, and errors
4. Run on primary: `gh-ost --alter "ADD COLUMN ..." --table t --database d --execute`
5. Monitor via socket: `echo progress | nc -U /tmp/gh-ost.t.sock`
6. After cut-over, verify new schema and data integrity

## Validation Checklist

- [ ] binlog_format is ROW with row_image FULL
- [ ] Test-on-replica completed successfully
- [ ] Disk space sufficient for shadow table
- [ ] Binlog retention covers migration duration
- [ ] Cut-over lock duration is < 1 second

## Common Failures

### Insufficient binlog retention
gh-ost cannot find the binlog position from migration start. Increase `binlog_expire_logs_seconds` to cover the estimated migration time.

### Cut-over timeout under high write load
The ghost table falls behind. Increase write timeout or throttle source writes during cut-over.

## Decision Points

### gh-ost vs Spirit?
gh-ost for mature, battle-tested tooling with broad MySQL version support. Spirit for MySQL 8.0+ only, offering faster row copy and improved cut-over.

## Performance Considerations

gh-ost reads the source table in chunks. Binlog streaming adds < 5% write amplification. Network latency between gh-ost and MySQL affects throughput. Automatic throttling reduces impact during peak load.

## Security Considerations

gh-ost requires SUPER privilege. Use a dedicated user with minimal privileges. Socket file for monitoring should be in a secure location. Test-on-replica should use a dedicated replica to avoid impacting production read traffic.

## Related Rules

- Always test on replica first
- Monitor binlog retention before starting
- Verify cut-over completes within sub-second window

## Related Skills

- Select Zero-Downtime Migration Approach
- Execute pt-osc Migrations
- Configure MySQL ALGORITHM/LOCK Options

## Success Criteria

- Schema change completes without production downtime
- Test-on-replica validates timing before production run
- Throttling prevents replication lag spikes
- Cut-over completes within sub-second lock window
- Binlog retention covers the full migration duration
