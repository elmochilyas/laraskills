# ECC Standardized Knowledge — Transactional Actions

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Transactional Actions |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Transactional actions are action classes that execute their business logic within a database transaction. If any operation within the action fails, all changes are rolled back, ensuring data consistency. The transaction boundary aligns with the action boundary — each write action is a unit of work that either commits fully or fails completely. This prevents partial writes that leave the system in an inconsistent state, such as an inventory decrement without an order.

## Core Concepts

- **Transaction Boundaries**: The transaction wraps the action's entire execution scope. `DB::transaction()` runs the closure, issues `COMMIT` on success, `ROLLBACK` on exception.
- **Nested Transactions**: Laravel uses a single database transaction — nested `DB::transaction()` calls reuse the outer transaction. Inner transactions are no-ops unless savepoints are used.
- **Side-Effect Ordering**: Execute side effects (API calls, email, file I/O) AFTER the transaction commits. Keeping transactions short prevents lock contention.
- **Savepoints**: Allow rolling back part of a transaction without aborting the whole transaction. Useful for granular error recovery within an action.

## When To Use

- Always for write operations — every write action should be wrapped in a transaction by default
- Multi-step writes that must be atomic (order + inventory + payment)
- When data consistency across multiple tables is critical
- When partial writes would leave the system in an unrecoverable state

## When NOT To Use

- Read-only operations — transactions are unnecessary for reads (exception: consistent reads with repeatable read isolation)
- Idempotent operations where partial writes are acceptable
- Operations that include long-running side effects (move those outside the transaction)

## Best Practices

- Wrap write actions in `DB::transaction()` by default — only skip when there is a specific reason
- Execute side effects (API calls, email, file processing) AFTER the transaction commits, not inside it
- Use `DB::transaction($callback, $attempts)` with `$attempts > 1` for deadlock retry
- Acquire locks in consistent order across all code paths to prevent deadlocks
- For transactions spanning multiple database connections, consider distributed transaction patterns or saga patterns

## Architecture Guidelines

- Transaction placement: Inside the action method (most common), inside the service method (when coordinating multiple actions), NEVER in the controller
- Keep transactions short — enclose only the write operations, not I/O
- Inner `DB::transaction()` calls are safe — they reuse the outer transaction and do not create savepoints by default
- Use savepoints explicitly when you need partial rollback within a transaction
- The `attempts` parameter retries on deadlock detection

## Performance Considerations

- Transaction overhead is database-specific — PostgreSQL/MySQL have negligible overhead for short transactions (1-5 queries)
- Long-running transactions (>1 second) hold locks and reduce concurrency
- Keep action transactions short — move I/O operations (API calls, file processing) outside the transaction
- Use `lockForUpdate()` for pessimistic locking when race conditions are possible

## Security Considerations

- Transactions prevent partial writes that could leave sensitive data in an inconsistent security state
- After-commit hooks ensure queued jobs (with sensitive operations) only execute if the transaction commits
- Deadlock retry logic must not retry indefinitely with side effects — use the `attempts` parameter
- Transaction rollback protects against data corruption from partial failures

## Common Mistakes

- **Transactions That Include Side Effects**: Wrapping API calls or email sending inside the transaction. Solution: Execute side effects AFTER the transaction commits.
- **Transaction in Read-Only Actions**: Wrapping reads in transactions unnecessarily. Solution: Only use transactions when writing.
- **Swallowing Transaction Exceptions**: Wrapping `DB::transaction()` in try-catch that logs and returns null. Solution: Let exceptions propagate or re-throw domain-specific exceptions.
- **Inconsistent Lock Ordering**: Updating tables in different orders across code paths causes deadlocks. Solution: Always acquire locks in the same order.

## Anti-Patterns

- **Long-Running Transaction Starvation**: Action holds a transaction open for 10+ seconds during file processing. Other requests blocked on the same tables.
- **Phantom Reads in Concurrent Transactions**: Two concurrent transactions read the same data, both make decisions based on stale reads, second write overwrites the first.
- **Transaction as Service Layer**: Managing transactions in the controller instead of the action/service layer. Controllers should never manage transactions.

## Examples

### Simple Write Action with Transaction
```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(fn() => User::create([
            'name' => $dto->name,
            'email' => $dto->email,
            'password' => Hash::make($dto->password),
        ]));
    }
}
```

### Multi-Step Write with Deadlock Retry
```php
class PlaceOrderAction
{
    public function execute(PlaceOrderDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $accounts = Account::whereIn('id', $dto->accountIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();
            $this->inventory->reserve($dto->items);
            $order = Order::create([...]);
            return $order;
        }, attempts: 3);
    }
}
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Action Class Design | Action structure for transaction placement | Prerequisite |
| Database Fundamentals | Transaction isolation levels | Prerequisite |
| Action Composition | Composed actions with coordinator-level transactions | Related |
| Queued Actions | Async execution of transactional actions | Related |
| Saga Pattern | Multi-transaction workflows with compensation | Follow-up |
| Deadlock Detection and Retry | Handle deadlocks in transactional actions | Follow-up |

## AI Agent Notes

- The action class is the natural transaction boundary in CRUD architecture — each action represents a unit of work
- Wrap write actions in transactions by default; only skip when you have a specific reason
- Side effects must execute AFTER the transaction commits — use `DB::afterCommit()` or queue the side effect
- When generating transactional actions, include `DB::transaction()` with `attempts: 3` for production readiness
- Never manage transactions in controllers

## Verification

- [ ] Write actions are wrapped in `DB::transaction()`
- [ ] Side effects (API calls, email, file I/O) execute after the transaction commits
- [ ] Read operations do not use transactions (unless consistent reads are required)
- [ ] Deadlock retry is configured via `attempts` parameter
- [ ] Locks are acquired in consistent order across all code paths
- [ ] Transaction exceptions are not swallowed — they propagate or are re-thrown
- [ ] Controllers do not manage database transactions
- [ ] Transaction boundaries match action boundaries
