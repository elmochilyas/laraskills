# Transaction Management

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Transaction Management
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-01

---

## Executive Summary

Transaction management in the service layer governs how database operations are grouped into atomic units — if any operation fails, all prior operations in the unit are rolled back. The primary tool is `DB::transaction()`, which wraps a closure in begin-commit-rollback logic. The service layer is the appropriate boundary for transaction management because it is the layer that orchestrates multiple operations into a business workflow.

The engineering significance of transaction management lies in consistency. A service method that creates an order, decrements inventory, and charges a payment must either complete all three operations or revert all three. Partial completion is data corruption. The transaction boundary defines which operations are atomic — too narrow a boundary risks inconsistency, too wide a boundary risks long-running transactions that hold database locks.

Laravel's transaction system uses PHP's PDO transaction API with savepoint emulation for nested transactions. A nested `DB::transaction()` inside an existing transaction creates a savepoint, not a real nested transaction. This distinction is critical for service composition — if Service A calls Service B, and both use `DB::transaction()`, the inner call creates a savepoint that can roll back independently but cannot independently commit.

---

## Core Concepts

### Transaction Boundary
A transaction boundary defines which operations are atomic. In the service layer, the boundary should encompass all operations that must succeed or fail together:

```php
DB::transaction(function () {
    Order::create([...]);
    Product::decrement('stock', 1);
    Payment::record([...]);
    // All succeed together or all fail together
});
```

Operations OUTSIDE the boundary (cache invalidation, event dispatch, email sending) should happen after the transaction commits.

### Savepoint Emulation for Nested Transactions
Laravel does not support true nested transactions. When `DB::transaction()` is called inside another transaction, a savepoint is created:

```
Level 1: BEGIN TRANSACTION (real DB transaction)
Level 2: SAVEPOINT trans2 (savepoint, not new transaction)
Level 3: SAVEPOINT trans3 (nested savepoint)
```

A rollback to level 2 only rolls back to the savepoint — not to the beginning. A commit at level 2 does not commit anything (only the outer commit matters). This behavior is critical when composing services.

### Transaction Lifecycle
From `Illuminate\Database\Concerns\ManagesTransactions`:

```php
public function transaction(Closure $callback, $attempts = 1)
{
    for ($currentAttempt = 1; $currentAttempt <= $attempts; $currentAttempt++) {
        $this->beginTransaction();
        try {
            $callbackResult = $callback($this);
        } catch (Throwable $e) {
            $this->handleTransactionException($e, $currentAttempt, $attempts);
            continue; // Retry on deadlock
        }
        // If no exception: commit transaction
        return $callbackResult;
    }
}
```

The `$attempts` parameter enables automatic deadlock retry. If a deadlock occurs, the transaction is retried up to `$attempts` times (default: 1, meaning no retry).

### After-Commit Callbacks
`DB::afterCommit()` registers a callback that executes only after the outer transaction commits:

```php
DB::transaction(function () {
    $user = User::create([...]);

    DB::afterCommit(function () use ($user) {
        Mail::send(new WelcomeMail($user));
        Cache::forget('user_counts');
    });
});
```

If called outside a transaction, the callback executes immediately. This makes `afterCommit()` safe to use in contexts where a transaction may or may not be active.

### ShouldDispatchAfterCommit
Events implementing `ShouldDispatchAfterCommit` are not dispatched until the transaction commits:

```php
class UserRegistered implements ShouldDispatchAfterCommit
{
    use Dispatchable;
    public function __construct(public User $user) {}
}
```

This prevents event listeners from executing before the transaction data is visible in the database.

---

## Mental Models

### Transaction as Fence
A transaction is a fence around a set of operations. Outside the fence, other processes see either all the operations or none of them. Inside the fence, partial states exist momentarily but are invisible to others. The fence comes down (commit) or the fence stays up and everything inside is undone (rollback).

