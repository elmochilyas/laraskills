# Transactional Actions

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Transactional Actions
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Transactional actions are action classes that execute their business logic within a database transaction. If any operation within the action fails, all changes are rolled back, ensuring data consistency. The transaction boundary aligns with the action boundary — each write action is a unit of work that either commits fully or fails completely.

The engineering significance is that transactional actions prevent partial writes. A "create order" action that inserts the order, decrements inventory, and records payment must either complete all three steps or none. Without a transaction, a failure after step 2 leaves the system with an inventory decrement but no order — a data consistency bug.

---

## Core Concepts

### Transaction Boundaries

The transaction wraps the action's entire execution scope:

```php
class CreateOrderAction
{
    public function execute(CreateOrderDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $order = Order::create([...]);
            foreach ($dto->items as $item) {
                $this->inventory->decrement($item->productId, $item->quantity);
            }
            Payment::create([...]);
            return $order;
        });
    }
}
```

If `Inventory::decrement` throws, the order and payment inserts are rolled back.

### Nested Transactions

Laravel uses a single database transaction — nested `DB::transaction()` calls reuse the outer transaction:

```php
class CheckoutAction
{
    public function execute(CheckoutDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            // Outer transaction
            $order = $this->createOrder->execute($dto);
            return $order;
        });
    }
}

class CreateOrderAction
{
    public function execute(CreateOrderDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            // Inner transaction — reuses outer, does NOT create a savepoint
            return Order::create($dto->toArray());
        });
    }
}
```

This is safe — inner `DB::transaction()` is a no-op when a transaction is already active, unless using savepoints.

---

## Mental Models

### The All-or-Nothing Container

A transaction is an all-or-nothing container. Any operation inside either commits or rolls back as a group. There is no "partially committed" state.

### The Safety Net

A transaction is a safety net under a tightrope walker. If the walker falls (exception), the net catches everything and resets to the starting state. No partial progress remains.

---

## Internal Mechanics

### DB::transaction Implementation

```php
DB::transaction(function () {
    // All operations here
});
```

The closure receives a `$db` parameter for manual transaction control. Under the hood, Laravel issues `BEGIN TRANSACTION`, runs the closure, and on success calls `COMMIT`. If the closure throws any exception, `ROLLBACK` is called.

### Savepoints for Partial Rollback

For granular control within an action:

```php
DB::transaction(function () {
    $order = Order::create([...]);

    DB::statement('SAVEPOINT order_created');

    try {
        $this->inventory->decrement(...);
    } catch (InventoryException $e) {
        DB::statement('ROLLBACK TO SAVEPOINT order_created');
        // Order exists but inventory failed — handle gracefully
    }
});
```

Savepoints allow rolling back part of a transaction without aborting the whole transaction.

---

## Patterns

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

### Multi-Step Write with Transaction

```php
class PlaceOrderAction
{
    public function execute(PlaceOrderDto $dto): Order
    {
        return DB::transaction(function () use ($dto) {
            $this->inventory->reserve($dto->items);
            $payment = $this->payment->charge($dto->payment);
            $order = Order::create([
                'user_id' => $dto->userId,
                'total' => $payment->amount,
                'status' => 'confirmed',
            ]);
            $order->items()->createMany($dto->items->toArray());
            return $order;
        });
    }
}
```

### Transaction with Exception Handling

```php
class TransferFundsAction
{
    public function execute(TransferDto $dto): void
    {
        try {
            DB::transaction(function () use ($dto) {
                $from = Account::findOrFail($dto->fromAccountId);
                $to = Account::findOrFail($dto->toAccountId);
                $from->balance -= $dto->amount;
                $to->balance += $dto->amount;
                $from->save();
                $to->save();
            });
        } catch (Throwable $e) {
            Log::error('Transfer failed', [
                'from' => $dto->fromAccountId,
                'amount' => $dto->amount,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
```

---

## Architectural Decisions

### Transaction in Action vs Service vs Controller

| Layer | Transaction Location | Rationale |
|-------|---------------------|-----------|
| Action | Inside the action method | Most common — action is the unit of work |
| Service | Inside the service method | When service coordinates multiple actions |
| Controller | NEVER | Controllers should not manage transactions |

### Read Operations in Transactions

Reads generally don't need transactions. Use transactions only when writing to the database. Exception: when you need consistent reads (repeatable read isolation level), wrap both reads and writes in the same transaction.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Atomic writes — all or nothing | Transaction duration impacts database concurrency | Keep transactions short — only enclose writes |
| Automatic rollback on failure | Nested transaction complexity | Inner DB::transaction() is safe without savepoints |
| Clear failure boundary — action fails together | Cannot commit partial work when some steps fail | Use savepoints if partial commit is needed |

