# Commit Strategies

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
Commit strategies govern when model lifecycle events — particularly broadcasts and queued listeners — are dispatched relative to the database transaction boundary. The two primary strategies are before-commit (events fire immediately, within the transaction) and after-commit (events fire only after the transaction commits). Laravel provides `ShouldQueueAfterCommit`, `BroadcastsEventsAfterCommit`, and the `afterCommit` configuration option to control this behavior. Choosing the right strategy is critical for data consistency, UI correctness, and system reliability.

## Core Concepts
- **Before-commit dispatch:** Events and broadcasts fire immediately during the request, within any active database transaction. If the transaction later rolls back, the events have already been dispatched and cannot be recalled.
- **After-commit dispatch:** Events and broadcasts are deferred until the database transaction commits. If the transaction rolls back, the events are never dispatched.
- **`ShouldQueueAfterCommit` interface:** Applied to a queued event/listener, instructs the dispatcher to only push the job onto the queue after the transaction commits.
- **`BroadcastsEventsAfterCommit` trait:** A variant of `BroadcastsEvents` that defers model broadcasts until the transaction commits.
- **`$afterCommit` property:** A property on queued jobs and broadcast events that controls whether they dispatch before or after commit. Default is `false` (immediate dispatch).
- **Transaction awareness:** Laravel's queue and broadcast systems are transaction-aware. They hook into the database transaction lifecycle to defer dispatch when requested.

## Mental Models
- **Delivery guarantee:** Before-commit is "optimistic delivery" — fire now, hope the transaction commits. After-commit is "guaranteed delivery" — fire only when the data is confirmed persisted.
- **Phantom broadcasts:** Before-commit broadcasts are like phantom messages — they reach clients with data that may not exist in the database. Clients see a record appear and then potentially disappear.
- **Transaction as checkpoint:** Think of the transaction commit as the checkpoint. Before-commit events are released at the envelope check-in. After-commit events are released after the checkpoint is confirmed passed.

## Internal Mechanics
- Laravel's database transaction handling in `Illuminate\Database\DatabaseTransactionsManager` maintains a stack of transaction levels.
- The queue's `ShouldQueueAfterCommit` is checked by `Illuminate\Queue\CallQueuedHandler` and `Illuminate\Events\CallQueuedListener`.
- When `afterCommit` is true, the queued job is stored in a deferred array within the transaction manager. It is only pushed to the actual queue when `transactionManager->commit()` is called.
- If a rollback occurs, the deferred jobs are discarded without being pushed to the queue.
- For broadcasting, `BroadcastsEventsAfterCommit` sets the broadcast event's `$afterCommit` property to `true`, which triggers the same transaction-aware deferral mechanism.

```php
// Simplified after-commit mechanism:
class DatabaseTransactionsManager
{
    protected array $afterCommitCallbacks = [];
    
    public function addAfterCommitCallback(callable $callback): void
    {
        $this->afterCommitCallbacks[] = $callback;
    }
    
    public function commit(): void
    {
        foreach ($this->afterCommitCallbacks as $callback) {
            $callback(); // Now push to queue / broadcast
        }
        $this->afterCommitCallbacks = [];
    }
    
    public function rollBack(): void
    {
        $this->afterCommitCallbacks = []; // Discard
    }
}
```

- The `CallQueuedListener` checks `$this->afterCommit` before dispatching. If true, it registers the job dispatch as an after-commit callback.

## Patterns
- **After-commit for user-facing notifications:** Always use after-commit for emails, push notifications, and real-time broadcasts. Users should never receive notifications for data that was rolled back.
- **Before-commit for internal audit logging:** Audit logs can safely fire before commit — if the transaction rolls back, the audit log entry may be slightly ahead of the actual data, but audit logs are append-only and the rollback will be recorded separately.
- **After-commit for search index updates:** After-commit ensures the search index only contains committed data. A before-commit update could index a record that does not exist after a rollback.
- **Mixed strategy in complex workflows:** Use before-commit for cache invalidation (invalidating a cache entry for data that may roll back is harmless — the cache is just stale until the next successful write) and after-commit for external API calls:

```php
// Cache invalidation — safe to do before commit
static::saved(function ($model) {
    Cache::forget('user.'.$model->id);
});

// External API call — must be after commit
User::observe(new class {
    public function created(User $user): void
    {
        dispatch(new SyncToCRM($user))->afterCommit();
    }
});
```

- **Transactional consistency pattern:** Wrap related model operations in a database transaction. Use after-commit strategies for all side effects beyond the transaction boundary:

```php
DB::transaction(function () use ($orderData) {
    $order = Order::create($orderData);
    $invoice = Invoice::createFromOrder($order);
    // After-commit handles: email invoice, update ERP, broadcast to dashboard
});
```