### Savepoint as Bookmark
A savepoint is a bookmark within a transaction. Rolling back to a savepoint undoes operations after the bookmark, but keeps earlier operations. This is useful for partial error recovery, but the confusion is that savepoints look like nested transactions — they are not. Only the outermost transaction controls the final commit.

### After-Commit as Backstage Exit
Post-completion operations (cache invalidation, event dispatch, email sending) must exit the stage AFTER the main performance is over. If they exit during the performance (before commit), the audience sees them but the performance may be cancelled. `DB::afterCommit()` is the backstage exit — it only runs when the show is confirmed over.

---

## Internal Mechanics

### ManagesTransactions State Machine

```php
// beginTransaction():
if ($this->transactions == 0) {
    $this->getPdo()->beginTransaction();   // Real DB transaction
} elseif ($this->transactions >= 1 && $this->queryGrammar->supportsSavepoints()) {
    $this->createSavepoint();               // SAVEPOINT trans2, trans3, etc.
}
$this->transactions++;

// commit():
if ($this->transactions == 1) {
    $this->getPdo()->commit();             // Real DB commit only at level 1
}
$this->transactions = max(0, $this->transactions - 1);

// rollBack($toLevel = null):
if ($toLevel == 0) {
    $this->getPdo()->rollBack();           // Real rollback
} elseif ($this->queryGrammar->supportsSavepoints()) {
    $this->getPdo()->exec('ROLLBACK TO SAVEPOINT trans'.($toLevel + 1));
}
```

The transaction counter tracks nesting depth. `commit()` at any level above 1 just decrements the counter. Only the outermost commit sends the real `COMMIT` to the database.

### Deadlock Retry Logic

```php
protected function handleTransactionException(Throwable $e, $currentAttempt, $maxAttempts)
{
    if ($this->transactions > 1) {
        // Nested transaction = savepoint: cannot retry whole transaction
        throw $e;
    }

    if ($currentAttempt >= $maxAttempts) {
        throw $e;
    }

    // Retry by catching, re-throw NOT called
    // The for loop in transaction() continues to next attempt
}
```

Nested transactions (savepoints) cannot be retried independently. Only the outermost transaction supports deadlock retry.

### DatabaseTransactionsManager (Test Harness)

Laravel's testing traits (`DatabaseTransactions`, `RefreshDatabase`) interact with `DatabaseTransactionsManager` to handle transaction callbacks in tests. The manager stages `afterCommit` callbacks and handles the test transaction lifecycle. Fixed in Laravel 10.26+ (PR #48523) to prevent `afterCommit` from being swallowed by test transactions.

---

## Patterns

### Service-Level Transaction Boundary

The orchestrating service method controls the transaction. Sub-operations do not manage their own transactions:

```php
class TransferService
{
    public function __construct(
        private AccountRepository $accounts,
        private LedgerService $ledger,
    ) {}

    public function transfer(Account $from, Account $to, Money $amount): void
    {
        DB::transaction(function () use ($from, $to, $amount) {
            $this->accounts->withdraw($from, $amount);
            $this->accounts->deposit($to, $amount);
            $this->ledger->record($from, $to, $amount);
        });
    }
}
```

The orchestrator owns the transaction. `withdraw()`, `deposit()`, and `record()` do not call `DB::transaction()` themselves.

### Post-Commit Event Dispatch

```php
class RegistrationService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->users->create($data);
            $this->roles->assign($user, 'member');

            DB::afterCommit(function () use ($user) {
                Event::dispatch(new UserRegistered($user));
                Mail::to($user->email)->send(new WelcomeMail($user));
                Cache::forget('user:stats:daily');
            });

            return $user;
        });
    }
}
```

All side effects wait for the commit. If the transaction rolls back, no events fire, no mail sends, no cache is invalidated.

### Action Without Transaction (Delegates to Orchestrator)

Actions called by orchestrators should NOT manage their own transactions:

