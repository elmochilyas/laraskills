# Phase 5: Transactional Actions Rules

---

## Rule: Actions Must Not Manage Their Own Database Transactions

---

## Category

Architecture

---

## Rule

Action classes must not call `DB::transaction()`, `DB::beginTransaction()`, `DB::commit()`, or `DB::rollBack()` inside their `execute()` method. Transaction ownership belongs exclusively to the orchestrating service or entry point.

---

## Reason

An action that manages its own transaction cannot be safely composed into a larger workflow. If the action is called inside an outer transaction, its `DB::transaction()` call creates a savepoint — not a true nested transaction — with confusing semantics and the risk of partial commits. The same action should be callable standalone, inside a transaction, or with no transaction at all, without changing its code.

---

## Bad Example

```php
final readonly class ReserveInventoryAction
{
    public function execute(array $items): void
    {
        DB::transaction(function () use ($items) {
            foreach ($items as $item) {
                InventoryItem::where('id', $item)->decrement('stock', 1);
            }
            // Creates savepoint if inside an outer transaction
        });
    }
}
```

---

## Good Example

```php
final readonly class ReserveInventoryAction
{
    public function execute(array $items): void
    {
        // No transaction — the orchestrator manages the boundary
        foreach ($items as $item) {
            InventoryItem::where('id', $item)->decrement('stock', 1);
        }
    }
}

// Orchestrator owns the transaction:
class PlaceOrderService
{
    public function placeOrder(OrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->execute($data->items);
            return $this->createOrder->execute($data);
        });
    }
}
```

---

## Exceptions

Standalone actions that are guaranteed to always be the top-level caller (scheduled commands, maintenance operations, console commands) and are never composed into a larger workflow may manage their own transaction. The action class must document this assumption.

---

## Consequences Of Violation

Reliability risks: savepoint confusion leads to partial commits — some changes persist while others roll back within the same transaction. Maintenance risks: the action cannot be reused in different composition contexts. Testing risks: savepoint behavior differs between SQLite (no-op) and MySQL/PostgreSQL (real savepoint), masking bugs in test environments.

---

---

## Rule: Always Use `DB::afterCommit()` for Side-Effecting Operations

---

## Category

Reliability

---

## Rule

Every action that triggers side effects — sending emails, dispatching events, calling webhooks, clearing cache, writing files — must use `DB::afterCommit()` to schedule the side effect. Side effects must never execute directly inside an action's `execute()` method.

---

## Reason

Without `afterCommit`, a side effect that executes during a transaction will persist even if the transaction later rolls back. This creates phantom side effects — an email is sent for an order that was never created, a cache is cleared for a user that was never registered. `afterCommit` ensures side effects only execute after the outermost transaction commits, maintaining consistency between the database state and external systems.

---

## Bad Example

```php
final readonly class SendWelcomeAction
{
    public function execute(User $user): void
    {
        Mail::to($user)->send(new WelcomeMail);
        // If the orchestrator's transaction rolls back, the email was already sent
    }
}
```

---

## Good Example

```php
final readonly class SendWelcomeAction
{
    public function execute(User $user): void
    {
        DB::afterCommit(fn () => Mail::to($user)->send(new WelcomeMail));
        // Only fires after the outermost transaction commits
        // Fires immediately if no transaction is active
    }
}
```

---

## Exceptions

Side effects that must execute regardless of transaction success (audit logging, monitoring metrics) should not use `afterCommit` — they should execute immediately even on rollback. Document these exceptions explicitly.

---

## Consequences Of Violation

Reliability risks: phantom side effects — external systems are notified of operations that did not complete. Data consistency risks: database state and external system state diverge. Debugging difficulty: phantom side effects are hard to trace because no error is raised — the email was sent, the transaction rolled back, and no record links the two.

---

---

## Rule: Document the Transaction Boundary at the Orchestrator Level

---

## Category

Maintainability

---

## Rule

Every method that owns a transaction boundary must have an explicit comment or docblock stating that the transaction is managed at this level and that sub-actions should not create their own transactions.

---

## Reason

Transaction ownership is a critical architectural invariant that is invisible in the code — there is no syntax for "this method owns the transaction boundary." Without explicit documentation, developers adding new sub-actions may accidentally create their own transactions, introducing savepoint confusion. Documentation serves as a warning and a reference for code reviewers.

---

## Bad Example

```php
class CheckoutService
{
    public function checkout(Cart $cart): Order
    {
        return DB::transaction(function () use ($cart) {
            // No documentation — developer adds a sub-action that
            // creates its own transaction, introducing savepoints
            $this->reserveInventory->execute($cart->items);
            $this->chargePayment->execute($cart->payment);
            $this->createOrder->execute($cart);
        });
    }
}
```

