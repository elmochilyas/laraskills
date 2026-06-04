# Skill: Use Row-Level Locks (FOR UPDATE, FOR SHARE, SKIP LOCKED, NOWAIT)

## Purpose

Explicitly lock selected rows using `SELECT ... FOR UPDATE` (exclusive) or `FOR SHARE` (shared) to prevent concurrent modifications in critical read-then-write sequences.

## When To Use

- Implementing atomic read-update sequences (counters, balances, inventory)
- Preventing race conditions in concurrent transactions
- Job queues where workers should process distinct items
- Pessimistic locking when optimistic locking retries are costly

## When NOT To Use

- Simple INSERT/UPDATE/DELETE without read-before-write
- Low-contention scenarios where optimistic locking suffices
- Read-only queries where locks are unnecessary
- Long transactions (locks held until commit — contention risk)

## Prerequisites

- Database supporting row locks (InnoDB, PostgreSQL)
- Transaction scope established

## Inputs

- Query with row-locking clause
- Transaction that contains the lock and subsequent operations

## Workflow (numbered steps)

1. Identify the read-then-write sequence that needs protection:
   ```php
   // Race condition: two requests read same balance
   $account = Account::find($id);
   $account->balance += 10;
   $account->save();
   // Without lock, both reads get same balance
   ```

2. Use `FOR UPDATE` for exclusive access:
   ```php
   DB::transaction(function () use ($id) {
       $account = Account::where('id', $id)->lockForUpdate()->first();
       $account->balance += 10;
       $account->save();
   });
   ```
   - Other transactions: `SELECT ... FOR UPDATE` waits; plain `SELECT` reads old snapshot (MVCC)

3. Use `FOR SHARE` for shared read access (allow other shared reads):
   ```php
   $account = Account::where('id', $id)->sharedLock()->first();
   // Other shared reads allowed, exclusive writes blocked
   ```

4. Use `SKIP LOCKED` for job queues:
   ```php
   $job = DB::table('jobs')
       ->where('status', 'pending')
       ->orderBy('priority')
       ->lockForUpdate()
       ->skipLocked()
       ->first();
   // Returns next unlocked job, skips locked rows
   ```

5. Use `NOWAIT` for fail-fast instead of waiting:
   ```php
   try {
       $account = Account::where('id', $id)->lockForUpdate()->nowait()->first();
   } catch (QueryException $e) {
       // Row is locked by another transaction, handle appropriately
   }
   ```

6. Keep the transaction short — locks are held until COMMIT or ROLLBACK

## Validation Checklist

- [ ] All read-then-write sequences use FOR UPDATE or FOR SHARE
- [ ] Transactions with locks are short (< 100ms)
- [ ] SKIP LOCKED or NOWAIT used where waiting is undesirable
- [ ] No FOR UPDATE on read-only queries
- [ ] `lockForUpdate()` inside `DB::transaction()` closure
- [ ] Deadlocks handled with retry logic

## Common Failures

- Missing FOR UPDATE in read-then-write — race condition
- FOR UPDATE on read-only queries — unnecessary blocking
- Long transaction with FOR UPDATE — high contention
- No SKIP LOCKED on job queues — workers wait for locked jobs
- FOR UPDATE without transaction — lock released immediately (autocommit)

## Decision Points

- FOR UPDATE vs FOR SHARE: exclusive vs shared locking
- SKIP LOCKED vs NOWAIT: skip vs error on locked rows
- Optimistic vs pessimistic locking: contention level determines choice
- Lock scope: row-level vs table-level locks

## Performance Considerations

- FOR UPDATE: blocks other exclusive locks on same row
- FOR SHARE: allows multiple readers, blocks writers
- SKIP LOCKED: no waiting, but may return fewer rows
- Lock duration = transaction scope (commit/rollback releases locks)
- Lock escalation: InnoDB doesn't escalate to table locks

## Security Considerations

- Row locks don't bypass access controls
- SKIP LOCKED may skip rows user should have access to (priority inversion)

## Related Rules

- 9-5-1: Always Use FOR UPDATE for Read-Update Sequences
- 9-5-2: Never Hold FOR UPDATE Locks Across External Calls

## Related Skills

- Implement Optimistic Locking
- Implement Pessimistic Locking
- Use Job Queues with SKIP LOCKED
- Detect and Resolve Deadlocks

## Success Criteria

- No race conditions in read-then-write sequences
- Appropriate lock type chosen (FOR UPDATE vs FOR SHARE)
- SKIP LOCKED used for job queues
- Locks held for minimum duration (short transactions)
- No deadlocks from row lock ordering
