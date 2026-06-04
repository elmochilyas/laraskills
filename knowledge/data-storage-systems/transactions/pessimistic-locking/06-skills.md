# Skill: Implement Pessimistic Locking with `lockForUpdate`

## Purpose

Use Eloquent's `lockForUpdate()` and `sharedLock()` to explicitly acquire row locks before modifications, preventing concurrent writes.

## When To Use

- High contention resource (frequent concurrent writes to same row)
- Read-then-write sequence that must be atomic
- Financial transactions (balance updates, inventory decrements)
- Optimistic locking retries are too expensive or disruptive
- Critical operations where waiting for lock is preferred over retry

## When NOT To Use

- Read-only queries (no need for locks)
- Low contention (optimistic locking is simpler and faster)
- Long transactions (pessimistic locks held for duration)
- Application can accept stale reads (MVCC handles this)

## Prerequisites

- Database supporting row-level locks (InnoDB, PostgreSQL)
- Transaction scope

## Inputs

- Rows to lock
- Lock type (exclusive or shared)
- Transaction containing the lock and subsequent operations

## Workflow (numbered steps)

1. Identify the read-then-write sequence that needs protection:
   ```php
   // Without lock: two concurrent reads get same balance
   $account = Account::find($id);
   $account->balance += 10;
   $account->save();
   ```

2. Use `lockForUpdate()` (exclusive lock):
   ```php
   DB::transaction(function () use ($id, $amount) {
       $account = Account::where('id', $id)->lockForUpdate()->first();
       if ($account->balance >= $amount) {
           $account->balance -= $amount;
           $account->save();
       }
   });
   ```
   - Other transactions: `SELECT ... FOR UPDATE` waits; plain SELECT reads old snapshot
   - Locks held until COMMIT

3. Use `sharedLock()` (shared lock):
   ```php
   DB::transaction(function () use ($id) {
       $account = Account::where('id', $id)->sharedLock()->first();
       // Other shared reads allowed, but writes blocked
   });
   ```

4. Use `SKIP LOCKED` for queue-style processing:
   ```php
   $job = Job::where('status', 'pending')
       ->orderBy('priority')
       ->lockForUpdate()
       ->skipLocked()
       ->first();
   ```

5. Always wrap in `DB::transaction()` and keep it short

## Validation Checklist

- [ ] `lockForUpdate()` used for exclusive read-then-write
- [ ] `sharedLock()` used where shared read is acceptable
- [ ] Always inside `DB::transaction()` closure
- [ ] Transaction kept short (< 100ms)
- [ ] No API calls or external operations inside
- [ ] Deadlock retry implemented alongside

## Common Failures

- `lockForUpdate()` outside transaction — lock released immediately (autocommit)
- `lockForUpdate()` for read-only operations — unnecessary blocking
- Missing `lockForUpdate()` in critical read-then-write — race condition
- `lockForUpdate()` with long transaction — excessive lock hold time
- Deadlock from inconsistent lock ordering

## Decision Points

- `lockForUpdate()` vs `sharedLock()`: exclusive vs shared
- `lockForUpdate()` vs `SKIP LOCKED`: wait for lock vs skip locked rows
- `lockForUpdate()` vs optimistic locking: contention level determines choice
- Eloquent vs DB facade: Eloquent adds model overhead

## Performance Considerations

- `lockForUpdate()`: blocks other writers, serializes access to row
- `sharedLock()`: allows multiple readers, blocks writers
- Lock duration = transaction scope (commit releases)
- SKIP LOCKED: no waiting, higher throughput, less fair
- Index usage: narrow lock range, avoid table-level locks

## Security Considerations

- Row locks don't bypass access controls
- Unauthorized access to locked rows is still prevented by authorization checks

## Related Rules

- 9-15-1: Always Use lockForUpdate Inside Transaction
- 9-15-2: Never Use lockForUpdate for Read-Only Queries

## Related Skills

- Implement Optimistic Locking
- Use Row-Level Locks (FOR UPDATE, FOR SHARE)
- Use SKIP LOCKED for Job Queues

## Success Criteria

- `lockForUpdate()` prevents race conditions in read-then-write
- `sharedLock()` used where shared access is sufficient
- Transactions with locks are short (< 100ms)
- Deadlock retry handles conflicting locks
- SKIP LOCKED used for job processing
