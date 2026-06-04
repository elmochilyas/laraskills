# Transaction Management — Engineering Rules

---

## Rule 1: Set Transaction Boundaries at the Service Orchestration Level

Transactions must be managed at the service layer, not inside individual actions, controllers, or repositories.

---

## Category

Reliability

---

## Rule

Database transaction boundaries must be set at the service orchestration method level using `DB::transaction()`. Controllers must not manage transactions. Actions must not begin their own transactions when called within a service orchestration. Repositories must not manage transactions.

---

## Reason

The service method knows the full workflow boundary — which operations must succeed or fail together. Controllers, actions, and repositories lack this context. Placing transaction control at the wrong layer leads to missing transaction boundaries, incorrect nesting, or partial writes on failure.

---

## Bad Example

```php
class OrderController
{
    public function store(Request $request)
    {
        DB::beginTransaction(); // Transaction in controller
        $order = Order::create($request->all());
        Payment::create(['order_id' => $order->id, 'amount' => $request->amount]);
        Inventory::decrement($request->items);
        DB::commit();
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $inventory = $this->reserveInventory->handle($data->items);
            $payment = $this->processPayment->handle($data->payment);
            return $this->createOrder->handle($data, $payment);
        });
    }
}
```

---

## Exceptions

CLI commands or queue jobs with no service layer abstraction may manage their own transactions directly. Refactor into a service when shared orchestration is needed.

---

## Consequences Of Violation

Reliability risks: partial writes on failure (inventory reserved but payment not charged). Maintenance risks: transaction boundaries scattered across the codebase. Testing risks: transaction logic cannot be tested independently of the transport layer.

---

## Rule 2: Actions Must Not Manage Their Own Transactions

Individual action classes must not call `DB::beginTransaction()`, `DB::commit()`, or `DB::rollBack()` when they are composed within a service orchestration.

---

## Category

Architecture

---

## Rule

Action classes must not manage transactions unless they are explicitly designed as standalone operations that are never composed within a service transaction. Actions that may sometimes be composed and sometimes be standalone must use a parameterized pattern (e.g., accepting a `$transactional` flag) or must defer transaction management to the caller.

---

## Reason

When an action starts its own transaction and a service also wraps it in a transaction, the nested transaction counter creates non-obvious behavior — only the outermost transaction actually commits. The inner transaction's rollback may not have the expected effect. Actions should be transaction-ignorant when composed.

---

## Bad Example

```php
class ReserveInventoryAction
{
    public function handle(array $items): void
    {
        DB::transaction(function () { // Action manages its own transaction
            foreach ($items as $item) {
                Product::where('id', $item['product_id'])->decrement('stock', $item['quantity']);
            }
        });
    }
}

class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->handle($data->items); // Nested transaction
            // ...
        });
    }
}
```

---

## Good Example

```php
class ReserveInventoryAction
{
    public function handle(array $items): void
    {
        // No transaction — caller controls the boundary
        foreach ($items as $item) {
            Product::where('id', $item['product_id'])->decrement('stock', $item['quantity']);
        }
    }
}

class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->handle($data->items);
            // ...
        });
    }
}
```

---

## Exceptions

Actions that are ALWAYS standalone (never called inside a service transaction) may manage their own transaction. Document this to prevent breakage if the action is later composed.

---

## Consequences Of Violation

Reliability risks: nested transaction behavior is non-obvious — inner rollbacks may not roll back outer operations. Maintenance risks: composing an action into a service transaction may silently break transactional guarantees.

---

## Rule 3: Use Deadlock Retry for High-Contention Operations

Transactions on high-contention tables (orders, inventory, payments) must use `DB::transaction(callback, 3)` to automatically retry on deadlock.

---

## Category

Reliability

---

## Rule

Any `DB::transaction()` call that operates on high-contention tables (inventory, orders, payments, user balances, reservations) must specify a retry count of at least 3 via the second parameter: `DB::transaction(callback, 3)`. Operations on low-contention reference data (lookup tables, configuration) may use the default single attempt.

---

## Reason

Deadlocks are inevitable in concurrent applications. Laravel's default retry count is 1 (no retry on deadlock). Without retry, a deadlock causes a 400+ HTTP error and failed user operation. Automatic retry handles transient deadlocks transparently, providing resilience without application-level recovery code.

---

