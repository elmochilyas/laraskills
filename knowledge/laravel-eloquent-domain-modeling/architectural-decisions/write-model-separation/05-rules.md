# Architectural Decision Rules: Write Model Separation

---

## Rule 1: Route every state mutation through a command handler
---
## Category
Architecture
---
## Rule
Every operation that changes application state must go through a named command handler class. Never mutate state directly in controllers, Blade directives, or event listeners.
---
## Reason
Command handlers provide a single, named entry point for each mutation, making state changes auditable, interceptable (via middleware), and testable in isolation. Direct mutations scattered across the codebase are invisible to auditing and cannot be monitored or replayed.
---
## Bad Example
```php
// State mutation hidden in a controller
class OrderController
{
    public function cancel(int $id)
    {
        $order = Order::findOrFail($id);
        $order->status = 'cancelled'; // Direct mutation — no audit trail
        $order->save();
    }
}
```
---
## Good Example
```php
// Explicit command handler
class CancelOrderHandler
{
    public function handle(CancelOrderCommand $command): void
    {
        DB::transaction(function () use ($command) {
            $order = Order::lockForUpdate()->findOrFail($command->orderId);
            $order->cancel($command->reason);
            $order->save();
        });
    }
}

// Controller dispatches command
class OrderController
{
    public function cancel(CancelOrderRequest $request, CancelOrderHandler $handler)
    {
        $handler->handle($request->toCommand());
        return redirect()->route('orders.show', $request->orderId);
    }
}
```
---
## Exceptions
Trivial field updates that are not domain state transitions (e.g., updating `last_viewed_at` on a notification). Use direct model methods for these, not command handlers.
---
## Consequences Of Violation
State changes are scattered and hard to audit; cannot implement command logging, replay, or throttling; no single point to enforce transactional consistency.

---

## Rule 2: Push invariants to the model, not the command handler
---
## Category
Architecture
---
## Rule
Command handlers must not contain `if` statements enforcing domain invariants. All business rules and state transition guards belong in the domain model's methods.
---
## Reason
Invariants in command handlers are invisible when reasoning about the domain model. When the business rule changes, the developer must find every handler that duplicates the rule. Model methods provide a single authoritative enforcement point.
---
## Bad Example
```php
class CancelOrderHandler
{
    public function handle(CancelOrderCommand $command): void
    {
        $order = Order::findOrFail($command->orderId);
        if ($order->status !== 'pending') { // Invariant in handler
            throw new \DomainException('Only pending orders can be cancelled.');
        }
        $order->status = 'cancelled';
        $order->save();
    }
}
```
---
## Good Example
```php
class CancelOrderHandler
{
    public function handle(CancelOrderCommand $command): void
    {
        $order = Order::findOrFail($command->orderId);
        $order->cancel($command->reason); // Invariant enforced in model
        $order->save();
    }
}

class Order extends Model
{
    public function cancel(string $reason): void
    {
        if (! $this->canBeCancelled()) {
            throw new OrderCannotBeCancelledException($this);
        }
        $this->status = OrderStatus::Cancelled;
        $this->cancelled_at = now();
        $this->cancellation_reason = $reason;
    }
}
```
---
## Exceptions
When the invariant involves state from multiple models and does not naturally belong to any single model. In that case, the handler is the appropriate place, but consider extracting a domain service.
---
## Consequences Of Violation
Anemic write models; business rules duplicated across handlers; rule changes require edits in multiple handlers; domain model's behavior is hidden from developers maintaining it.

---

