# Skill: Use Advisory Locks for Application Coordination

## Purpose

Use PostgreSQL `pg_advisory_lock` or MySQL `GET_LOCK()` for application-level mutual exclusion across processes, independent of table rows.

## When To Use

- Coordinating concurrent workers (job queue, cron jobs)
- Preventing duplicate job processing across workers
- Rate-limiting external API calls per resource
- Mutual exclusion for operations that span multiple rows/tables
- Session-level or transaction-level locking needed

## When NOT To Use

- Row-level locking suffices (FOR UPDATE on specific rows)
- No cross-process coordination needed
- Simple job queue with SKIP LOCKED is sufficient
- PostgreSQL not available (MySQL GET_LOCK is simpler but less integrated)

## Prerequisites

- PostgreSQL (preferred) or MySQL
- Understanding of session-level vs transaction-level locks

## Inputs

- Lock key (integer or string for MySQL, 64-bit integer for PostgreSQL)
- Lock scope: session or transaction

## Workflow (numbered steps)

1. Choose advisory lock type:
   - **PostgreSQL**:
     - `pg_advisory_lock(key)` — session-level, must explicitly unlock
     - `pg_advisory_xact_lock(key)` — transaction-level, auto-unlock on commit/rollback
     - `pg_try_advisory_lock(key)` — non-blocking, returns false if lock held
   - **MySQL**: `SELECT GET_LOCK('lock_name', timeout)` — session-level, must explicitly unlock
     - `SELECT RELEASE_LOCK('lock_name')` to unlock

2. For PostgreSQL, prefer transaction-level locks:
   ```sql
   BEGIN;
   SELECT pg_advisory_xact_lock(12345);
   -- critical section
   COMMIT;  -- lock automatically released
   ```

3. For job coordination (PostgreSQL advisory locks):
   ```php
   $jobId = 12345;
   if (DB::select("SELECT pg_try_advisory_lock(?)", [$jobId])[0]->pg_try_advisory_lock) {
       try {
           // Process job
       } finally {
           DB::statement("SELECT pg_advisory_unlock(?)", [$jobId]);
       }
   }
   ```

4. For MySQL `GET_LOCK`:
   ```php
   // Acquire lock
   if (DB::select("SELECT GET_LOCK('process_order_$orderId', 10) as lock_acquired")[0]->lock_acquired) {
       try {
           // Critical section
       } finally {
           DB::statement("SELECT RELEASE_LOCK('process_order_$orderId')");
       }
   }
   ```

5. Handle lock release: always release in `finally` block to prevent lock leaks

## Validation Checklist

- [ ] Advisory lock acquired before critical section
- [ ] Lock released in `finally` block (not just on success)
- [ ] Transaction-level lock preferred over session-level
- [ ] Non-blocking try-lock used where waiting is undesirable
- [ ] No lock leaks (all acquired locks are released)
- [ ] Lock key is unique across the application

## Common Failures

- Session-level lock not released — other sessions blocked until disconnect
- MySQL GET_LOCK: lock released on session close, not transaction end
- Lock leak from unhandled exception — acquire-released in try/finally
- Same lock key used for different purposes — unintended mutual exclusion
- Using advisory locks for row-level protection (use FOR UPDATE instead)

## Decision Points

- Session-level vs transaction-level locks
- PostgreSQL advisory locks vs MySQL GET_LOCK
- Blocking vs non-blocking (try) lock acquisition
- Advisory locks vs row-level locks vs SELECT FOR UPDATE

## Performance Considerations

- Advisory locks are lightweight (no disk I/O)
- Blocking locks: session waits until lock is available
- Non-blocking locks: immediate return, check result
- PostgreSQL advisory locks: 64-bit key, uses shared memory

## Security Considerations

- Advisory locks may cause denial of service (lock exhaustion)
- Lock names/keys should not contain sensitive data
- MySQL GET_LOCK is session-scoped — all sessions with same account share locks

## Related Rules

- 9-7-1: Prefer Transaction-Level Advisory Locks
- 9-7-2: Always Release Advisory Locks in finally Block

## Related Skills

- Use Row-Level Locks (FOR UPDATE)
- Implement Job Queue with SKIP LOCKED
- Prevent Concurrent Job Processing

## Success Criteria

- Advisory locks acquired and released correctly
- No lock leaks or deadlocks from advisory locks
- Transaction-level locks preferred for automatic cleanup
- Coordination achieved without row-level lock escalation