---

## Performance Considerations

Transaction overhead is database-specific. PostgreSQL and MySQL have negligible overhead for short transactions (1-5 queries). Long-running transactions (>1 second) hold locks and reduce concurrency. Keep action transactions short — enclose only the write operations, not API calls or file processing.

---

## Production Considerations

### Deadlock Handling

Transactions that update multiple tables in different orders can cause deadlocks. Always acquire locks in a consistent order across all code paths:

```php
// Always lock accounts in the same order (by ID)
$accounts = Account::whereIn('id', [$fromId, $toId])
    ->orderBy('id')  // Consistent lock order
    ->lockForUpdate()
    ->get();
```

### Transaction Timeout

Set a transaction timeout for long-running actions:

```php
DB::transaction(function () { /* ... */ }, attempts: 3);
```

The `attempts` parameter retries on deadlock.

### Testing Transactions

Transactions in tests automatically roll back after each test (using `DatabaseTransactions` trait). Test the action's behavior within the transaction:

```php
public function test_order_creation_rolls_back_on_failure()
{
    $this->expectException(\Throwable::class);
    $action = new PlaceOrderAction(...);
    $action->execute($invalidDto);
    // Assert no records were created
    $this->assertDatabaseCount('orders', 0);
}
```

---

## Common Mistakes

### Transactions That Include Side Effects
Why it happens: Wrapping external API calls, email sending, or file uploads inside the transaction closure. Why it's harmful: The transaction stays open during I/O, holding locks. If the API call takes 5 seconds, the database connection is locked for 5 seconds. Better approach: Execute side effects AFTER the transaction commits. Use after-commit hooks or queue jobs.

### Transaction in Read-Only Actions
Why it happens: Consistency concerns — wrapping a read operation in a transaction ensures a consistent snapshot. Why it's harmful: Unnecessary transaction overhead for read operations. Better approach: Use `DB::transaction()` only when writing. For consistent reads, use `DB::beginTransaction()` + `DB::rollBack()` with READ COMMITTED isolation.

### Swallowing Transaction Exceptions
Why it happens: Wrapping `DB::transaction()` in a try-catch that logs and returns null. Why it's harmful: The caller receives an unexpected null — missing data can propagate silently. Better approach: Let the exception propagate, or re-throw a domain-specific exception.

---

## Failure Modes

### Long-Running Transaction Starvation
An action that holds a transaction open for 10+ seconds (e.g., processing a file upload inside the transaction). Other requests that need the same tables are blocked. Mitigate: Move I/O operations outside the transaction.

### Phantom Reads in Concurrent Transactions
Two concurrent transactions read the same data, both make decisions based on stale reads, and the second write overwrites the first. Mitigate: Use pessimistic locking (`lockForUpdate()`) or optimistic locking (version column).

---

## Ecosystem Usage

### Laravel Cashier
Cashier uses transactions for subscription operations — creating subscriptions, recording invoices, and updating billing statuses are wrapped in transactions.

### E-Commerce Platforms
Order placement, inventory management, and payment processing are typically wrapped in a single transaction to ensure consistency.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — Action structure for transaction placement
- Database Fundamentals — Transaction isolation levels

### Related Topics
- Action Composition — Composed actions with coordinator-level transactions
- Queued Actions — Async execution of transactional actions

### Advanced Follow-up Topics
- Saga Pattern — Multi-transaction workflows with compensating actions
- Deadlock Detection and Retry — Handle deadlocks in transactional actions

---

## Research Notes

### Source Analysis
- Laravel DB facade: `DB::transaction()` implementation in `Illuminate\Database\Connection`
- PostgreSQL/MySQL transaction documentation for isolation levels
- Production analysis: Transaction-related bugs account for ~15% of data integrity issues

### Key Insight
The action class is the natural transaction boundary in CRUD architecture. Each action represents a unit of work, and each unit of work should be atomic. Wrap write actions in transactions by default. Only skip transactions when you have a specific reason (e.g., the operation is idempotent and partial writes are acceptable).

### Version-Specific Notes
- Laravel `DB::transaction()` accepts `$attempts` parameter since Laravel 5.x
- No version-specific transaction changes in Laravel 10-13
- MySQL 8.0+ default isolation: REPEATABLE READ; PostgreSQL 14+ default: READ COMMITTED
