# Skill: Configure Lock Wait Timeout

## Purpose

Set appropriate lock wait timeout values for MySQL (`innodb_lock_wait_timeout`) and PostgreSQL (`lock_timeout`) to prevent transactions from waiting indefinitely for blocked locks.

## When To Use

- Configuring database connection parameters
- User-facing queries that should fail fast on lock contention
- Batch jobs that need longer lock wait tolerance
- Troubleshooting lock wait timeout errors (MySQL 1205)

## When NOT To Use

- Lock contention is rare or non-existent
- Default timeout values are already appropriate
- All transactions use NOWAIT or SKIP LOCKED

## Prerequisites

- Understanding of transaction lock duration
- Access to database configuration

## Inputs

- Workload type (interactive web request vs batch job)
- Expected lock contention level
- Application tolerance for lock wait timeouts

## Workflow (numbered steps)

1. Evaluate workload requirements:
   - **Interactive web requests**: timeout should be short (5-10s) to fail fast rather than keep user waiting
   - **Batch jobs**: longer timeout (30-60s) for complex operations
   - **Reporting queries**: moderate timeout (15-30s) for long-running reads with shared locks

2. Set MySQL timeout:
   - Global: `SET GLOBAL innodb_lock_wait_timeout = 10;` (in seconds)
   - Session: `SET SESSION innodb_lock_wait_timeout = 5;`
   - Config file: `innodb_lock_wait_timeout = 10` in my.cnf
   - Default: 50s (too long for web requests)

3. Set PostgreSQL timeout:
   - `SET lock_timeout = '5s';` (per transaction or session)
   - `deadlock_timeout` = time before deadlock check (default 1s, rarely needs changing)
   - Config file: `lock_timeout = 5000` in postgresql.conf (milliseconds)

4. In Laravel, set per-connection:
   - For MySQL: add `options` in `config/database.php`:
     ```php
     'mysql' => [
         'options' => [
             PDO::ATTR_TIMEOUT => 5, // connection timeout
         ],
     ],
     ```
   - Set session variable after connection:
     ```php
     DB::statement('SET SESSION innodb_lock_wait_timeout = 5');
     ```

5. Monitor lock wait timeout errors:
   - MySQL: Error 1205 "Lock wait timeout exceeded"
   - PostgreSQL: LockNotAvailable error when lock_timeout expires

## Validation Checklist

- [ ] `innodb_lock_wait_timeout` set to 5-10s for web requests
- [ ] `lock_timeout` set for PostgreSQL transactions
- [ ] Batch jobs use separate connection with higher timeout
- [ ] Lock wait errors are monitored and below acceptable rate
- [ ] Application handles lock wait timeout errors gracefully

## Common Failures

- Default 50s timeout for web requests — user waits 50s before error
- Lower timeout without addressing lock contention cause — more errors
- Setting `innodb_lock_wait_timeout` too low — legitimate waits fail
- Not distinguishing between lock wait timeout and deadlock (different error codes)
- PostgreSQL `deadlock_timeout` confused with `lock_timeout` (different settings)

## Decision Points

- Per-connection vs global timeout setting
- Interactive vs batch timeout values
- Lower timeout (fail fast) vs higher timeout (reduce errors)
- Application retry after lock wait timeout vs propagate error

## Performance Considerations

- Lower timeout: faster response for lock contention, more errors
- Higher timeout: fewer errors, longer stalls under contention
- Lock wait is wasted time (transaction is blocked) — lower timeout is generally better
- PostgreSQL `deadlock_timeout`: lower = faster deadlock detection, more CPU

## Security Considerations

- Lock wait timeout may cause partial operations (if not in a transaction, partial writes occur)
- Ensure atomic operations are wrapped in transactions so partial writes are rolled back

## Related Rules

- 9-10-1: Set Low Timeout for Interactive Queries (5-10s)
- 9-10-2: Never Use Default 50s Timeout in Production

## Related Skills

- Configure Transaction Isolation Levels
- Detect and Resolve Deadlocks
- Use NOWAIT for Fail-Fast Locking

## Success Criteria

- Lock wait timeout set appropriately for workload type
- Interactive queries fail fast (< 10s) on lock contention
- Batch jobs use longer timeout (30-60s)
- Application handles lock wait timeout errors with retry or graceful failure
