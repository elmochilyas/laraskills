# Phase 5: Action Composition Rules

---

## Rule: Limit Composition Depth to 3 Action Dependencies

---

## Category

Architecture

---

## Rule

An action class must not declare more than 3 action dependencies in its constructor. At 4 or more action dependencies, the class is orchestrating rather than composing and must be refactored into a Service class.

---

## Reason

The number of action dependencies is the primary architectural signal distinguishing composition from orchestration. Below the threshold, the action's single responsibility is clear. Above it, the class is coordinating multiple sub-operations — a service responsibility. Exceeding the threshold erodes the action's identity and creates a "tower of actions" that is difficult to trace and maintain.

---

## Bad Example

```php
final readonly class ProcessOrderAction
{
    public function __construct(
        private ValidateOrderAction $validate,
        private ReserveInventoryAction $reserve,
        private ChargePaymentAction $charge,
        private CreateShipmentAction $ship,
        private NotifyCustomerAction $notify,
    ) {}
    // 5 action dependencies — this is a service, not an action
}
```

---

## Good Example

```php
// Service orchestrates 5+ actions:
final readonly class ProcessOrderService
{
    public function __construct(
        private ValidateOrderAction $validate,
        private ReserveInventoryAction $reserve,
        private ChargePaymentAction $charge,
        private CreateShipmentAction $ship,
        private NotifyCustomerAction $notify,
    ) {}

    public function process(OrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $this->validate->execute($data);
            $this->reserve->execute($data->items);
            $payment = $this->charge->execute($data->payment);
            $order = $this->ship->execute($data, $payment);
            DB::afterCommit(fn () => $this->notify->execute($order));
            return $order;
        });
    }
}

// Each individual action stays at 1-3 dependencies
```

---

## Exceptions

Actions that compose other actions at a single conceptual level (e.g., a `NotifyAllStakeholdersAction` that calls 4 notification actions, each for a different channel) may exceed the limit if all composed actions represent the same "notification" concern — but this should be verified through code review.

---

## Consequences Of Violation

Maintenance risks: excessive composition depth creates call graphs that are difficult to trace and debug. Scalability risks: the action's single-responsibility identity is lost. Code Organization risks: actions and services become indistinguishable, eroding the pattern's architectural value.

---

---

## Rule: Sub-Actions Must Not Manage Their Own Transactions

---

## Category

Architecture

---

## Rule

Any action that is composed into a larger workflow must not call `DB::transaction()` or `DB::beginTransaction()` internally. Transaction ownership belongs exclusively to the outermost orchestrator.

---

## Reason

When a sub-action manages its own transaction inside an outer transaction, the inner `DB::transaction()` creates a savepoint — not a true nested transaction. This creates confusing semantics: the savepoint can roll back the sub-action's changes without aborting the parent transaction, leading to partial commits. The action becomes unusable in any composed context.

---

## Bad Example

```php
final readonly class ReserveInventoryAction
{
    public function execute(array $items): void
    {
        DB::transaction(function () use ($items) {
            // Savepoint inside an outer transaction — confusing semantics
            InventoryItem::whereIn('id', $items)->decrement('stock');
        });
    }
}

// Called from a service that already has a transaction:
$service->processOrder($data); // ReserveInventoryAction creates a savepoint
```

---

## Good Example

```php
final readonly class ReserveInventoryAction
{
    public function execute(array $items): void
    {
        // No transaction — delegate to orchestrator
        InventoryItem::whereIn('id', $items)->decrement('stock');
    }
}

// Orchestrator owns the transaction:
class ProcessOrderService
{
    public function process(OrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->execute($data->items);
            $this->chargePayment->execute($data->payment);
            return $this->createOrder->execute($data);
        });
    }
}
```

---

## Exceptions

Standalone actions that are guaranteed to be the top-level caller (scheduled commands, maintenance operations) and will never be composed into a larger workflow may manage their own transaction. This must be documented on the action class.

---

## Consequences Of Violation

Reliability risks: savepoint confusion leads to partial commits — some changes persist while others roll back. Maintenance risks: the action cannot be safely reused in different composition contexts. Testing risks: SQLite tests pass (savepoints are no-ops) but production MySQL/PostgreSQL behavior differs.

---

---

## Rule: Pass Data Through Return Values, Not Shared Mutable State

---

## Category

Design

---

## Rule

Actions must communicate data between each other exclusively through return values. Sub-actions must not write to shared state (static properties, singleton services, mutable registries) that other actions read.

---

## Reason

Shared mutable state creates implicit temporal coupling — sub-action A must execute before sub-action B, but this ordering is hidden in the implementation rather than explicit in the calling code. It also introduces state-leakage risks in long-lived processes. Return values make data flow explicit, testable, and independent of execution order.

