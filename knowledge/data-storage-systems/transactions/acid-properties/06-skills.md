# Skill: Apply ACID Properties in Laravel

## Purpose

Write Laravel transactions that respect Atomicity, Consistency, Isolation, and Durability guarantees, keeping transactions short and using database constraints for consistency.

## When To Use

- Any multi-step database operation that must be atomic
- Business logic requiring data invariants (e.g., balance must not go negative)
- Concurrent data access needing isolation guarantees
- Data must persist across system failures

## When NOT To Use

- Single query operations (no need for transaction)
- Read-only operations
- Long-running operations that include external API calls
- Operations where partial completion is acceptable

## Prerequisites

- Understanding of ACID guarantees
- Database supporting transactions (InnoDB, PostgreSQL)

## Inputs

- Business operation (e.g., transfer funds, place order)
- Database queries involved

## Workflow (numbered steps)

1. Ensure atomicity: group all related writes in a single transaction
2. Ensure consistency: use database constraints (FK, CHECK, UNIQUE) not just application logic
3. Choose isolation level based on consistency needs:
   - READ COMMITTED: default for PostgreSQL, good for most workloads
   - REPEATABLE READ: default for MySQL, provides consistent snapshot
   - SERIALIZABLE: strongest, lowest concurrency, use only when needed
4. Keep transactions short:
   - Move external API calls before or after the transaction
   - Move user input validation before the transaction
   - Only include database operations inside the transaction
5. Ensure durability: verify `innodb_flush_log_at_trx_commit=1` (MySQL) or `fsync=on` (PostgreSQL)
6. Use `DB::transaction()` closure:
   ```php
   DB::transaction(function () use ($request) {
       $order = Order::create([...]);
       $payment = Payment::create([...]);
       Inventory::decrement($request->product_id, $request->quantity);
   });
   ```

## Validation Checklist

- [ ] Multi-step operations wrapped in transactions
- [ ] No external API calls inside transactions
- [ ] Database constraints (FK, CHECK, UNIQUE) enforce invariants
- [ ] Isolation level chosen for workload
- [ ] `innodb_flush_log_at_trx_commit=1` (MySQL) or `fsync=on` (PostgreSQL)
- [ ] Transactions are short (milliseconds, not seconds)

## Common Failures

- API calls inside transaction — holds locks during network latency
- No database constraints — app-level consistency can be bypassed
- REPEATABLE READ for high-contention writes — lock conflicts
- READ UNCOMMITTED — dirty reads produce inconsistent data
- Long transactions cause MVCC bloat and autovacuum lag (PostgreSQL)

## Decision Points

- READ COMMITTED vs REPEATABLE READ vs SERIALIZABLE
- Database constraints vs application-level validation
- Transaction length budget (aim for < 100ms)

## Performance Considerations

- Transaction length = lock duration = contention window
- MVCC cleanup: long transactions delay dead tuple cleanup
- fsync frequency: `innodb_flush_log_at_trx_commit=1` is safest but slower

## Security Considerations

- Transactions don't bypass access controls
- Row-level security applies within transactions
- Committed data persists — ensure correct data before commit

## Related Rules

- 9-1-1: Keep Transactions Short
- 9-1-2: Always Use DB::transaction Closure

## Related Skills

- Choose Isolation Level
- Manage Transaction Length
- Implement Optimistic Locking

## Success Criteria

- All multi-step write operations wrapped in transactions
- No external API calls inside transactions
- Database constraints enforce data invariants
- Transactions complete in < 100ms
- Durability confirmed (fsync enabled)
