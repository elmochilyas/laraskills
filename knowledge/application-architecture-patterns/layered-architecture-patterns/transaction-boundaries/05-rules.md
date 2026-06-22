# Rules for Transaction boundaries in layered architecture

## Place Transactions in Use Case Layer
---
## Category
Architecture | Reliability
---
## Rule
ALWAYS wrap database transactions in the Use Case (Application) layer; NEVER handle transactions in Controllers or Repositories.
---
## Reason
The use case orchestrating the business operation understands the full scope of work that must be atomic. Controllers should not manage DB concerns — they are HTTP adapters. Repositories should remain composable — wrapping each repository method in its own transaction prevents the use case from combining multiple operations atomically.
---
## Bad Example
```php
// Transaction in Controller
class InvoiceController {
    public function create(CreateInvoiceRequest $request) {
        DB::transaction(function () {
            // Controller now manages DB transaction
        });
    }
}
```
---
## Good Example
```php
// Transaction in Use Case
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceDto {
        return DB::transaction(function () use ($dto) {
            $invoice = Invoice::create(/* ... */);
            $this->invoices->save($invoice);
            $this->events->dispatch(new InvoiceCreated($invoice->id()));
            return new InvoiceDto($invoice);
        });
    }
}
```
---
## Exceptions
Standalone repository operations (single aggregate root with no cross-aggregate consistency needs) may manage their own transaction — but this should be the exception, not the default.
---
## Consequences Of Violation
Transactions in controllers leak persistence concerns into Presentation; per-method transactions in repositories prevent composition across multiple repositories; partial updates when multiple operations should be atomic.

## Move External API Calls Outside Transaction
---
## Category
Performance | Reliability
---
## Rule
Place external API calls (payment gateways, email services, HTTP requests) AFTER transaction commit; do not wrap them inside `DB::transaction()`.
---
## Reason
External API calls cannot be rolled back by the database transaction. If the API succeeds but the transaction fails, the database rolls back but the external side effect remains. Additionally, API calls inside transactions hold database connections and locks open, increasing contention.
---
## Bad Example
```php
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceDto {
        return DB::transaction(function () use ($dto) {
            $invoice = Invoice::create(/* ... */);
            $this->invoices->save($invoice);
            $this->paymentGateway->charge($dto->amount); // API call INSIDE transaction
            return new InvoiceDto($invoice);
        });
    }
}
```
---
## Good Example
```php
class CreateInvoiceUseCase {
    public function execute(CreateInvoiceDto $dto): InvoiceDto {
        $result = DB::transaction(function () use ($dto) {
            $invoice = Invoice::create(/* ... */);
            $this->invoices->save($invoice);
            return new InvoiceDto($invoice);
        });
        $this->paymentGateway->charge($dto->amount); // API call AFTER commit
        return $result;
    }
}
```
---
## Exceptions
When the external API is idempotent and failure recovery is handled by a compensating action (e.g., refund on rollback), the API may be inside the transaction — but this requires careful design.
---
## Consequences Of Violation
Partial side effects (payment taken but order not created); long-lived transactions with locks held during network I/O; hard-to-diagnose failures.

## Avoid Nested Transactions
---
## Category
Reliability | Maintainability
---
## Rule
Do not nest `DB::transaction()` calls; structure your code so each business operation has a single transaction boundary.
---
## Reason
Laravel's nested transactions use database savepoints. An inner transaction rollback (`DB::rollBack()`) rolls back to the savepoint but does NOT roll back the outer transaction. This creates confusing behavior where partial rollbacks appear successful.
---
## Bad Example
```php
class OrderService {
    public function createOrder(CreateOrderDto $dto): void {
        DB::transaction(function () use ($dto) {
            $order = Order::create(/* ... */);
            $this->processPayment($dto); // Another DB::transaction() inside
        });
    }
    private function processPayment(CreateOrderDto $dto): void {
        DB::transaction(function () use ($dto) { // Nested!
            // Inner rollback won't roll back outer transaction
        });
    }
}
```
---
## Good Example
```php
class OrderService {
    public function createOrder(CreateOrderDto $dto): void {
        DB::transaction(function () use ($dto) {
            $order = Order::create(/* ... */);
            $this->processPayment($order, $dto); // No nested transaction
        });
    }
    private function processPayment(Order $order, CreateOrderDto $dto): void {
        // Participates in the caller's transaction — no DB::transaction() here
    }
}
```
---
## Exceptions
When using a third-party package that internally wraps operations in transactions, test the behavior carefully with savepoints — but prefer to avoid the pattern.
---
## Consequences Of Violation
Confusing rollback behavior; inner failures that appear to succeed; partial state updates; difficult debugging.