## Bad Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            // No retry — deadlock = 500 error
            $this->reserveInventory->handle($data->items);
            return $this->processPayment->handle($data->payment);
        }); // Default = 1 attempt, no retry on deadlock
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->handle($data->items);
            return $this->processPayment->handle($data->payment);
        }, 3); // Retry up to 3 times on deadlock
    }
}
```

---

## Exceptions

Read-only operations and single-row writes on non-contended tables may use the default retry count.

---

## Consequences Of Violation

Reliability risks: deadlock causes unhandled exceptions and failed user operations. User experience risks: transient concurrency issues result in 500 errors. Scalability risks: deadlock frequency increases with traffic, causing proportional failure rate.

---

## Rule 4: Keep Transaction Scope Minimal

Only database operations that require atomicity must be inside the transaction. External API calls, file I/O, email sending, and slow computations must be excluded.

---

## Category

Performance

---

## Rule

Transactions must be scoped to the minimum set of database operations that need atomic writes. Non-database operations (HTTP calls, email sending, file system writes, cache operations, slow computations) must be placed outside the transaction boundary.

---

## Reason

Long-running transactions hold database locks, increasing contention and deadlock probability. External API calls inside transactions can hold locks for seconds while waiting for network responses. This dramatically reduces application throughput and increases failure rate.

---

## Bad Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $order = $this->orders->create($data);
            $this->paymentGateway->charge($data->amount); // API call — holds lock
            $this->mail->sendConfirmation($order); // Email — holds lock
            return $order;
        });
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        $order = DB::transaction(function () use ($data) {
            return $this->orders->create($data);
        });

        // Non-DB operations outside transaction
        $this->paymentGateway->charge($data->amount);
        $this->mail->sendConfirmation($order);

        return $order;
    }
}
```

---

## Exceptions

Operations that require atomicity with database writes (e.g., charging a payment and writing to an audit log in the same transaction) may include the external call if the external system supports transactional behavior (e.g., two-phase commit). This is rare.

---

## Consequences Of Violation

Performance risks: database locks held during slow I/O, reducing throughput. Reliability risks: increased deadlock probability under load. Scalability risks: lock contention becomes a bottleneck as concurrency increases.

---

## Rule 5: Use Manual Transaction Control for Complex Workflows

Closure-based `DB::transaction()` is preferred for simple workflows. Use `DB::beginTransaction()`, `DB::commit()`, `DB::rollBack()` for workflows with conditional commits, multiple method calls, or branching logic.

---

## Category

Design

---

## Rule

Simple, linear workflows where all operations succeed or fail together must use `DB::transaction(callback)`. Complex workflows with conditional branching (commit if condition X, rollback if condition Y), spanning multiple methods, or requiring early returns must use manual `beginTransaction()`/`commit()`/`rollBack()`.

---

## Reason

The closure-based `transaction()` always commits on success and rolls back on exception. It cannot handle workflows where the decision to commit depends on runtime conditions (e.g., "commit only if payment succeeds and inventory is available"). Manual control provides fine-grained commit/rollback decisions.

---

## Bad Example

```php
class RefundService
{
    public function processRefund(RefundData $data): RefundResult
    {
        return DB::transaction(function () use ($data) {
            $payment = Payment::find($data->paymentId);
            $refund = Refund::create(['payment_id' => $payment->id]);

            if ($data->amount > $payment->remainingBalance) {
                // Can't conditionally rollback in closure
                throw new InsufficientBalanceException();
            }

            $payment->decrement('remaining_balance', $data->amount);
            return $refund;
        });
    }
}
```

---

## Good Example

```php
class RefundService
{
    public function processRefund(RefundData $data): ?Refund
    {
        DB::beginTransaction();

        try {
            $payment = Payment::findOrFail($data->paymentId);
            $refund = Refund::create(['payment_id' => $payment->id, 'amount' => $data->amount]);

            if ($data->amount > $payment->remainingBalance) {
                DB::rollBack();
                return null; // Conditional rollback
            }

            $payment->decrement('remaining_balance', $data->amount);
            DB::commit();
            return $refund;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
```

---

## Exceptions

Simple linear workflows with no conditional commit logic must use the closure-based `transaction()` pattern for its conciseness and automatic exception handling.

---

## Consequences Of Violation

Maintenance risks: conditional commit logic is shoehorned into exception-based flow control. Readability risks: intent of conditional rollback is obscured. Reliability risks: try/catch abuse may mask genuine errors.

---

## Rule 6: Retry Callbacks Must Be Idempotent

The callback passed to `DB::transaction()` with retry must be idempotent — executing it multiple times must produce the same final state without duplicate side effects.

---

## Category

Reliability

---

## Rule

When using `DB::transaction(callback, $attempts)` with retry count greater than 1, the callback must be idempotent. It must use `updateOrCreate`, `firstOrCreate`, or conditional checks to prevent duplicate records or duplicate operations when retried after a deadlock.

