# Skill: Prevent Deadlocks with Consistent Ordering

## Purpose

Prevent deadlocks by acquiring locks in a consistent order across all transactions, keeping transactions short, and using indexes to narrow lock ranges.

## When To Use

- Multiple concurrent transactions access the same tables
- Deadlock errors are occurring or expected
- Designing new transaction logic
- Reviewing existing code for deadlock-prone patterns

## When NOT To Use

- Single-transaction or non-concurrent access
- READ ONLY transactions (no writes, no deadlocks)
- All transactions use optimistic locking (no lock waits)

## Prerequisites

- Understanding of deadlock causes (circular lock wait)
- Access patterns identified (which tables/rows are locked)

## Inputs

- Transaction code (all locations that acquire locks)
- Table access order
- Index usage for UPDATE/DELETE/SELECT FOR UPDATE

## Workflow (numbered steps)

1. Identify all tables/rows locked in each transaction
2. Define a global lock order (e.g., always lock user BEFORE order)
3. Enforce consistent ordering:
   ```php
   // ✅ Good: both transactions lock user first, then order
   DB::transaction(function () {
       $user = User::find($userId)->lockForUpdate();
       $order = Order::where('user_id', $userId)->lockForUpdate();
   });

   // ❌ Bad: one locks user->order, another locks order->user
   ```

4. Keep transactions short — minimize time between first lock and COMMIT:
   - Move external API calls, file uploads, user input before the transaction
   - Do computation before starting the transaction
   - Only include database operations inside the transaction

5. Use indexes to narrow lock range:
   ```sql
   -- Without index on (user_id, status): locks all rows examined
   -- With index: locks only matching rows
   UPDATE orders SET status = 'processed'
   WHERE user_id = 123 AND status = 'pending';
   ```

6. Consider using `SELECT ... FOR UPDATE NOWAIT` or `SKIP LOCKED`:
   - `NOWAIT`: fail immediately if row is locked (prevent waiting)
   - `SKIP LOCKED`: skip locked rows (process available rows only)

## Validation Checklist

- [ ] Lock order is consistent across all transactions
- [ ] Transactions are short (< 100ms)
- [ ] UPDATE/DELETE queries use indexes on WHERE clause
- [ ] No user interaction within transactions
- [ ] SKIP LOCKED or NOWAIT used where appropriate
- [ ] Deadlock rate near zero after prevention measures

## Common Failures

- Inconsistent lock order: T1 locks A→B, T2 locks B→A → deadlock
- Missing index on UPDATE/DELETE WHERE — table-level gap locks
- Long transactions from including HTTP calls inside transaction
- User input wait within transaction — locks held for seconds/minutes
- Implicit lock ordering through FK cascades (unexpected additional locks)

## Decision Points

- Consistent ordering vs retry on deadlock: both (ordering prevents, retry handles)
- Index creation for WHERE clauses used in UPDATE/DELETE/FOR UPDATE
- SKIP LOCKED vs waiting: throughput vs fairness
- Application-level lock ordering vs database-level

## Performance Considerations

- Consistent ordering: minimal overhead, prevents deadlocks
- Index on WHERE clause: reduces lock range, reduces contention
- SKIP LOCKED: higher throughput but may starve some rows
- Short transactions: minimize lock duration

## Security Considerations

- Consistent ordering doesn't affect access control
- SKIP LOCKED may skip rows that should be processed

## Related Rules

- 9-9-1: Always Lock Tables in Consistent Order
- 9-9-2: Never Include User Interaction in Transactions

## Related Skills

- Detect and Resolve Deadlocks
- Use Row-Level Locks Strategically
- Implement Transaction Retry Logic

## Success Criteria

- Consistent lock ordering across all transactions
- Transactions complete in < 100ms
- Deadlock rate reduced to near zero
- Indexes used for all UPDATE/DELETE WHERE clauses
- SKIP LOCKED used in job processing