## Consistent Table Access Ordering
---
## Category
Performance | Reliability
---
## Rule
Access database tables in the same order within all transactions to prevent deadlocks.
---
## Reason
When two transactions access the same tables in different orders, they can each hold locks the other needs, creating a deadlock. Consistent ordering eliminates this class of deadlock entirely.
---
## Bad Example
```php
// Transaction A: invoices → users
DB::transaction(function () {
    DB::table('invoices')->update(/* ... */);
    DB::table('users')->update(/* ... */);
});
// Transaction B: users → invoices — DEADLOCK RISK
DB::transaction(function () {
    DB::table('users')->update(/* ... */);
    DB::table('invoices')->update(/* ... */);
});
```
---
## Good Example
```php
// Convention: always access in alphabetical order
// Transaction A: invoices → users (OK)
DB::transaction(function () {
    DB::table('invoices')->update(/* ... */);
    DB::table('users')->update(/* ... */);
});
// Transaction B: invoices → users (OK — follows convention)
DB::transaction(function () {
    DB::table('invoices')->update(/* ... */);
    DB::table('users')->update(/* ... */);
});
```
---
## Exceptions
Single-table transactions or transactions accessing only one table cannot deadlock with each other.
---
## Consequences Of Violation
Deadlock errors in production; transactions retried or failed; user-facing errors under concurrent load.

## Monitor Transaction Duration
---
## Category
Performance | Reliability
---
## Rule
Monitor and alert on transaction duration in production; long transactions indicate problems with lock contention or misplaced external calls.
---
## Reason
Long transactions hold database connections and locks, reducing throughput and increasing contention. Monitoring transaction duration detects N+1 queries inside transactions, API calls inside transactions, or missing indexes before they cause outages.
---
## Bad Example
No transaction duration monitoring. A developer places a 3-second external API call inside a transaction. Under load, connections pile up waiting for locks, eventually exhausting the connection pool.
---
## Good Example
```php
// Middleware or listener that logs transaction duration
DB::listen(function ($query) { /* ... */ });
// Custom transaction wrapper with timing
class TransactionManager {
    public function run(callable $callback): mixed {
        $start = microtime(true);
        try {
            return DB::transaction($callback);
        } finally {
            $duration = (microtime(true) - $start) * 1000;
            if ($duration > 500) {
                Log::warning('Long transaction detected', ['duration_ms' => $duration]);
            }
        }
    }
}
```
---
## Exceptions
Batch operations that legitimately take minutes may have longer transaction durations — configure appropriate thresholds for batch vs. interactive transactions.
---
## Consequences Of Violation
Connection pool exhaustion under load; hard-to-diagnose performance issues; production outages from lock contention.

## Authorize Before Transaction, Not Within
---
## Category
Security | Reliability
---
## Rule
Perform authorization checks BEFORE starting the database transaction; do not include authorization logic inside the transaction boundary.
---
## Reason
Authorization should be cheap (no I/O except maybe a cache lookup) and should fail fast. Performing auth inside the transaction means the transaction holds locks during authorization, and an authorization failure wastes a transaction that must be rolled back.
---
## Bad Example
```php
class CancelInvoiceUseCase {
    public function execute(CancelInvoiceDto $dto): void {
        DB::transaction(function () use ($dto) {
            $invoice = $this->invoices->find($dto->invoiceId);
            if (!$dto->user->can('cancel', $invoice)) { // Auth INSIDE transaction
                throw new AuthorizationException();
            }
            $invoice->cancel();
            $this->invoices->save($invoice);
        });
    }
}
```
---
## Good Example
```php
class CancelInvoiceUseCase {
    public function execute(CancelInvoiceDto $dto): void {
        $invoice = $this->invoices->find($dto->invoiceId);
        if (!$dto->user->can('cancel', $invoice)) { // Auth BEFORE transaction
            throw new AuthorizationException();
        }
        DB::transaction(function () use ($invoice) {
            $invoice->cancel();
            $this->invoices->save($invoice);
        });
    }
}
```
---
## Exceptions
Authorization rules that depend on transaction-scoped state (e.g., after creating an entity) must be inside the transaction — but prefer to structure logic to avoid this.
---
## Consequences Of Violation
Locks held during authorization; wasted transactions on auth failures; slower failure paths under load.

## Dispatch Events and Jobs After Transaction Commit
---
## Category
Reliability | Architecture
---
## Rule
Dispatch events, queue jobs, and trigger side effects AFTER the database transaction commits. Use `dispatchAfterCommit()`, `event(...)->afterCommit()`, or `DB::afterCommit()`. Do not dispatch inside the transaction body.
---
## Reason
Side effects that depend on committed database state must not execute until the transaction succeeds. If dispatched inside and the transaction rolls back, the side effect has already occurred with no undo mechanism. Queued jobs dispatched inside a transaction may execute before the transaction is visible to the worker's database connection (race condition).
---
## Bad Example
```php
DB::transaction(function () use ($dto) {
    $sub = Subscription::create([...]);
    SendWelcomeEmail::dispatch($sub); // Dispatched INSIDE transaction
    event(new SubscriptionCreated($sub)); // Event INSIDE transaction
});
```
---
## Good Example
```php
$sub = DB::transaction(function () use ($dto) {
    return Subscription::create([...]);
});
SendWelcomeEmail::dispatch($sub)->afterCommit();
event(new SubscriptionCreated($sub))->afterCommit();
```
---
## Exceptions
Side effects that MUST be atomic with the transaction AND are idempotent (e.g., write to an append-only audit log) may be inside the transaction with explicit documentation of the tradeoff.
---
## Consequences Of Violation
Jobs executing before transaction visibility (race condition); emails sent for data that was never committed; events fired for rolled-back state; hard-to-diagnose production inconsistencies.