## Rule 3: Use optimistic concurrency with a version column for write models
---
## Category
Reliability
---
## Rule
Add a `version` integer column to write model tables. Before updating, verify the version matches the expected value. Increment the version on every update. Use `where('version', $expectedVersion)` in the update query.
---
## Reason
Without optimistic concurrency, two simultaneous requests can load the same aggregate, both modify it, and the second overwrites the first's changes without detection. Version checking converts this silent data loss into a detectable conflict exception.
---
## Bad Example
```php
class CancelOrderHandler
{
    public function handle(CancelOrderCommand $command): void
    {
        $order = Order::findOrFail($command->orderId);
        $order->cancel($command->reason);
        $order->save(); // Last write wins — no conflict detection
    }
}
```
---
## Good Example
```php
class CancelOrderHandler
{
    public function handle(CancelOrderCommand $command): void
    {
        $order = Order::findOrFail($command->orderId);
        $order->cancel($command->reason);

        $updated = Order::where('id', $order->id)
            ->where('version', $order->version)
            ->update([
                'status' => $order->status,
                'version' => $order->version + 1,
            ]);

        if ($updated === 0) {
            throw new OrderConcurrentModificationException($order);
        }
    }
}
```
---
## Exceptions
When the write model has a single writer (e.g., event-sourced aggregates with a single stream writer). In that case, optimistic concurrency is handled by the event store.
---
## Consequences Of Violation
Silent data loss from concurrent writes; conflicts surface as user confusion ("my change was lost") instead of catchable exceptions; debugging is nearly impossible because the overwritten state is gone.

---

## Rule 4: Design command handlers to be idempotent
---
## Category
Reliability
---
## Rule
Ensure the same command executed twice produces the same result as executing it once. Use idempotency keys — store a unique key per command in a separate table and skip processing if the key already exists.
---
## Reason
Network retries, queue redeliveries, and user double-clicks can cause the same command to be processed multiple times. Without idempotency, duplicates cause double charges, duplicate orders, or duplicate notifications.
---
## Bad Example
```php
class ChargeCustomerHandler
{
    public function handle(ChargeCustomerCommand $command): void
    {
        $this->gateway->charge($command->amount);
        // If called twice, customer is charged twice
    }
}
```
---
## Good Example
```php
class ChargeCustomerHandler
{
    public function handle(ChargeCustomerCommand $command): void
    {
        if (ProcessedCommand::where('idempotency_key', $command->idempotencyKey)->exists()) {
            return; // Already processed
        }

        DB::transaction(function () use ($command) {
            $this->gateway->charge($command->amount);
            ProcessedCommand::create(['idempotency_key' => $command->idempotencyKey]);
        });
    }
}
```
---
## Exceptions
Read-only commands that have no side effects. Commands where duplicate execution is safe (e.g., "set user preferences" where the last write wins).
---
## Consequences Of Violation
Duplicate charges to customer credit cards; duplicate orders in the system; duplicate email notifications; customer dissatisfaction and support overhead.

---

## Rule 5: Never read from the write model in the same request that writes
---
## Category
Reliability
---
## Rule
When a command handler modifies state, use the returned model or refresh instead of reading from the database again within the same request. Reading from the write model after writing can return stale data if the transaction hasn't committed.
---
## Reason
Within a transaction, subsequent reads may see the pre-write state due to transaction isolation levels. Outside a transaction, a read immediately after a write may hit a read replica that hasn't replicated the change yet.
---
## Bad Example
```php
class CreateOrderHandler
{
    public function handle(CreateOrderCommand $command): Order
    {
        $order = Order::create($command->toArray());
        $fresh = Order::find($order->id); // May return stale or null
        return $fresh;
    }
}
```
---
## Good Example
```php
class CreateOrderHandler
{
    public function handle(CreateOrderCommand $command): Order
    {
        $order = Order::create($command->toArray());
        return $order->fresh(); // Reload from same connection within transaction
    }
}
```
---
## Exceptions
When using after-commit callbacks to update a read model. In that case, reading after commit is acceptable because the transaction has completed.
---
## Consequences Of Violation
Stale data returned from prematurely reading within an uncommitted transaction; null values when the read replica hasn't replicated; confusing test failures with in-memory databases.

---