```php
class CreateOrderAction
{
    public function __construct(private OrderRepository $orders) {}

    public function execute(array $data, Charge $charge): Order
    {
        // No DB::transaction() here — the orchestrator owns the boundary
        return $this->orders->create([...$data, 'charge_id' => $charge->id]);
    }
}
```

This allows the orchestrator to wrap the action call in a broader transaction that includes other actions.

### Manual Transaction Control (Conditional Commit)

When commit/rollback depends on business logic, not exceptions:

```php
class ConditionalTransferService
{
    public function transfer(Account $from, Account $to, Money $amount): TransferResult
    {
        DB::beginTransaction();
        try {
            $this->accounts->withdraw($from, $amount);
            $this->accounts->deposit($to, $amount);

            if ($from->balanceAfter($amount) < $this->minimumBalance) {
                DB::rollBack();
                return TransferResult::belowMinimumBalance();
            }

            DB::commit();
            return TransferResult::success();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
```

Manual control loses the deadlock retry benefit of `DB::transaction()`. Only use when the transaction outcome depends on non-exception business conditions.

### Transaction + Cache Invalidation

```php
class ProductService
{
    public function updatePrice(Product $product, Money $newPrice): Product
    {
        return DB::transaction(function () use ($product, $newPrice) {
            $product = $this->products->updatePrice($product, $newPrice);

            DB::afterCommit(function () use ($product) {
                Cache::forget("product:{$product->id}");
                Cache::tags(['products', 'pricing'])->flush();
            });

            return $product;
        });
    }
}
```

Cache invalidation is always after commit. Invalidating before or during the transaction creates a window where stale data is read between invalidation and commit.

---

## Architectural Decisions

### Why Transaction Boundaries Belong at the Orchestrator Level
Transactions are a consistency concern. The orchestrator — whether a service method or a coordinator — understands which operations must be atomic. Individual actions do not have this context. An action might be used in different workflows with different atomicity requirements. The orchestrator decides the boundary, not the action.

### Why Nested Transactions Are Savepoints
PHP's PDO and most databases (MySQL, PostgreSQL) do not support true nested transactions. Laravel's savepoint emulation is the best available approach: inner transactions can roll back independently via savepoints, but the outer transaction controls the final commit. This is consistent behavior, but it means inner "commits" are no-ops and inner "rollbacks" only undo operations after the savepoint.

### Why afterCommit Exists
Without `afterCommit`, developers must remember to move side effects outside the transaction closure. This is easy to forget, especially during refactoring. `afterCommit` makes the intent explicit: "this operation must happen after the transaction, not before or during." The safety feature — executing immediately if no transaction is active — prevents bugs when the method is called outside a transaction context.

---

## Tradeoffs

### Orchestrator-Owned Transaction vs Action-Managed Transaction

| Approach | Benefit | Cost |
|----------|---------|------|
| Orchestrator owns the transaction | Single rollback scope, clear atomicity, deadlock retry works | Actions cannot ensure their own atomicity when called independently |
| Each action manages its own transaction | Actions are self-contained, independently safe | Nested transactions = savepoints; inner rollback does not undo outer work |

### Closure Transaction vs Manual Begin/Commit

| Pattern | Benefit | Cost |
|---------|---------|------|
| `DB::transaction(Closure)` | Automatic commit on success, rollback on exception; deadlock retry; no missing rollback bugs | Cannot branch inside transaction based on business logic |
| Manual `begin/commit/rollback` | Conditional commit based on business logic | No deadlock retry; risk of missing rollback on exception paths |

### Transaction Width

| Scope | Benefit | Cost |
|-------|---------|------|
| Narrow: only the core write operations | Short lock duration, low contention | Risk of inconsistency if related operations fail |
| Wide: entire workflow including side effects | Complete atomicity | Long lock duration, deadlock risk, external API calls during lock |

---

## Performance Considerations

### Transaction Duration
Transactions hold database locks until commit or rollback. Long transactions increase:
- **Lock contention:** Other transactions wait for locks held by the long transaction
- **Deadlock probability:** More operations = higher chance of circular lock dependencies
- **Connection pooling pressure:** An open transaction holds the connection until resolved

