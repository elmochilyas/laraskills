# Skill: Avoid Long-Running Transaction Risks

## Purpose

Understand and mitigate the risks of long-running transactions: MVCC bloat, replication lag, lock escalation, and connection pool exhaustion.

## When To Use

- Designing transaction logic for batch operations
- Reviewing existing transactions for duration issues
- Monitoring transaction duration in production
- Debugging table bloat or replication lag

## When NOT To Use

- Single-statement operations (autocommit)
- Read-only operations (no lock holding)
- All transactions are already short (< 100ms)

## Prerequisites

- Transaction logging set up
- Monitoring for transaction duration
- Understanding of MVCC, replication lag, and lock escalation

## Inputs

- Transaction code
- Transaction duration metrics
- Database bloat or replication lag data

## Workflow (numbered steps)

1. Identify long-running transactions:
   - MySQL: `SELECT * FROM INFORMATION_SCHEMA.INNODB_TRX WHERE trx_time > NOW() - INTERVAL 5 SECOND`
   - PostgreSQL: `SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction'`
   - Application: log transaction start/end times and alert on > 5s

2. Address MVCC bloat risk (PostgreSQL):
   - Long transactions prevent VACUUM from removing dead tuples
   - Table and index bloat increase over time
   - Monitor: `pg_stat_user_tables.n_dead_tup`
   - Fix: keep transactions short, commit frequently in batches

3. Address replication lag risk:
   - Long-running transactions delay WAL advancement (PostgreSQL) or binlog position (MySQL)
   - Replica lag increases until transaction commits
   - Fix: batch processing in smaller transactions

4. Address lock escalation risk (MySQL InnoDB):
   - If single row locks exceed ~40% of table rows, InnoDB may escalate to table lock
   - Monitor: `SHOW ENGINE INNODB STATUS` — look for "lock escalation"
   - Fix: break into smaller transactions, use indexed WHERE to limit rows

5. For batch operations, use chunked commits:
   ```php
   foreach (array_chunk($records, 100) as $chunk) {
       DB::transaction(function () use ($chunk) {
           foreach ($chunk as $record) {
               DB::table('orders')->where('id', $record['id'])->update($record);
           }
       });
   }
   ```

## Validation Checklist

- [ ] Transaction duration monitored and alerted
- [ ] No single transaction processes > 1000 rows
- [ ] Batch operations use chunked commits
- [ ] MVCC bloat monitored and stable
- [ ] Replication lag not caused by long transactions
- [ ] No lock escalation events in logs

## Common Failures

- Single transaction for million-row UPDATE — hours of locks, massive bloat
- Transaction held open during user input wait — indefinite lock hold
- VACUUM can't keep up due to long-running reporting transaction
- Replica lag spikes caused by long transaction on primary
- Connection pool exhausted by idle-in-transaction connections

## Decision Points

- Chunk size: 100 vs 500 vs 1000 rows per transaction
- Transaction timeout: kill transactions > 60s
- Monitoring threshold: warn at 5s, critical at 30s

## Performance Considerations

- MVCC bloat: long transactions prevent cleanup of dead tuples
- Replication lag: transaction must commit for replicas to advance
- Lock escalation: affects all other sessions accessing the table
- Connection pool: idle-in-transaction connections reduce pool capacity

## Security Considerations

- Long transactions may hold locks on sensitive data longer than necessary
- Kill stuck transactions after timeout to prevent denial of service

## Related Rules

- 9-19-1: Always Monitor Transaction Duration
- 9-19-2: Never Process More Than 1000 Rows in One Transaction

## Related Skills

- Keep Transactions Short
- Batch Process with Chunked Commits
- Monitor MVCC Bloat

## Success Criteria

- All transactions complete in < 100ms (interactive) or < 1s (batch)
- MVCC bloat stable (dead tuples cleaned regularly)
- Replication lag not caused by long transactions
- No lock escalation events
- Connection pool not exhausted by idle transactions
