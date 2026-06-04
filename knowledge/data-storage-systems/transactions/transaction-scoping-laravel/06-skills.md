# Skill: Scope Transactions in Laravel

## Purpose

Use `DB::transaction()` to wrap atomic business operations with automatic commit on success and rollback on exception, avoiding manual transaction management.

## When To Use

- Any multi-step database operation that must be atomic
- Business logic requiring all-or-nothing persistence
- Controller actions that create/update/delete multiple related records
- Service methods that need transactional guarantees

## When NOT To Use

- Single database operation (no need for transaction)
- Read-only operations
- Long-running operations with external dependencies
- Operations needing manual transaction control (loops with conditional commit)

## Prerequisites

- Laravel database configuration
- Understanding of which operations must be atomic

## Inputs

- Business operation to wrap
- Database queries in the operation

## Workflow (numbered steps)

1. Use `DB::transaction()` with a closure for automatic transaction management:
   ```php
   DB::transaction(function () use ($data) {
       $user = User::create($data['user']);
       $order = Order::create([
           'user_id' => $user->id,
           'total' => $data['total'],
       ]);
       Inventory::decrement($data['product_id'], $data['quantity']);
   });
   ```
   - Auto-commits if closure completes without exception
   - Auto-rolls back if any exception is thrown

2. For manual transaction control (rare need):
   ```php
   DB::beginTransaction();
   try {
       // operations
       DB::commit();
   } catch (\Exception $e) {
       DB::rollBack();
       throw $e;
   }
   ```

3. Use the `$attempts` parameter for retries:
   ```php
   DB::transaction(function () {
       // operation that may deadlock
   }, 3);  // retry up to 3 times
   ```

4. Check transaction depth:
   ```php
   if (DB::transactionLevel() > 0) {
       // already inside a transaction
   }
   ```

5. Keep the closure short — only database operations, no external API calls

## Validation Checklist

- [ ] `DB::transaction()` closure used instead of manual beginTransaction/commit/rollback
- [ ] No external API calls inside the transaction closure
- [ ] `$attempts` parameter used for deadlock retries
- [ ] Exception handling outside the closure
- [ ] Transaction level checked if needed for conditional logic
- [ ] All related writes in the same transaction

## Common Failures

- Manual `DB::beginTransaction()` without matching `commit()`/`rollBack()` — orphaned transaction
- External API calls inside closure — long lock duration
- Not catching exceptions from `DB::transaction()` — unhandled error
- Assuming `DB::transaction()` retries on deadlock (pass `$attempts` parameter)
- Wrapping unrelated operations in a single transaction (increases contention unnecessarily)

## Decision Points

- `DB::transaction()` closure vs manual beginTransaction/commit
- Single transaction vs multiple smaller transactions
- `$attempts` parameter for retry count (0 = no retry, default)
- Transaction level checking for conditional behavior

## Performance Considerations

- `DB::transaction()` is the same as manual BEGIN/COMMIT under the hood
- Closures add minimal overhead
- `$attempts` retries add latency on serialization failures
- Short transactions are critical for throughput

## Security Considerations

- Transaction rollback doesn't bypass access controls
- Uncommitted data is not visible to other transactions (isolation)

## Related Rules

- 9-11-1: Always Use DB::transaction Closure
- 9-11-2: Never Wrap External Calls in DB::transaction

## Related Skills

- Apply ACID Properties
- Use Nested Transactions with Savepoints
- Implement Transaction Retry Logic

## Success Criteria

- All multi-step write operations use `DB::transaction()` closure
- No manual beginTransaction/commit/rollback in application code
- No external API calls inside transactions
- Transactions roll back correctly on exceptions
- `$attempts` parameter used where deadlocks are possible
