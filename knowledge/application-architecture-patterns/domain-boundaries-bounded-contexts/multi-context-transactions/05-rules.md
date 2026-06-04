# Rule: Use ACID within a context, Sagas across contexts
---
## Category
Architecture
---
## Rule
Use standard database ACID transactions for operations within a single bounded context. Use the Saga pattern for operations that span multiple contexts.
---
## Reason
ACID transactions require a shared database — they cannot span independent context boundaries. Sagas implement eventual consistency across contexts without distributed locks or two-phase commit.
---
## Bad Example
```php
// Attempting ACID across contexts
DB::transaction(function () {
    DB::table('identity_users')->insert([/* ... */]);
    DB::table('billing_invoices')->insert([/* ... */]);
    // Still tightly coupled — cannot split databases later
});
```
---
## Good Example
```php
// ACID within context
class IdentityService
{
    public function registerUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create($data);
            event(new UserCreated($user->id, $user->email));
            return $user;
        });
    }
}

// Saga across contexts via events
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Distributed transactions (XA/two-phase commit) are fragile and expensive; context boundaries cannot be enforced.

# Rule: Always include compensating transactions for every saga step
---
## Category
Architecture
---
## Rule
Every step in a saga must have a compensating transaction that can undo the step's effects.
---
## Reason
Without compensation, a failed step leaves the system in an inconsistent state. Previously completed steps have no way to roll back their effects.
---
## Bad Example
```php
// Saga without compensation
class OrderSaga
{
    public function placeOrder(OrderData $data): void
    {
        $this->inventory->reserve($data->productId, $data->quantity);
        $this->payment->charge($data->total); // FAILS
        // Inventory is still reserved — can't be undone!
    }
}
```
---
## Good Example
```php
// Saga with compensating transactions
class OrderSaga
{
    public function placeOrder(OrderData $data): void
    {
        $completedSteps = [];

        try {
            $this->inventory->reserve($data->productId, $data->quantity);
            $completedSteps[] = 'inventory_reserved';

            $this->payment->charge($data->total);
            $completedSteps[] = 'payment_charged';

            $this->ordering->create($data);
            $completedSteps[] = 'order_created';
        } catch (\Throwable $e) {
            foreach (array_reverse($completedSteps) as $step) {
                match ($step) {
                    'order_created' => $this->ordering->cancel($data->orderId),
                    'payment_charged' => $this->payment->refund($data->total),
                    'inventory_reserved' => $this->inventory->release(
                        $data->productId, $data->quantity
                    ),
                };
            }
            throw $e;
        }
    }
}
```
---
## Exceptions
Read-only operations that have no side effects to undo.
---
## Consequences Of Violation
Partially completed operations; system in inconsistent state; manual reconciliation required.

# Rule: Use choreographed sagas for simple workflows
---
## Category
Architecture
---
## Rule
Use choreographed (event-driven) sagas for simple cross-context workflows with few steps and rare flow changes.
---
## Reason
Choreographed sagas are decentralized — each step publishes an event that triggers the next. They're simpler to implement for straightforward flows and work well when each step is owned by a different team.
---
## Bad Example
```php
// Using orchestrated saga for a simple 2-step flow
class OrderCoordinator // heavyweight for a simple flow
{
    public function handle(PlaceOrder $command): void { /* ... */ }
}
```
---
## Good Example
```php
// Choreographed saga — events drive the flow
class ReserveInventoryHandler
{
    public function handle(OrderPlaced $event): void
    {
        $this->inventory->reserve($event->productId, $event->quantity);
        ReserveSucceeded::dispatch($event->orderId);
    }
}