---

## Good Example

```php
class CheckoutService
{
    /**
     * Transaction boundary is managed here.
     * All sub-actions called within this transaction must NOT
     * create their own transactions. Side effects must use afterCommit.
     */
    public function checkout(Cart $cart): Order
    {
        return DB::transaction(function () use ($cart) {
            $this->reserveInventory->execute($cart->items);
            $this->chargePayment->execute($cart->payment);
            $order = $this->createOrder->execute($cart);
            DB::afterCommit(fn () => $this->sendConfirmation->execute($order));
            return $order;
        });
    }
}
```

---

## Exceptions

Trivially simple transactions (single operation, no sub-actions) do not require explicit documentation.

---

## Consequences Of Violation

Maintenance risks: new team members accidentally create transaction-in-transaction scenarios. Code Review risks: reviewers cannot verify transaction boundary enforcement without reading every sub-action. Reliability risks: savepoint bugs are introduced during maintenance.

---

---

## Rule: Test `afterCommit` Actions Within an Active Transaction

---

## Category

Testing

---

## Rule

Tests for actions that use `DB::afterCommit()` must wrap the test in a database transaction (using `DatabaseTransactions` trait) to ensure the `afterCommit` callback behavior matches production. Tests without an active transaction must document why the immediate-fire behavior is acceptable.

---

## Reason

When no transaction is active, `DB::afterCommit()` fires the callback immediately — it does not wait. This means a test without an active transaction tests a different code path than production (where a transaction is typically active). Wrapping the test in a transaction ensures that `afterCommit` callbacks are deferred and tested in the expected sequence.

---

## Bad Example

```php
// Test without transaction — afterCommit fires immediately:
public function test_it_sends_welcome_email(): void
{
    $action = new SendWelcomeAction(Mockery::mock(Mailer::class));
    $user = new User(['email' => 'test@test.com']);

    // afterCommit fires immediately — no transaction active
    $action->execute($user);

    // This test passes, but production behavior may differ
}
```

---

## Good Example

```php
// Test WITH active transaction — afterCommit is deferred:
use DatabaseTransactions;

public function test_it_sends_welcome_email_after_commit(): void
{
    Mail::fake();

    $action = new SendWelcomeAction();
    $user = User::factory()->create();

    $action->execute($user);

    // Email was NOT sent yet — afterCommit is deferred
    Mail::assertNothingSent();

    // Transaction commits at test teardown — email is sent
    // To test within the transaction, manually commit:
    DB::commit();
    Mail::assertSent(WelcomeMail::class);
}
```

---

## Exceptions

Tests that verify the `afterCommit` registration itself (not the callback execution) may run without a transaction. These tests should assert that `afterCommit` was called, not that the callback executed.

---

## Consequences Of Violation

Testing risks: tests pass but do not reflect production behavior — `afterCommit` callbacks fire immediately in tests but are deferred in production. Maintenance risks: callback ordering issues are not caught until production.

---

---

## Rule: Delegate Heavy `afterCommit` Callbacks to the Queue

---

## Category

Performance

---

## Rule

`afterCommit` callbacks that perform heavyweight operations (API calls, large file generation, batch email sending, report compilation) must dispatch a queued job rather than executing synchronously. Only lightweight callbacks (single email, cache clear, event dispatch) may execute directly inside `afterCommit`.

---

## Reason

Heavy `afterCommit` callbacks execute sequentially after the transaction commits, blocking the HTTP response until all callbacks complete. A single `afterCommit` callback that takes 5 seconds delays the response by 5 seconds. Multiple heavy callbacks compound the delay. Dispatched jobs return immediately and execute on the worker, keeping the HTTP response fast.

---

## Bad Example

```php
final readonly class GenerateReportAction
{
    public function execute(ReportRequest $request): void
    {
        DB::afterCommit(function () use ($request) {
            // Heavy operation — 30 second export blocks the response
            $this->reportGenerator->generateAndEmail($request);
        });
    }
}
```

---

## Good Example

```php
final readonly class GenerateReportAction
{
    public function execute(ReportRequest $request): void
    {
        DB::afterCommit(fn () =>
            // Delegate heavy work to the queue
            GenerateReportJob::dispatch($request->toArray())
        );
    }
}

// On the worker:
class GenerateReportJob implements ShouldQueue
{
    public function handle(ReportGenerator $generator): void
    {
        $generator->generateAndEmail($this->requestData);
    }
}
```