## Architectural Decisions
- **Why after-commit is not the default?** — Backward compatibility. Changing the default would break existing applications that depend on immediate dispatch. The explicit `ShouldQueueAfterCommit` interface and `$afterCommit` property make the developer consciously choose the strategy.
- **Why per-event configuration instead of global?** — Different side effects have different consistency requirements. A cache invalidate can fire before commit; an order confirmation email must fire after commit. Per-event configuration allows mixing strategies.
- **Why transaction manager integration?** — The transaction manager provides a hook point that works across all database connections and transaction types. Integrating at this level ensures consistent behavior regardless of how transactions are managed.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| After-commit guarantees data consistency | After-commit events delay side effects by transaction duration | Acceptable for most use cases; transaction times should be short |
| Before-commit provides immediate feedback | Before-commit risks phantom data in external systems | Use before-commit only for reversible or idempotent side effects |
| Per-event configuration is flexible | Inconsistent strategy within same workflow can confuse | Document the strategy choice for each event listener |
| Transaction manager integration is seamless | Nested transactions add complexity to commit/rollback detection | After-commit callback fires on outermost commit only |

## Performance Considerations
- **Deferred dispatch overhead:** Storing after-commit callbacks in memory during the transaction adds negligible overhead. The callbacks are simple closures.
- **Transaction duration sensitivity:** After-commit dispatch only fires when the transaction commits. Long-running transactions delay all after-commit side effects. Keep transactions short.
- **Connection-specific transactions:** After-commit behavior is per-connection. If operations span multiple database connections, the commit callback fires when ALL connections in the transaction commit.

## Production Considerations
- **Transaction monitoring:** Monitor long-running transactions. After-commit delays compound with long transactions, delaying side effects (emails, broadcasts, search updates).
- **Queue worker availability:** After-commit queued jobs still require a running queue worker to process. If the worker is down, after-commit jobs accumulate regardless of strategy.
- **Deferred job visibility:** After-commit jobs are not visible in the queue until the transaction commits. This can make debugging difficult — a job that appears to not be queued may simply be waiting for a transaction commit.
- **Database transaction timeouts:** If a database transaction times out and rolls back, after-commit jobs are discarded. The application must handle this case by retrying the entire transaction.

## Common Mistakes
- **Using before-commit for email sending:** A user receives a "your order is confirmed" email for an order that was rolled back. This erodes trust. Always queue emails after commit.
- **Assuming after-commit works for all queued jobs:** Only jobs dispatched inside a database transaction are deferred by after-commit. If there is no active transaction, the job dispatches immediately regardless of `afterCommit`.
- **Forgetting `afterCommit` on Redis-only operations:** If the application uses Redis for caching but MySQL for transactions, after-commit only respects MySQL transactions. Cache operations outside the transaction are not affected.
- **Mixing strategies inconsistently:** Some listeners use after-commit, others use before-commit, with no documentation. This makes side-effect timing unpredictable and hard to debug.

## Failure Modes
- **Phantom record in external system:** A before-commit broadcast or API call notifies external systems of a record that was rolled back. The external system has a phantom record that must be manually cleaned up.
- **Stale cache after rollback:** Before-commit cache invalidation clears a cache entry. The transaction rolls back, so the database data is unchanged. The cache is now stale until the next write, serving fresh data as if nothing changed.
- **Job duplication on retry:** If a transaction commits but the queue connection fails before the job is pushed, the transaction cannot be rolled back. Retrying the transaction creates duplicate jobs. Implement idempotency in job handlers.
- **Nested transaction confusion:** In nested transactions, after-commit callbacks fire on the outermost commit. An inner savepoint rollback does NOT trigger after-commit callback discard. Jobs are only discarded on a full transaction rollback.

## Ecosystem Usage
- **Laravel Cashier:** Uses after-commit strategies for billing webhooks and invoice emails to ensure only confirmed charges trigger external notifications.
- **Laravel Spark:** Uses after-commit for team invitation emails and subscription updates to prevent phantom notifications.
- **Laravel Horizon:** Monitors queue health and can surface after-commit jobs that are pending transaction commit completion.

## Related Knowledge Units

### Prerequisites
- Laravel Queues
- Database Transactions

### Related Topics
- Broadcast Events Trait
- Event Control (Quiet Operations)

### Advanced Follow-up Topics
- Queue Workers
- Transaction Management
- Job Idempotency

## Research Notes
- **Source Analysis:** `Illuminate\Queue\CallQueuedHandler` — checks `$this->afterCommit` property. `Illuminate\Bus\Queueable` trait defines the `$afterCommit` property. `Illuminate\Database\DatabaseTransactionsManager` manages deferred callbacks.
- **Key Insight:** The after-commit mechanism is implemented in the QUEUE layer, not the event layer. This means it works for all queued jobs, not just model event listeners. Any `dispatch()->afterCommit()` call benefits from transaction-aware deferral.
- **Version-Specific Notes:** `ShouldQueueAfterCommit` was introduced in Laravel 8.x. The `$afterCommit` property on the `Queueable` trait was added in Laravel 9.x. `BroadcastsEventsAfterCommit` was introduced alongside the `BroadcastsEvents` trait in Laravel 10.x. Prior to these additions, developers had to manually implement after-commit logic using `DB::afterCommit()` or `event(new MyEvent())->afterCommit()`.