class ProcessPaymentHandler
{
    public function handle(ReserveSucceeded $event): void
    {
        $this->payment->charge($event->orderId);
        PaymentSucceeded::dispatch($event->orderId);
    }
}
```
---
## Exceptions
Complex workflows with many failure paths, branches, or parallel steps (use orchestrated instead).
---
## Consequences Of Violation
Unnecessary centralized coordinator for simple flows; increased complexity; reduced team autonomy.

# Rule: Use orchestrated sagas for complex workflows
---
## Category
Architecture
---
## Rule
Use orchestrated (coordinator-based) sagas for complex workflows with multiple failure paths, branches, parallel steps, or compensation logic.
---
## Reason
Central visibility into workflow state, explicit error handling, and easier testing. The saga manager orchestrates each step and handles failures declaratively.
---
## Bad Example
```php
// Choreographed saga for complex branching workflow
// Hard to trace, test, and debug
```
---
## Good Example
```php
// Orchestrated saga with explicit state machine
class OrderSagaCoordinator
{
    public function execute(int $orderId): void
    {
        $state = $this->states->create('order_fulfillment', $orderId);

        try {
            $this->inventory->reserve($state->data->productId, $state->data->quantity);
            $state->advance('inventory_reserved');

            $paymentResult = $this->payment->charge($state->data->total);
            if (! $paymentResult->success) {
                return $this->handlePaymentFailure($state, $paymentResult);
            }
            $state->advance('payment_charged');

            $this->shipping->createShipment($orderId);
            $state->advance('shipped');

            $state->complete();
        } catch (\Throwable $e) {
            $this->compensate($state);
            throw $e;
        }
    }
}
```
---
## Exceptions
Simple linear workflows with no branching or retry logic (use choreographed instead).
---
## Consequences Of Violation
Complex workflow logic spread across event handlers; hard to trace, test, and debug failures.

# Rule: Persist saga state for recovery from failures
---
## Category
Reliability
---
## Rule
Persist saga state (type, status, step, payload) in a `saga_states` table so that sagas can be recovered if the application crashes.
---
## Reason
An in-memory saga is lost on crash. Persistent saga state enables recovery by replaying from the last completed step, preventing data loss and enabling monitoring.
---
## Bad Example
```php
// In-memory saga state — lost on crash
class InMemorySaga
{
    private array $state = []; // volatile
}
```
---
## Good Example
```php
// Persisted saga state
class SagaState extends Model
{
    protected $table = 'saga_states';
    protected $fillable = ['saga_type', 'saga_id', 'status', 'current_step', 'payload'];
    protected $casts = ['payload' => 'array'];
}

class OrderSagaCoordinator
{
    public function execute(int $orderId): void
    {
        $state = $this->stateModel->create([
            'saga_type' => 'order_fulfillment',
            'saga_id' => $orderId,
            'status' => 'in_progress',
            'current_step' => 'started',
            'payload' => ['orderId' => $orderId],
        ]);

        try {
            // execute steps
            $state->update(['status' => 'completed']);
        } catch (\Throwable $e) {
            $state->update(['status' => 'failed']);
            $this->compensate($state);
            $state->update(['status' => 'compensated']);
        }
    }
}
```
---
## Exceptions
Stateless sagas where all steps are idempotent and re-running from scratch has no side effects.
---
## Consequences Of Violation
Saga state lost on crash; partially completed workflows never recovered; inconsistent data.

# Rule: Do not use distributed transactions (XA/two-phase commit) across contexts
---
## Category
Architecture
---
## Rule
Never use distributed transactions (XA, two-phase commit, or JTA) to coordinate operations across bounded contexts.
---
## Reason
Distributed transactions are complex, fragile, and lock resources across systems. They scale poorly and significantly reduce availability.
---
## Bad Example
```php
// Attempting distributed transaction across contexts
// (Not natively possible in Laravel, but attempted with XA bridges)
// Holds locks on both identity_users and billing_invoices
// If either system is slow, both are blocked
```
---
## Good Example
```php
// Saga approach — no locks held across contexts
// Each context commits independently
// If a step fails, compensating transactions undo previous steps
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Fragile, expensive, low-availability solution; holds locks across systems; scales poorly.