---

## Reason

When a deadlock occurs and the transaction retries, the callback executes again from the beginning. If the callback contains non-idempotent operations (e.g., `Product::create()` without checking for existing records), the retry may create duplicate records or perform duplicate actions.

---

## Bad Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            // Non-idempotent — retry creates duplicate
            $payment = Payment::create([
                'order_id' => $data->orderId,
                'amount' => $data->amount,
            ]);
            // ...
        }, 3);
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            // Idempotent — uses unique constraint + updateOrCreate
            $payment = Payment::updateOrCreate(
                ['transaction_id' => $data->transactionId],
                ['amount' => $data->amount, 'status' => 'completed'],
            );
            // ...
        }, 3);
    }
}
```

---

## Exceptions

Operations where duplicate execution is harmless (e.g., idempotent operations like deleting a record) may not require idempotency measures.

---

## Consequences Of Violation

Data integrity risks: duplicate records created on retry after deadlock. Financial risks: duplicate charges on payment gateways. Debugging risks: transient duplications are hard to reproduce and diagnose.

---

## Rule 7: Do Not Create Transaction-Only Services

A service that exists solely to wrap operations in a `DB::transaction()` without adding other orchestration value must be eliminated.

---

## Category

Architecture

---

## Rule

A service class whose only purpose is wrapping a `DB::transaction()` around operations — with no error handling, no result aggregation, no conditional logic, and no business rules — must not exist. The transaction boundary should move to the caller or the service should be eliminated.

---

## Reason

Transaction-only services add indirection without value. They create an unnecessary class that provides no abstraction benefit. If orchestration doesn't need coordination beyond atomicity, the transaction can be managed in the caller or the operations may not need a service at all.

---

## Bad Example

```php
// This service adds no value — just wraps in a transaction
class CreateOrderService
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentRepository $payments,
    ) {}

    public function execute(CreateOrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->orders->create($data);
            $this->payments->create(['order_id' => $order->id, 'amount' => $data->amount]);
            return $order;
        });
    }
}
```

---

## Good Example

```php
// If no orchestration needed beyond atomicity, use simpler approach
// Option A: Move transaction to caller
$order = DB::transaction(function () use ($data) {
    return Order::create([...]);
});

// Option B: Add real orchestration value
class CheckoutService
{
    public function execute(CheckoutData $data): CheckoutResult
    {
        return DB::transaction(function () use ($data) {
            $inventory = $this->reserveInventory->handle($data->items);
            $payment = $this->processPayment->handle($data->payment);
            $order = $this->orders->create($data, $payment);
            return new CheckoutResult($order, $payment, $inventory);
        });
    }
}
```

---

## Exceptions

If the team has a convention that ALL database writes go through a service layer for consistency, a thin service may be acceptable. Document this as a team convention.

---

## Consequences Of Violation

Efficiency risks: unnecessary indirection layers with no value. Maintainability risks: more files to navigate and maintain. Design risks: dilutes the meaning of the service pattern.

---

## Rule 8: Handle Transaction Rollback Correctly in Orchestration

When a transaction rolls back, the orchestration method must either re-throw the exception or return a failure result. Silent failure swallowing is prohibited.

---

## Category

Reliability

---

## Rule

After a transaction rollback in an orchestration method, the method must not silently return a success or incomplete result. It must either re-throw the original exception (or a wrapped domain exception) or return a failure result object that the caller can inspect.

---

## Reason

Silence after rollback creates hidden failures. The caller believes the operation succeeded, but the writes were rolled back. This leads to inconsistent state, duplicate retries, and data corruption.

---

## Bad Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): ?OrderResult
    {
        try {
            return DB::transaction(function () use ($data) {
                // ...
            });
        } catch (\Throwable $e) {
            // Silent catch — caller thinks it succeeded
            Log::error('Order failed', ['error' => $e->getMessage()]);
            return null; // Caller receives null but doesn't know why
        }
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        try {
            return DB::transaction(function () use ($data) {
                // ...
            });
        } catch (\Throwable $e) {
            Log::error('Order placement failed', [
                'data' => $data,
                'error' => $e->getMessage(),
            ]);
            throw new OrderPlacementFailedException(
                message: 'Failed to place order',
                previous: $e,
            );
        }
    }
}
```

---

## Exceptions

If the orchestration method is designed to return a result object that wraps success/failure (functional style), returning a failure result is acceptable. The result object must clearly indicate failure.

---

## Consequences Of Violation

Data integrity risks: caller believes operation succeeded but writes were rolled back. Debugging risks: silent failures are hard to detect. User experience risks: users see success but data is missing.