## Rule 6: Always wrap command handlers in transactions
---
## Category
Reliability
---
## Rule
Every command handler that performs writes must wrap its logic in `DB::transaction()`. Single-model writes that call `$model->save()` are covered if the model method itself does not create a transaction (it should not).
---
## Reason
Command handlers often perform multiple write operations: updating the aggregate, recording events, updating related models. Without a transaction, a failure mid-way leaves partial writes. The transaction ensures atomicity.
---
## Bad Example
```php
class ProcessRefundHandler
{
    public function handle(ProcessRefundCommand $command): void
    {
        $payment = Payment::findOrFail($command->paymentId);
        $payment->markAsRefunded();
        $payment->save();
        $this->refundGateway->issueRefund($payment);
        // If issueRefund throws, payment is marked refunded but no actual refund issued
    }
}
```
---
## Good Example
```php
class ProcessRefundHandler
{
    public function handle(ProcessRefundCommand $command): void
    {
        DB::transaction(function () use ($command) {
            $payment = Payment::lockForUpdate()->findOrFail($command->paymentId);
            $payment->markAsRefunded();
            $payment->save();
            $this->refundGateway->issueRefund($payment);
        });
    }
}
```
---
## Exceptions
Read-only handlers. Handlers whose side effects are inherently non-transactional (e.g., sending an email). In the latter case, use `DB::afterCommit()` to send after the transaction succeeds.
---
## Consequences Of Violation
Partial state updates causing data inconsistency; financial system becomes out of sync; debugging requires comparing multiple database tables to find incomplete operations.

---

## Rule 7: Return `void` or a simple success signal from command handlers — never display data
---
## Category
Code Organization
---
## Rule
Command handler methods must return `void` or a simple success indicator. They must not return data designed for display. Display data retrieval belongs in Query Objects or read models.
---
## Reason
Returning display data from a command handler mixes write and read concerns. The handler's purpose is to execute a state change, not to format results for presentation. Separating these keeps the write path focused on consistency and the read path focused on optimization.
---
## Bad Example
```php
class CreateOrderHandler
{
    public function handle(CreateOrderCommand $command): array // Returns display data
    {
        $order = Order::create($command->toArray());
        return [
            'id' => $order->id,
            'total' => $order->total,
            'items' => $order->items->toArray(),
            'status' => $order->status,
        ];
    }
}
```
---
## Good Example
```php
class CreateOrderHandler
{
    public function handle(CreateOrderCommand $command): void // Void — just executes
    {
        DB::transaction(function () use ($command) {
            $order = Order::create($command->toArray());
            $this->eventBus->dispatch(new OrderCreated($order->id));
        });
    }
}

// Controller handles display separately
$handler->handle($command);
$order = Order::with('items')->find($orderId);
return new OrderResource($order);
```
---
## Exceptions
When the handler must return the created entity's ID for the caller to proceed (e.g., returning `int $orderId` for redirect URI construction). Return primitives only, not serialized display data.
---
## Consequences Of Violation
Command handler mixes write and display concerns; display formatting logic creeps into the write path; handler cannot be queued because it returns data; query optimization (eager loading) is conflated with transactional logic.

---

## Rule 8: Write models must not have public query methods — those belong on read models
---
## Category
Code Organization
---
## Rule
Remove public query methods (finders, scopes) from write model classes. Put query logic on read models dedicated to display optimization.
---
## Reason
Write models that expose query methods accumulate read concerns over time, blurring the CQRS boundary. Developers add `scopePopular()` next to `markAsPaid()`, and the write model becomes a dumping ground for both read and write logic. Separating them keeps each side focused.
---
## Bad Example
```php
class Order extends Model
{
    // Write methods
    public function cancel(string $reason): void { /* ... */ }
    public function markAsPaid(): void { /* ... */ }

    // Query methods — should not be on write model
    public function scopeForDashboard(Builder $query): Builder { /* ... */ }
    public function scopeMonthlyReport(Builder $query): Builder { /* ... */ }
    public static function topSellers(int $limit): Collection { /* ... */ }
}
```
---
## Good Example
```php
class Order extends Model
{
    // Only write methods
    public function cancel(string $reason): void { /* ... */ }
    public function markAsPaid(): void { /* ... */ }
    protected function save(): void { /* ... */ }
}

// Query logic on dedicated read models or query objects
class OrderDashboardQuery { /* ... */ }
class MonthlyReportQuery { /* ... */ }
class TopSellersQuery { /* ... */ }
```
---
## Exceptions
When the write model must load its own relations to enforce invariants (e.g., loading lines to check inventory). Private/protected query methods for internal invariant enforcement are acceptable.
---
## Consequences Of Violation
Write model accumulates read concerns; query methods obscure the model's core write responsibility; developers add read methods to the write model because "it's already there," reinforcing the anti-pattern.