Keep transactions as short as possible. Move external API calls, email sending, and file processing outside the transaction.

### Deadlock Retry Overhead
`DB::transaction($callback, $attempts: 3)` retries on deadlock. Each retry re-executes the entire closure. If the closure includes non-idempotent operations (API calls, increment counters), the retry may cause duplicate side effects.

### Savepoint Overhead
Each savepoint adds a small overhead (~0.01ms) for the `SAVEPOINT` command. Deep nesting (5+ levels) accumulates measurable overhead. For typical orchestration with 1–3 levels, the cost is negligible.

---

## Production Considerations

### Monitoring Transaction Failures
Monitor for:
- **Deadlock exceptions (`DeadlockException`):** Indicates lock contention in the workflow
- **Transaction timeout exceptions:** Indicates the transaction ran longer than `innodb_lock_wait_timeout`
- **Serialization failures:** Indicates concurrent write conflicts in high-traffic workflows

### Event Timing After Commit
Events using `ShouldDispatchAfterCommit` are queued after the transaction. The queue worker must be running to process them. If the queue worker is down, the events are never dispatched. This is correct behavior (events tied to committed transactions should not dispatch if the worker is unavailable), but it means failed workers lead to silent missed events.

### Testing Transaction Rollback
Always test both paths:
- **Success:** Verify all expected data is committed
- **Failure:** Verify NO partial data is committed after an exception

```php
public function test_transfer_rolls_back_on_failure()
{
    $from = Account::factory()->create(['balance' => 10]);
    $to = Account::factory()->create(['balance' => 0]);

    $this->expectException(InsufficientFundsException::class);

    $this->service->transfer($from, $to, 500);

    $this->assertEquals(10, $from->fresh()->balance);
    $this->assertEquals(0, $to->fresh()->balance);
}
```

---

## Common Mistakes

### Catching Exceptions Inside the Transaction Closure
Why it happens: Wrapping individual operations in try/catch for error handling. Why it's harmful: A caught exception does not escape the closure, so the transaction commits even though an operation failed. The database is left in a partially updated state. Better approach: Do not catch exceptions inside the closure. Let them bubble out. Wrap the `DB::transaction()` call in try/catch if you need error handling.

### External API Calls Inside the Transaction
Why it happens: The API call is part of the workflow. Why it's harmful: If the API succeeds but the transaction rolls back, the external system has an irreversible state change. If the API fails, the transaction is rolled back unnecessarily (the database operations were valid). Better approach: Move external calls outside the transaction or use `DB::afterCommit()`.

### Assuming Nested Transactions Are Real
Why it happens: Calling `DB::transaction()` inside another `DB::transaction()` and expecting true nesting. Why it's harmful: The inner commit is a no-op. The inner rollback only rolls back to the savepoint, not to the beginning of the outer transaction. Developers expect inner rollback to undo outer changes — it does not. Better approach: Have one orchestrator own the transaction. Do not nest transactions.

### Dispatching Events Before Commit
Why it happens: Events are dispatched inside the transaction closure for convenience. Why it's harmful: Event listeners execute immediately (for synchronous listeners) or are queued immediately (for queued listeners). If the transaction later rolls back, listeners have already acted on data that no longer exists. Better approach: Use `ShouldDispatchAfterCommit` or dispatch events after the transaction.

### Using RefreshDatabase When afterCommit Is Used
Why it happens: Tests use `RefreshDatabase` which wraps each test in a transaction. Why it's harmful: The test's outer transaction may prevent `afterCommit` callbacks from firing (the callback fires only when the outer transaction commits — which is at the end of the test, not after the service method). This was fixed in Laravel 10.26+, but older versions or certain configurations may still exhibit the bug. Better approach: Use `DatabaseTransactions` instead, or verify the fix version.

---

## Failure Modes