---

## Bad Example

```php
final readonly class ValidateCartAction
{
    public function execute(Cart $cart): void
    {
        $this->validator->validate($cart->items);
        $cart->setValidated(true); // Mutates shared state
    }
}

final readonly class ProcessPaymentAction
{
    public function execute(Cart $cart): Payment
    {
        if (!$cart->isValidated()) { // Reads shared state set by another action
            throw new CartNotValidatedException();
        }
        // ...
    }
}
```

---

## Good Example

```php
final readonly class ValidateCartAction
{
    public function execute(Cart $cart): ValidationResult
    {
        return new ValidationResult(
            valid: $this->validator->validate($cart->items),
            total: $this->calculator->calculate($cart->items),
        );
    }
}

final readonly class ProcessPaymentAction
{
    public function execute(PaymentData $data, ValidationResult $validation): Payment
    {
        // Data passed explicitly through return values
        return $this->gateway->charge($validation->total, $data->token);
    }
}
```

---

## Exceptions

Cross-cutting infrastructure context (request ID, tenant ID, correlation ID) may be carried via a shared context object if it is truly invariant across all actions in a chain and is never written to during execution.

---

## Consequences Of Violation

Maintenance risks: execution order dependencies are hidden, making refactoring dangerous. Reliability risks: state leakage in long-lived processes. Testing risks: tests must set up shared state in a specific order, creating fragile, order-dependent tests.

---

---

## Rule: Make Sub-Action Execution Order Explicit

---

## Category

Maintainability

---

## Rule

The orchestrating method must explicitly sequence sub-action calls in its method body. Developers must not rely on constructor parameter declaration order or container resolution order to imply execution sequence.

---

## Reason

Constructor parameter order has no semantic meaning in PHP — it is a syntactic convenience for dependency injection, not a sequencing mechanism. Relying on it for execution order creates hidden coupling that breaks when parameters are reordered for readability. Explicit sequencing makes the workflow visible, reviewable, and maintainable.

---

## Bad Example

```php
final readonly class OnboardUserAction
{
    public function __construct(
        private CreateAccountAction $createAccount,    // Implied step 1
        private SendWelcomeAction $sendWelcome,        // Implied step 2
        private ScheduleOnboardingAction $schedule,     // Implied step 3
    ) {}

    public function execute(UserData $data): User
    {
        // Order is implicit — relies on constructor parameter order
        return $this->createAccount->execute($data);
        // Wait — when was sendWelcome called? It wasn't!
    }
}
```

---

## Good Example

```php
final readonly class OnboardUserService
{
    public function __construct(
        private CreateAccountAction $createAccount,
        private SendWelcomeAction $sendWelcome,
        private ScheduleOnboardingAction $schedule,
    ) {}

    public function execute(UserData $data): User
    {
        $user = $this->createAccount->execute($data);

        DB::afterCommit(function () use ($user) {
            $this->sendWelcome->execute($user);
            $this->schedule->execute($user);
        });

        return $user;
    }
}
```

---

## Exceptions

An action that composes exactly one sub-action (delegation) has no ordering concern — the single call is trivially explicit.

---

## Consequences Of Violation

Maintenance risks: developers reorder constructor parameters for readability and accidentally break the workflow. Reliability risks: implicit ordering assumptions are not verified by static analysis. Code Review risks: reviewers cannot determine workflow logic from reading constructor declarations.

---

---

## Rule: Prevent Circular Dependencies Between Actions

---

## Category

Architecture

---

## Rule

No action class may depend directly or transitively on itself through composition. Action A must not inject Action B if Action B injects Action A, directly or through any chain of intermediate actions.

---

## Reason

Circular composition causes a runtime container resolution error (`Laravel\Tnt\Exceptions\BindingResolutionException`). The error surfaces only when the action is first resolved, not during autoloading or compilation. No static analysis tool can reliably detect all circular composition paths through the container.

---

## Bad Example

```php
// Circular dependency — will crash at resolution time:
final readonly class ValidateOrderAction
{
    public function __construct(
        private CheckoutAction $checkout,  // This creates the cycle
    ) {}
}

final readonly class CheckoutAction
{
    public function __construct(
        private ValidateOrderAction $validate,  // References ValidateOrderAction
    ) {}
}
```

---

## Good Example

```php
// Break the cycle by extracting shared logic to a service or a third action:
final readonly class OrderValidator
{
    // Shared validation logic — not an action, no circular dependency
    public function validate(array $items): void { /* ... */ }
}

final readonly class ValidateOrderAction
{
    public function __construct(
        private OrderValidator $validator,
    ) {}
}

final readonly class CheckoutAction
{
    public function __construct(
        private OrderValidator $validator,
        private ChargePaymentAction $charge,
    ) {}
}
```

