## Place Transactions In The Service Layer Only
---
## Architecture
---
## Rule
Place transaction boundaries exclusively in the Service layer. Controllers, Actions, and Repositories must not call `DB::transaction()`.
---
## Reason
The Service method defines the unit of work. All operations within the transaction either succeed or fail together. Transactions at other layers fragment the atomic boundary.
---
## Bad Example
```php
class CreateOrderAction
{
    public function execute(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            return Order::create($data);
        });
    }
}

class OrderRepository
{
    public function save(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            return $order->save();
        }); // Transaction in repository
    }
}
```
---
## Good Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            $this->reserveInventoryAction->execute($order);
            $this->processPaymentAction->execute($order);
            return $order;
        });
    }
}

// Actions and repositories do not manage transactions
class CreateOrderAction
{
    public function execute(array $data): Order
    {
        return Order::create($data);
    }
}
```
---
## Exceptions
No common exceptions. Transaction ownership belongs to the Service layer.
---
## Consequences Of Violation
Nested transactions (inner becomes savepoint), fragmented atomic boundaries, inconsistent data on partial failure.

## Never Nest Transactions
---
## Reliability
---
## Rule
Never nest `DB::transaction()` calls. If a service method that opens a transaction calls another method that opens a transaction, the inner call becomes a savepoint, not a true transaction.
---
## Reason
Only the outermost `DB::transaction()` is a real database transaction. Inner calls are savepoints. If the outer transaction rolls back, the inner transaction also rolls back — but developers may erroneously believe the inner one is independent.
---
## Bad Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            return $order;
        });
    }
}

class CreateOrderAction
{
    public function execute(array $data): Order
    {
        return DB::transaction(function () use ($data) { // Nested — becomes savepoint
            return Order::create($data);
        });
    }
}
```
---
## Good Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            return $order;
        });
    }
}

class CreateOrderAction
{
    public function execute(array $data): Order // No transaction
    {
        return Order::create($data);
    }
}
```
---
## Exceptions
No common exceptions. Nested transactions are never the correct approach.
---
## Consequences Of Violation
Misleading transaction boundaries, false sense of atomicity, hard-to-debug data integrity issues.

## Use AfterCommit For Side Effects
---
## Reliability
---
## Rule
Use `DB::afterCommit()` to schedule external API calls, email sending, event dispatching, and other side effects that should only execute if the transaction succeeds.
---
## Reason
Side effects inside a transaction will execute even if the transaction rolls back. `afterCommit` schedules callbacks to run only after the transaction commits successfully.
---
## Bad Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            $this->emailService->sendOrderConfirmation($order); // Sends email even if transaction rolls back
            $this->paymentGateway->charge($order); // Charges card even if transaction rolls back
            return $order;
        });
    }
}
```
---
## Good Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);

            DB::afterCommit(function () use ($order) {
                $this->emailService->sendOrderConfirmation($order);
                $this->paymentGateway->charge($order);
            });

            return $order;
        });
    }
}
```
---
## Exceptions
Operations that must be part of the transaction (e.g., deducting from an account balance). Audit logging that should capture rollbacks too.
---
## Consequences Of Violation
Emails sent for failed orders, payment charges on rolled-back transactions, inconsistent external state.

## Keep Transactions Short
---
## Performance
---
## Rule
Keep database transactions as short as possible. Do not perform slow operations (HTTP API calls, file processing, email sending, image manipulation) inside a transaction.
---
## Reason
Transactions hold database locks. Long-running transactions cause lock contention, deadlocks, and reduced application throughput.
---
## Bad Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            $this->processImage($data['image_path']); // Slow image processing — holds locks
            $response = Http::post('https://external-api.com/verify', $data); // HTTP call — holds locks
            sleep(2); // Explicit delay — holds locks
            return $order;
        });
    }
}
```
---
## Good Example
```php
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);

            DB::afterCommit(function () use ($data) {
                $this->processImage($data['image_path']); // After transaction
                Http::post('https://external-api.com/verify', $data); // After transaction
            });

            return $order;
        });
    }
}
```
---
## Exceptions
Operations that MUST be atomic with the transaction (e.g., deducting inventory where over-selling must be prevented).
---
## Consequences Of Violation
Database lock contention, deadlocks in production, poor application throughput, cascading failures under load.

## Actions Must Not Call DB::transaction
---
## Architecture
---
## Rule
Actions must never call `DB::transaction()`. Actions are leaf-node operations that participate in a transaction managed by the calling service.
---
## Reason
If actions manage their own transactions, they cannot be composed within a service-level transaction. The inner transaction becomes a savepoint, defeating the purpose.
---
## Bad Example
```php
class CreateOrderAction
{
    public function execute(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            return Order::create($data);
        });
    }
}

class ReserveInventoryAction
{
    public function execute(Order $order): void
    {
        return DB::transaction(function () use ($order) {
            // Inventory operations
        });
    }
}
```
---
## Good Example
```php
class CreateOrderAction
{
    public function execute(array $data): Order // No transaction
    {
        return Order::create($data);
    }
}

class ReserveInventoryAction
{
    public function execute(Order $order): void // No transaction
    {
        // Inventory operations
    }
}
```
---
## Exceptions
No common exceptions. Actions must not manage transactions.
---
## Consequences Of Violation
Composed actions create nested transactions, transaction fragmentation, inability to roll back a composed workflow atomically.

## Repositories Must Not Call DB::transaction
---
## Architecture
---
## Rule
Repositories must never call `DB::transaction()`. Repositories are data access abstractions that do not own the consistency boundary.
---
## Reason
Repository-level transactions create savepoints when called from a service-level transaction and prevent the service from managing the atomic boundary of the complete business operation.
---
## Bad Example
```php
class OrderRepository
{
    public function create(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            return Order::create($data);
        });
    }

    public function updateStatus(int $id, string $status): void
    {
        return DB::transaction(function () use ($id, $status) {
            Order::whereId($id)->update(['status' => $status]);
        });
    }
}
```
---
## Good Example
```php
class OrderRepository
{
    public function create(array $data): Order
    {
        return Order::create($data); // No transaction
    }

    public function updateStatus(int $id, string $status): void
    {
        Order::whereId($id)->update(['status' => $status]); // No transaction
    }
}
```
---
## Exceptions
Standalone repository methods that are never called within a service-level transaction (very rare).
---
## Consequences Of Violation
Nested transactions, fragmented atomic boundaries, inability to compose repository operations atomically.