---

## Exceptions

Lightweight `afterCommit` callbacks (logging, counter increment, cache tag clearing) that execute in under 5ms are safe to run inline. The definition of "heavy" depends on the application's response-time budget.

---

## Consequences Of Violation

Performance risks: slow HTTP responses while heavy callbacks execute synchronously. Scalability risks: web server processes are occupied by callback execution instead of handling new requests. Reliability risks: a callback failure delays the response AND fails the operation — the client receives a 500 error for a successful database operation.

---

---

## Rule: Prevent Phantom Side Effects on Transaction Rollback

---

## Category

Reliability

---

## Rule

Any side effect that would be incorrect if the enclosing transaction fails must be wrapped in `DB::afterCommit()`. Side effects that execute outside of `afterCommit` inside a transaction are dangerous and must be treated as bugs.

---

## Reason

Phantom side effects occur when an external operation (email, API call, cache write) executes successfully during a transaction, but the transaction later rolls back. The external system has been updated as if the operation succeeded, but the database state reflects the rollback. There is no automatic compensation — the phantom state persists indefinitely unless detected and manually corrected.

---

## Bad Example

```php
class RegisterUserService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create($data);

            // Phantom side effect — email sent even if transaction rolls back:
            Mail::to($user)->send(new WelcomeMail);

            $this->someOtherOperation(); // May throw, rolling back the transaction
            return $user;
        });
    }
}
// If someOtherOperation() throws, the user is not created
// but the welcome email was already sent
```

---

## Good Example

```php
class RegisterUserService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create($data);

            DB::afterCommit(fn () => Mail::to($user)->send(new WelcomeMail));
            // Email is deferred — only sent if transaction commits

            $this->someOtherOperation(); // May throw — rollback discards the afterCommit
            return $user;
        });
    }
}
// If someOtherOperation() throws, the user is rolled back
// and the afterCommit callback is discarded — no phantom email
```

---

## Exceptions

Side effects that should execute even on rollback (audit logging with pre-commit data, transaction failure monitoring) must execute outside of `afterCommit`. These are rare and must be documented.

---

## Consequences Of Violation

Data consistency risks: external systems (email, API, cache) diverge from database state. Customer experience risks: users receive confirmation emails for operations that failed. Operational risks: phantom side effects are silent — no error is raised, and the inconsistency may not be detected for days.

---

---

## Rule: Sub-Actions Must Not Create Savepoints Inside Parent Transactions

---

## Category

Reliability

---

## Rule

When an action is composed into a larger workflow in any way — called from a service, called from another action, called from a queued job orchestrator — it must not call `DB::transaction()`. The sub-action must be transaction-agnostic.

---

## Reason

A `DB::transaction()` call inside an active transaction creates a savepoint, not a nested transaction. Savepoints do not provide transaction isolation — the outer transaction can see uncommitted changes from the savepoint. If the sub-action fails, the savepoint is released, but the outer transaction continues. This creates a partial-commit state where the sub-action's changes are rolled back but the parent's other changes commit.

---

## Bad Example

```php
class ProcessRefundAction
{
    public function execute(RefundData $data): void
    {
        DB::transaction(function () use ($data) {
            // Savepoint — not an independent transaction
            $this->paymentGateway->refund($data->transactionId);
            $this->updateLedger($data);
        });
    }
}

// Orchestrator:
DB::transaction(function () {
    $order = $this->orderService->cancelOrder($orderId);
    $this->processRefundAction->execute($refundData);
    // If refund fails and the exception is caught, the savepoint rollback
    // is released but the outer transaction continues — partial state
});
```

---

## Good Example

```php
class ProcessRefundAction
{
    public function execute(RefundData $data): void
    {
        // Transaction-agnostic — pure data operations:
        $this->paymentGateway->refund($data->transactionId);
        $this->updateLedger($data);
    }
}

// Orchestrator owns the full transaction:
DB::transaction(function () use ($orderId, $refundData) {
    $order = $this->orderService->cancelOrder($orderId);
    $this->processRefundAction->execute($refundData);
    // If anything fails, the entire transaction rolls back
});
```

---

## Exceptions

Standalone sub-actions that are guaranteed to be called outside any parent transaction (and have no orchestrator) may manage their own transaction. This must be documented on the action class.

---

## Consequences Of Violation

Reliability risks: partial commits — some changes from the outer transaction commit while the sub-action's changes roll back. Debugging difficulty: the partial-commit state is hard to detect because the outer transaction continues normally. SQLite testing gap: tests on SQLite do not create savepoints, so this bug is invisible in test environments.

---
