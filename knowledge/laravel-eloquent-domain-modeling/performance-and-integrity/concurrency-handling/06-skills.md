# Skill: Implement Pessimistic Locking for Concurrent Read-Modify-Write Operations

## Purpose
Prevent lost updates and data corruption when multiple requests or processes read and write the same database rows simultaneously.

## When To Use
- Inventory deduction, balance transfers, or any read-then-write sequence on shared data
- Queue workers claiming jobs atomically
- Operations where two concurrent requests must not produce incorrect final state

## When NOT To Use
- Read-only operations — locking adds overhead with zero benefit
- Single-request writes with no concurrent access
- Operations where eventual consistency is acceptable
- Hot rows under extreme contention (use queue-based serialization)

## Prerequisites
- Understanding of database transactions
- Indexed columns on the locked WHERE clause
- Deadlock retry strategy

## Inputs
- Model/table to lock
- Lock type: `lockForUpdate()` (exclusive) or `sharedLock()` (shared)
- Transaction callback with read-modify-write logic
- Optional: deadlock retry count

## Workflow
1. Open a `DB::transaction()` — `lockForUpdate()` only works inside a transaction
2. Query the row with `->lockForUpdate()` (exclusive write lock)
3. Perform the read-modify-write logic (check conditions, update values)
4. Commit the transaction (lock released automatically)
5. Use `DB::transaction($callback, 3)` for deadlock retry
6. Keep transaction scope minimal — no HTTP calls or file I/O inside
7. Lock tables in consistent global order to prevent deadlocks

## Validation Checklist
- [ ] `lockForUpdate()` is inside a `DB::transaction()` closure
- [ ] Transaction is short — no I/O inside the lock scope
- [ ] Deadlock retry configured with at least 3 attempts
- [ ] Locked columns are indexed
- [ ] All code paths lock tables in the same global order
- [ ] `skipLocked()` used for queue worker patterns

## Common Failures
- Locking without a transaction — lock released immediately after query
- Holding locks during I/O — blocks all other writers during HTTP calls
- Inconsistent lock order — guaranteed deadlock under concurrency
- No deadlock retry — fatal 500 errors on transient deadlocks
- `lockForUpdate()` on unindexed column — table-level lock escalation

## Decision Points
- `lockForUpdate()` vs `sharedLock()`: use exclusive lock when you will write; shared lock when you need consistent reads without blocking other readers
- Pessimistic vs optimistic: pessimistic for short, high-contention operations; optimistic for long-running operations (form edits)
- `skipLocked()`: use for queue workers to grab available jobs without contention

## Performance Considerations
- Row-level lock overhead proportional to locked rows
- Deadlock detection has CPU cost
- Locking on unindexed columns escalates to table-level locks
- Long transactions cause replication lag

## Security Considerations
- No direct security implications — locking is a consistency mechanism
- Deadlock retry logic must not introduce infinite loops (denial-of-service vector)

## Related Rules
- Always Wrap lockForUpdate in a Transaction (performance-and-integrity/concurrency-handling)
- Keep Locked Transactions Short (performance-and-integrity/concurrency-handling)
- Lock Tables in Consistent Global Order (performance-and-integrity/concurrency-handling)
- Implement Deadlock Retry (performance-and-integrity/concurrency-handling)
- Lock Only on Indexed Columns (performance-and-integrity/concurrency-handling)
- Use skipLocked for Queue Workers (performance-and-integrity/concurrency-handling)
- Never Use Pessimistic Locking for Read-Only Operations (performance-and-integrity/concurrency-handling)
- Use Optimistic Locking for Long-Running Operations (performance-and-integrity/concurrency-handling)

## Related Skills
- Implement Concurrent-Safe Find-Or-Create with createOrFirst
- Implement Optimistic Locking with Version Columns
- Implement Atomic Upsert Operations

## Success Criteria
- Lost updates eliminated under concurrent load
- Deadlock rate near zero (consistent lock order + retry)
- Transaction duration < 50ms (no I/O inside lock scope)
- No table-level lock escalations
