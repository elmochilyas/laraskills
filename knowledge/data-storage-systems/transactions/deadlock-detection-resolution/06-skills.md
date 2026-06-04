# Skill: Detect and Resolve Deadlocks

## Purpose

Understand how InnoDB (wait-for graph) and PostgreSQL (deadlock_timeout) detect deadlocks, interpret error codes, and implement retry logic for deadlock victims.

## When To Use

- Deadlock errors in application logs
- Designing concurrency-safe transactions
- Debugging lock contention issues
- Ensuring deadlock retry logic is in place

## When NOT To Use

- No concurrent transactions (single-user or development)
- Deadlock rate is zero and unlikely
- READ ONLY transactions (no writes, no deadlocks)

## Prerequisites

- Understanding of transaction locks
- Database type (MySQL InnoDB or PostgreSQL)

## Inputs

- Deadlock error messages
- SHOW ENGINE INNODB STATUS (MySQL)
- PostgreSQL logs

## Workflow (numbered steps)

1. Identify the deadlock in logs:
   - **MySQL**: Error 1213 (40001) "Deadlock found when trying to get lock"
   - **PostgreSQL**: Error 40P01 "deadlock detected"

2. Analyze the deadlock (MySQL):
   ```sql
   SHOW ENGINE INNODB STATUS;
   -- Look at "LATEST DETECTED DEADLOCK" section
   -- Shows: transactions involved (TX1, TX2), locks held, locks needed, which was rolled back
   ```

3. Analyze the deadlock (PostgreSQL):
   - Check `deadlock_timeout` setting (default: 1 second)
   - PostgreSQL logs show which statements were involved
   - PostgreSQL doesn't have SHOW ENGINE equivalent — use pg_locks and logs

4. Implement retry logic in application:
   ```php
   function transactionWithRetry(callable $callback, int $maxRetries = 3): mixed {
       for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
           try {
               return DB::transaction($callback);
           } catch (QueryException $e) {
               // MySQL 1213, PostgreSQL 40P01
               if (!in_array($e->getCode(), ['1213', '40001', '40P01'])) {
                   throw $e;
               }
               if ($attempt === $maxRetries - 1) throw $e;
               usleep(100_000 * pow(2, $attempt)); // exponential backoff
           }
       }
   }
   ```

5. For MySQL: InnDB automatically chooses the victim (rolls back the transaction with fewest locks)
   - The application must retry the victimized transaction

## Validation Checklist

- [ ] Deadlock detection and retry implemented
- [ ] Retry count limited (3-5 attempts)
- [ ] Exponential backoff between retries
- [ ] Deadlock errors analyzed periodically
- [ ] Lock ordering reviewed to prevent frequent deadlocks
- [ ] InnoDB deadlock detection not disabled (innodb_deadlock_detect)

## Common Failures

- No deadlock retry — transaction fails silently
- Infinite retry loop — exponential backoff prevents this
- Ignoring deadlock errors from logs — deadlock patterns missed
- Disabling InnoDB deadlock detection (`innodb_deadlock_detect=OFF`) — locks wait until lock wait timeout
- Not distinguishing deadlock from other errors in retry logic

## Decision Points

- Retry count: 3 (standard) vs 5 (conservative)
- Backoff: fixed (simple) vs exponential (preferred) vs jitter
- Application-level vs framework-level retry (Laravel DB::transaction doesn't retry)

## Performance Considerations

- Deadlock detection: InnoDB checks on each lock wait (negligible overhead)
- PostgreSQL deadlock_timeout: 1s default, lower = faster detection, more CPU
- Retries add latency: exponential backoff from 100ms to 400ms (3 retries)
- Prevention is better than detection: consistent locking order reduces deadlocks

## Security Considerations

- Deadlock retry doesn't bypass access controls
- Repeated deadlocks may indicate a design issue (not a security issue)

## Related Rules

- 9-8-1: Always Retry on Deadlock
- 9-8-2: Always Analyze Deadlocks in SHOW ENGINE INNODB STATUS

## Related Skills

- Implement Transaction Retry Logic
- Prevent Deadlocks with Consistent Lock Ordering
- Use Row-Level Locks Strategically

## Success Criteria

- Deadlock retry logic handles all deadlock errors
- Retry uses exponential backoff (3 attempts max)
- Deadlocks are monitored and analyzed
- No deadlock-related data loss (retried transactions succeed)
