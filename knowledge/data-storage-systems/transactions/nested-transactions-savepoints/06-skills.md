# Skill: Use Nested Transactions and Savepoints

## Purpose

Leverage Laravel's nested transaction support (savepoints) to compose transactional services and perform partial rollbacks within a batch.

## When To Use

- Service methods that independently use `DB::transaction()` and are composed together
- Batch processing where individual items can fail without rolling back the whole batch
- Partial rollback within a transaction (roll back to savepoint, not the entire transaction)
- Modular service composition where each service expects transactional safety

## When NOT To Use

- Single-level transaction is sufficient
- Nested transaction expected to be independent (savepoints are not independent)
- Transaction per batch item is feasible (no need for savepoints)
- Database doesn't support savepoints (MyISAM)

## Prerequisites

- InnoDB (MySQL) or PostgreSQL (savepoints supported)
- Understanding that inner "commit" doesn't persist until outer commit

## Inputs

- Outer transaction closure
- Inner transaction closure(s)
- Batch item processing with per-item failure handling

## Workflow (numbered steps)

1. Understand savepoint behavior:
   - Outer `DB::transaction()` creates a real database transaction
   - Inner `DB::transaction()` creates a savepoint (not a real nested transaction)
   - Inner "commit" just releases the savepoint — changes still pending outer commit
   - Inner exception: rolls back to savepoint (not the entire outer transaction)

2. Use nested transactions through service composition:
   ```php
   // Service A
   function createOrder($data) {
       return DB::transaction(function () use ($data) {
           return Order::create($data);
       });
   }

   // Service B
   function processPayment($orderId, $amount) {
       return DB::transaction(function () use ($orderId, $amount) {
           return Payment::create(['order_id' => $orderId, 'amount' => $amount]);
       });
   }

   // Composed: B runs inside A's transaction (savepoint)
   DB::transaction(function () {
       $order = createOrder($data);
       processPayment($order->id, $data['total']);
       // Both roll back if either fails
   });
   ```

3. For partial rollback in batch processing:
   ```php
   DB::transaction(function () {
       foreach ($items as $item) {
           try {
               DB::transaction(function () use ($item) {
                   // Process item — on failure, rollback to savepoint
                   // Other items not affected
               });
           } catch (\Exception $e) {
               Log::error("Item {$item->id} failed: {$e->getMessage()}");
               // Continue processing remaining items
           }
       }
   });
   ```

4. Check nesting depth: `DB::transactionLevel()`

## Validation Checklist

- [ ] Nested transactions use savepoints (Laravel handles this automatically)
- [ ] Inner exception rolls back to savepoint (not entire outer transaction)
- [ ] Only outer COMMIT persists data
- [ ] Transaction level checked if needed
- [ ] Batch processing with partial failure handled correctly
- [ ] Both MySQL and PostgreSQL support verified

## Common Failures

- Assuming inner transaction is independent — it's a savepoint
- Inner commit does NOT persist data — waits for outer commit
- Inner rollback can't undo changes outside the savepoint
- Too deep nesting (3+ levels) — savepoint name conflicts
- Using MyISAM — no savepoint support, nested transactions ignored

## Decision Points

- Nested transactions vs separate sequential transactions
- Nested transactions for service composition vs manual savepoints
- Partial batch rollback vs skip-and-continue (transaction per item)
- Nesting depth limit (3 levels is already deep)

## Performance Considerations

- Savepoints add minimal overhead (just a marker in transaction log)
- Deep nesting: each savepoint adds to transaction metadata
- Partial rollback: costs more than committing (must apply compensatory operations)
- Long outer transactions with many savepoints: increased MVCC bloat risk

## Security Considerations

- Savepoints within a transaction share the same access controls
- Partial rollback may leave data in an inconsistent state if not carefully designed

## Related Rules

- 9-12-1: Never Assume Inner Transactions Are Independent
- 9-12-2: Always Use DB::transaction Closure (Even for Nested)

## Related Skills

- Scope Transactions in Laravel
- Manage Transaction Length
- Process Batch Items with Savepoints

## Success Criteria

- Nested transactions correctly use savepoints
- Inner failure rolls back only inner changes
- Outer commit persists all inner changes
- Batch processing handles per-item failures without losing other items' work
- Composed services work correctly in both nested and standalone mode