### Partial Commit on Exception Inside Closure
A try/catch inside `DB::transaction()` that does not re-throw prevents the exception from reaching the transaction handler. The transaction commits with partial changes. This is the most common transaction bug in Laravel applications.

### Stale Model After Transaction
A model retrieved before the transaction may have stale data after the transaction completes. The model's relationships, computed properties, or loaded counts may reflect pre-transaction state. Always call `$model->refresh()` after the transaction to get current state from the database.

### Savepoint Name Collision
Multiple inner transactions at the same nesting level use sequential savepoint names (`trans2`, `trans3`). If one inner transaction fails and rolls back to `trans2`, another inner transaction at the same level may lose its savepoint. Fixed in Laravel 10 via improved `DatabaseTransactionsManager` staging.

### afterCommit Callback on Wrong Connection
`DB::afterCommit()` callbacks are tied to the connection on which they are registered. If a transaction is on connection A and `afterCommit()` is called on connection B, the callback executes immediately (because connection B has no transaction), not after connection A's commit.

---

## Ecosystem Usage

### Laravel Framework
The framework itself uses `DB::transaction()` in several core components. The `Database\Concerns\ManagesTransactions` trait governs all transaction behavior. The `DatabaseTransactionsManager` handles callback lifecycle across nesting levels.

### Laravel Jetstream
Jetstream's team management actions use `DB::transaction()` for operations that span multiple tables (team record, team membership, user attributes). Transaction boundaries are set at the action level, not a separate orchestrator.

### Spatie Packages
Spatie's `laravel-queueable-action` includes transaction handling as a middleware option. Actions can opt into transaction wrapping declaratively, showing a pattern where transaction management is a cross-cutting concern rather than inline code.

### Production Pattern (Multiple Sources)
The dominant production pattern across Monica CRM, Akaunting, and community codebases is: orchestrator-owned transaction, action classes without transaction management, `afterCommit` for side effects, and `ShouldDispatchAfterCommit` for events.

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — How services are structured and compose operations
- Service Orchestration — Where transaction boundaries belong in workflows

### Related Topics
- Action Pattern — Transaction management in action classes (vs service-level)
- Service Testing — Testing transaction commit and rollback behavior

### Advanced Follow-up Topics
- Queued Actions — Transaction-aware job dispatch
- Event System — `ShouldDispatchAfterCommit` and `ShouldQueueAfterCommit`
- Failure Modes in Distributed Systems — Saga patterns for cross-service transactions

---

## Research Notes

### Source Analysis
- `Illuminate\Database\Concerns\ManagesTransactions.php` — Transaction counter, savepoint logic, deadlock retry
- `Illuminate\Database\DatabaseTransactionsManager.php` — Test transaction callback management
- PR #35373 — Introduction of `DB::afterCommit()` (Laravel 8)
- PR #48705 — `ShouldDispatchAfterCommit` implementation
- GitHub Issue #49057 — Nested transaction event dispatch race condition

### Key Insight
The savepoint emulation of nested transactions is the most commonly misunderstood behavior in Laravel transaction management. Developers expect that calling `DB::transaction()` inside another creates a true nested transaction. It does not — it creates a savepoint. This misunderstanding leads to bugs in service composition, where inner service "rollbacks" do not undo the outer service's changes.

### Key Bug History
- PR #49093: Fixed nested transaction `afterCommit` callback ordering (inner transaction callbacks were firing before outer transaction committed)
- PR #59058: Fixed `$afterCommit` on observer `creating`/`updating` events losing return values
- PR #48523: Fixed `afterCommit` callbacks being swallowed by test transactions

### Version-Specific Notes
- `DB::afterCommit()`: Laravel 8+
- `ShouldDispatchAfterCommit`: Laravel 9+
- `ShouldQueueAfterCommit`: Laravel 10+
- `DatabaseTransactionsManager` fix for test transactions: Laravel 10.26+
- Observer `$afterCommit` fix: Laravel 13+