# Rule: Design compensating transactions to be idempotent
---
## Category
Design
---
## Rule
Design compensating transactions to be stateless (based solely on input) and idempotent (safe to execute multiple times).
---
## Reason
A saga may retry compensation if the first attempt fails. Stateless, idempotent compensation ensures retries are safe and don't produce side effects.
---
## Bad Example
```php
// Non-idempotent compensation
class PaymentService
{
    public function refund(int $paymentId): void
    {
        $this->gateway->refund($paymentId); // calling twice refunds twice!
    }
}
```
---
## Good Example
```php
// Idempotent compensation
class PaymentService
{
    public function refund(int $paymentId, string $idempotencyKey): RefundResult
    {
        $existing = RefundLog::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return new RefundResult(status: 'already_refunded');
        }

        $result = $this->gateway->refund($paymentId);
        RefundLog::create([
            'payment_id' => $paymentId,
            'idempotency_key' => $idempotencyKey,
            'status' => $result->success ? 'completed' : 'failed',
        ]);
        return $result;
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Double-executed compensation produces incorrect state (double refund, double cancellation).

# Rule: Do not use sagas for single-context operations
---
## Category
Architecture
---
## Rule
Use standard ACID transactions, not sagas, for operations that stay within a single bounded context.
---
## Reason
Sagas introduce complexity (events, compensations, state persistence) that is unnecessary when ACID guarantees are available within a context.
---
## Bad Example
```php
// Over-engineered saga for a single-context operation
class CreateUserSaga
{
    public function execute(array $data): void
    {
        // Only one context involved — ACID would suffice
        $user = User::create($data);
        UserProfile::create(['user_id' => $user->id, ...]);
    }
}
```
---
## Good Example
```php
// Simple ACID transaction for single-context operation
class IdentityService
{
    public function registerUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create($data);
            $user->profile()->create([/* ... */]);
            event(new UserCreated($user->id));
            return $user;
        });
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unnecessary complexity; event-driven overhead for operations that could use simple ACID.

# Rule: Use the Outbox pattern to guarantee event delivery for saga steps
---
## Category
Reliability
---
## Rule
Use the transactional outbox pattern to ensure saga-triggering events are reliably dispatched when the local transaction commits.
---
## Reason
If an event dispatch fails after the database transaction commits, the saga step is lost. The outbox pattern ensures the event is stored atomically with the transaction and dispatched reliably by a separate publisher.
---
## Bad Example
```php
// Event dispatch after commit — risk of lost event
DB::transaction(function () use ($data) {
    $order = Order::create($data);
    OrderPlaced::dispatch($order->id); // may fail — event lost
});
```
---
## Good Example
```php
// Transactional outbox pattern
DB::transaction(function () use ($data) {
    $order = Order::create($data);

    OutboxMessage::create([
        'type' => 'OrderPlaced',
        'payload' => ['order_id' => $order->id],
        'status' => 'pending',
    ]);
});

class DispatchOutboxMessages
{
    public function handle(): void
    {
        OutboxMessage::where('status', 'pending')
            ->each(fn (OutboxMessage $msg) => $this->dispatchAndMarkSent($msg));
    }
}
```
---
## Exceptions
In-memory event dispatching in a modular monolith where process crash risk is acceptable.
---
## Consequences Of Violation
Saga steps can be lost if event dispatch fails after transaction commit; saga never completes.

# Rule: Time-box saga steps with timeouts to detect stuck operations
---
## Category
Reliability
---
## Rule
Set timeouts on each saga step and mark the saga as failed if a step does not complete within the expected window.
---
## Reason
Sagas can get stuck if a step fails silently or a message is lost. Time-boxing with a timeout prevents infinite waiting and enables automated recovery or alerting.
---
## Bad Example
```php
// No timeout — saga waits indefinitely
class OrderSaga
{
    public function waitForPayment(int $orderId): void
    {
        // Wating for PaymentSucceeded event — if never arrives, saga hangs forever
    }
}
```
---
## Good Example
```php
// Time-boxed saga step
class OrderSagaCoordinator
{
    public function execute(int $orderId): void
    {
        $state = $this->states->create(/* ... */);

        // Step completes within expected window or is marked timed-out
        dispatch(new ReserveInventory($orderId))
            ->onQueue('sagas')
            ->delay(now()->addSeconds(30));

        // Recovery job checks for stuck sagas
        SagaState::where('status', 'in_progress')
            ->where('updated_at', '<', now()->subMinutes(5))
            ->each(fn ($state) => $this->handleTimeout($state));
    }

    private function handleTimeout(SagaState $state): void
    {
        Log::warning("Saga {$state->saga_id} timed out at step {$state->current_step}");
        $this->compensate($state);
        $state->update(['status' => 'timed_out']);
    }
}
```
---
## Exceptions
Sagas with guaranteed delivery and no failure risk.
---
## Consequences Of Violation
Sagas hang indefinitely; resources are never released; system accumulates stuck operations.
