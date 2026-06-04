# Skill: Prevent Metadata Lock Contention During MySQL Migrations

## Purpose

Identify and resolve MySQL metadata lock (MDL) contention before running schema migrations by checking for blocking queries, killing long-running sessions, using ALGORITHM=INSTANT for non-blocking operations, and implementing advisory locks for multi-node migration coordination.

## When To Use

- Running ALTER TABLE on production MySQL databases
- Before any DDL migration that requires exclusive metadata locks
- Multi-node deployments needing migration coordination

## When NOT To Use

- Non-production databases with no concurrent query load
- Read replicas where DDL is not applied

## Prerequisites

- MySQL 5.5+ for MDL tracking via performance_schema
- Process list access (SHOW FULL PROCESSLIST or performance_schema)
- Understanding of MDL queue behavior

## Inputs

- Target table name
- Migration window timing
- Long-running query detection

## Workflow

1. Before migration, check for blocking queries: `SELECT * FROM performance_schema.metadata_locks WHERE object_name = 'orders'`
2. Identify and kill long-running queries holding shared MDL: `SHOW FULL PROCESSLIST` → `KILL QUERY <thread_id>`
3. For immediate DDL, use `ALTER TABLE ... ALGORITHM=INSTANT, LOCK=NONE` to avoid MDL
4. For operations requiring exclusive MDL, schedule during low-traffic windows
5. For multi-node coordination, use `SELECT GET_LOCK('migrate_orders', 30)` as an advisory lock
6. Set `lock_wait_timeout` to a reasonable value (e.g., 5 seconds) to fail fast if blocked

## Validation Checklist

- [ ] Metadata locks checked before migration
- [ ] Long-running blocking queries identified and handled
- [ ] INSTANT algorithm used where possible
- [ ] Advisory lock used for multi-node coordination
- [ ] `lock_wait_timeout` configured for fail-fast

## Common Failures

### MDL queue cascade
A long-running SELECT holds shared MDL. ALTER TABLE waits for exclusive MDL. All subsequent queries queue behind the waiting ALTER. The table becomes completely inaccessible. Always check for blockers before DDL.

### Implicit MDL from unclosed transactions
An idle transaction holding a shared MDL prevents DDL indefinitely. Set `innodb_lock_wait_timeout` and monitor for idle transactions before migrations.

## Decision Points

### Kill queries vs wait for completion?
Kill short-lived queries that will complete within seconds. Wait for longer-running analytical queries if they can finish within the migration window. Never kill queries without understanding their purpose.

### Advisory lock vs --isolated?
Advisory lock for manual coordination. Laravel's `--isolated` flag uses the cache driver. Advisory lock is database-native and doesn't depend on cache availability.

## Performance Considerations

Checking metadata_locks is lightweight. Killing queries loses work but prevents cascading lock contention. Advisory locks add ~1ms overhead per operation.

## Security Considerations

KILL QUERY terminates the query without rolling back the transaction on the connection — the transaction is rolled back when the client reconnects or times out. Be careful with write transactions.

## Related Rules

- Check for blocking queries before DDL
- Use INSTANT algorithm to avoid MDL
- Set lock_wait_timeout for fail-fast behavior

## Related Skills

- Configure MySQL ALGORITHM/LOCK Options
- Use MySQL ALGORITHM=INSTANT
- Isolate Concurrent Migrations

## Success Criteria

- No MDL contention during schema migrations
- Blocking queries are identified and resolved before DDL
- ALGORITHM=INSTANT avoids MDL where possible
- Advisory locks coordinate multi-node migration execution
- `lock_wait_timeout` prevents indefinite blocking