---

## Exceptions

No common exceptions. Any circular dependency indicates a design flaw that must be resolved by extracting shared logic to a common dependency or restructuring the action hierarchy.

---

## Consequences Of Violation

Reliability risks: runtime crash when the container attempts to resolve a circular chain. The error surfaces in production, not during compilation. Maintenance risks: diagnosing circular dependencies in complex composition trees is time-consuming and requires tracing the entire dependency graph.

---

---

## Rule: Test Each Action Independently with Mocked Sub-Actions

---

## Category

Testing

---

## Rule

Each composed action must have its own test class with mocked sub-actions to verify call order and data flow. Orchestration tests must verify that each sub-action is called with the correct parameters and in the correct sequence.

---

## Reason

Sub-actions have their own test classes that verify their internal logic independently. The orchestrator's test should not re-test sub-action logic — it should verify that the orchestrator correctly delegates to sub-actions, passes the right data, and handles sub-action failures. Mocked sub-actions isolate the orchestrator from sub-action implementations, making tests fast and focused.

---

## Bad Example

```php
// Testing the orchestrator by also testing sub-actions:
public function test_checkout_creates_order(): void
{
    $this->refreshDatabase();
    $user = User::factory()->create();
    $product = Product::factory()->create();

    // This test exercises the full chain — slow and redundant
    $result = $this->checkoutService->process($user, $product);

    $this->assertDatabaseHas('orders', ['user_id' => $user->id]);
    $this->assertDatabaseHas('inventory', ['product_id' => $product->id, 'stock' => 0]);
}
```

---

## Good Example

```php
public function test_checkout_calls_actions_in_correct_order(): void
{
    $this->validateCart->shouldReceive('execute')->once()->ordered();
    $this->chargePayment->shouldReceive('execute')
        ->once()->ordered()
        ->andReturn(new PaymentResult('tx_123'));
    $this->createOrder->shouldReceive('execute')
        ->once()->ordered()
        ->andReturn(Order::factory()->make(['id' => 1]));

    $result = $this->checkoutService->process($cart, $user);

    Assert::assertInstanceOf(Order::class, $result);
}
```

---

## Exceptions

Critical end-to-end workflows may have a single integration test that exercises the full composition chain with real collaborators. This test supplements — but does not replace — the independent unit tests for each composed action.

---

## Consequences Of Violation

Testing risks: orchestrator tests become slow, brittle integration tests. Maintenance risks: failing orchestrator tests do not indicate which sub-action caused the failure. Scalability risks: test suites grow quadratically with composition depth as every test exercises the full chain.

---

---

## Rule: Do Not Compose Actions with Shared Singleton Mutable State

---

## Category

Reliability

---

## Rule

Actions that are composed together must not share a singleton service that holds mutable state. If two sub-actions write to and read from the same singleton service, the execution order becomes a hidden dependency and state leaks across requests in Octane.

---

## Reason

Singleton services are shared across all requests in long-lived processes. When two composed actions both use the same singleton mutable service, the first action's writes affect the second action's reads — even across different request scopes. This creates temporal coupling that is invisible at the action level and causes non-deterministic failures.

---

## Bad Example

```php
// CacheManager is bound as a singleton
final readonly class TrackAction
{
    public function execute(string $event): void
    {
        // Writes to singleton mutable state
        Counter::increment('events:' . $event);
    }
}

final readonly class ReportAction
{
    public function execute(): array
    {
        // Reads state written by TrackAction — temporal coupling
        return Counter::get('events:*');
    }
}

// Composed together — hidden state dependency:
class WorkflowService
{
    public function run(): void
    {
        $this->track->execute('start');
        $this->report->execute(); // Result depends on track
    }
}
```

---

## Good Example

```php
final readonly class TrackAction
{
    public function execute(string $event): TrackedEvent
    {
        // Returns data instead of writing to shared state
        return new TrackedEvent(name: $event, timestamp: now());
    }
}

final readonly class ReportAction
{
    public function execute(TrackedEvent ...$events): Report
    {
        // Receives data explicitly — no shared state
        return new Report(events: $events);
    }
}

class WorkflowService
{
    public function run(): Report
    {
        $startEvent = $this->track->execute('start');
        $processEvent = $this->track->execute('process');
        return $this->report->execute($startEvent, $processEvent);
    }
}
```

---

## Exceptions

Read-only singleton services (cached configuration, read-only repository) are safe to share between composed actions because they do not hold mutable state.

---

## Consequences Of Violation

Reliability risks: non-deterministic failures in production under concurrent load. Security risks: data from one request leaking into another request's computation. Maintenance risks: execution order becomes a hidden invariant that breaks when actions are reordered.

---
