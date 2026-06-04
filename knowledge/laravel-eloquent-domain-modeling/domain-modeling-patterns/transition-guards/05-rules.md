# Transition Guards — Rules

---

## Rule: Fail Fast and Throw Specific Exceptions in Guards
---
## Category
Reliability
---
## Rule
Evaluate all guard conditions as the first step in a transition, throwing a specific, typed exception for each distinct failure condition.
---
## Reason
Fail-fast guards prevent partial state mutations and provide clear, actionable error messages. Generic exceptions force callers to parse message strings to determine what went wrong.
---
## Bad Example
```php
public function transitionTo(OrderStatus $newStatus): void
{
    $this->status = $newStatus;

    if ($newStatus === OrderStatus::Shipped && ! $this->shipping_address) {
        throw new \RuntimeException('Invalid transition');
    }
    $this->save();
}
```
---
## Good Example
```php
public function transitionTo(OrderStatus $newStatus): void
{
    $this->guardTransition($newStatus);

    $this->status = $newStatus;
    $this->save();
}

private function guardTransition(OrderStatus $newStatus): void
{
    if (! in_array($newStatus, $this->status->allowedTransitions())) {
        throw new InvalidTransitionException($this->status, $newStatus);
    }
    if ($newStatus === OrderStatus::Shipped && ! $this->shipping_address) {
        throw new MissingShippingAddressException($this->id);
    }
}
```
---
## Exceptions
No common exceptions. Guards always run first, before any state mutation.
---
## Consequences Of Violation
Partial state mutations when guard fails mid-method, inconsistent object state, and debugging difficulty from generic exceptions that don't indicate which precondition failed.

---

## Rule: One Guard, One Condition
---
## Category
Maintainability
---
## Rule
Design each guard to validate exactly one precondition. Combine multiple guards into a composite guard when multiple conditions must pass, but keep each individual guard single-purpose.
---
## Reason
Single-condition guards are independently testable, reusable across different transitions, and clearly document what each precondition is. Multi-condition guards violate Single Responsibility and force duplication when the same condition is needed elsewhere.
---
## Bad Example
```php
class OrderCanBeShippedGuard
{
    public function __invoke(Order $order): void
    {
        if ($order->status !== OrderStatus::Approved) {
            throw new InvalidTransitionException(...);
        }
        if (! $order->shipping_address) {
            throw new MissingShippingAddressException(...);
        }
        if ($order->items->isEmpty()) {
            throw new CannotShipEmptyOrderException(...);
        }
        if ($order->hasOutstandingBalance()) {
            throw new OutstandingBalanceException(...);
        }
    }
}
```
---
## Good Example
```php
class OrderStatusGuard
{
    public function __invoke(Order $order): void
    {
        if ($order->status !== OrderStatus::Approved) {
            throw new InvalidTransitionException(...);
        }
    }
}

class ShippingAddressGuard
{
    public function __invoke(Order $order): void
    {
        if (! $order->shipping_address) {
            throw new MissingShippingAddressException($order->id);
        }
    }
}

class CompositeGuard
{
    public function __construct(private array $guards) {}

    public function __invoke(Order $order): void
    {
        foreach ($this->guards as $guard) {
            $guard($order);
        }
    }
}
```
---
## Exceptions
Extremely simple, never-reused precondition combinations where extracting each to a class adds more files than clarity. Err on extraction.
---
## Consequences Of Violation
Duplicated conditions across composites, inability to test preconditions separately, and bloated guard classes hard to name and maintain.

---

## Rule: Guards Must Not Perform Side Effects
---
## Category
Architecture
---
## Rule
Guards must only inspect state and throw on violation. They must never modify state, dispatch events, call external services, or write to the database.
---
## Reason
Performing side effects inside a guard violates Command-Query Separation and introduces hidden behavior. A guard that appears to only check a condition but also logs or modifies counters is a source of subtle bugs.
---
## Bad Example
```php
class ShippingAddressGuard
{
    public function __invoke(Order $order): void
    {
        if (! $order->shipping_address) {
            Log::warning('Missing address', ['order' => $order->id]);
            throw new MissingShippingAddressException($order->id);
        }

        $order->address_verified_at = now();
    }
}
```
---
## Good Example
```php
class ShippingAddressGuard
{
    public function __invoke(Order $order): void
    {
        if (! $order->shipping_address) {
            throw new MissingShippingAddressException($order->id);
        }
    }
}

$guard($order);
Log::info('Shipping address verified', ['order' => $order->id]);
```
---
## Exceptions
No common exceptions. Guards are read-only validators.
---
## Consequences Of Violation
Hidden side effects executing even when a transition fails, phantom log entries for failed transitions, and state corruption from guard-originated mutations.

---

## Rule: Separate Authorization Guards from Business Rule Guards
---
## Category
Security
---
## Rule
Always check user authorization (permissions, roles, ownership) in a dedicated authorization guard separate from business-rule and data-integrity guards.
---
## Reason
Authorization rules change based on user roles and policy, while business rules are stable domain invariants. Mixing them prevents reusing business guards in non-user-driven transitions (CLI, queue) and obscures security logic.
---
## Bad Example
```php
class OrderCanBeShippedGuard
{
    public function __invoke(Order $order, User $user): void
    {
        if (! $user->can('ship', $order)) {
            throw new UnauthorizedException();
        }
        if (! $order->shipping_address) {
            throw new MissingShippingAddressException();
        }
    }
}
```
---
## Good Example
```php
class OrderCanBeShippedGuard
{
    public function __invoke(Order $order): void
    {
        if ($order->status !== OrderStatus::Approved) {
            throw new InvalidTransitionException(...);
        }
        if (! $order->shipping_address) {
            throw new MissingShippingAddressException($order->id);
        }
    }
}

class ShipOrderAction
{
    public function execute(Order $order, User $user): void
    {
        Gate::authorize('ship', $order);
        (new OrderCanBeShippedGuard())($order);
        $order->transitionTo(OrderStatus::Shipped);
    }
}
```
---
## Exceptions
No common exceptions. Authorization and business rules are always separated.
---
## Consequences Of Violation
Business guards unusable from CLI/queue, security rules hidden inside business logic, and confusion about whether failure is a permission problem or a domain rule violation.

---

## Rule: Test Every Guard Independently
---
## Category
Testing
---
## Rule
Write unit tests for each guard class in isolation, verifying that it passes when the precondition holds and throws the correct exception when it does not.
---
## Reason
Integration testing guards through transition methods couples test setup to the full state machine. Isolated guard tests are faster, more precise, and verify each precondition independently without interference from other guards.
---
## Bad Example
```php
public function test_transition_to_shipped_fails_without_address(): void
{
    $order = Order::factory()->create([
        'status' => OrderStatus::Approved,
        'shipping_address' => null,
    ]);

    $this->expectException(MissingShippingAddressException::class);
    $order->transitionTo(OrderStatus::Shipped);
    // Tests guard + transition logic together — can't tell which failed
}
```
---
## Good Example
```php
public function test_shipping_address_guard_rejects_null_address(): void
{
    $order = Order::factory()->create(['shipping_address' => null]);
    $guard = new ShippingAddressGuard();

    $this->expectException(MissingShippingAddressException::class);

    $guard($order);
}

public function test_shipping_address_guard_passes_with_address(): void
{
    $order = Order::factory()->create(['shipping_address' => '123 Main St']);
    $guard = new ShippingAddressGuard();

    $guard($order); // Should not throw

    $this->expectNotToPerformAssertions();
}
```
---
## Exceptions
No common exceptions. Isolated guard tests are always preferred.
---
## Consequences Of Violation
Test failures that don't pinpoint the exact failing precondition, slower test suites due to full state machine setup, and lower confidence in individual guard correctness.

---

## Rule: Reuse Guards Across Related Transitions
---
## Category
Maintainability
---
## Rule
When the same precondition applies to multiple transitions (e.g., "customer must be verified" applies to both `approve` and `ship`), reuse a single guard class instead of duplicating the check.
---
## Reason
Duplicated precondition checks drift over time — one copy gets updated, the other doesn't. A single guard class becomes the authoritative source for that precondition, ensuring consistency across all transitions.
---
## Bad Example
```php
class ApproveOrderGuard
{
    public function __invoke(Order $order): void
    {
        if (! $order->user->isVerified()) {
            throw new CustomerNotVerifiedException();
        }
    }
}

class ShipOrderGuard
{
    public function __invoke(Order $order): void
    {
        if (! $order->user->isVerified()) {
            throw new CustomerNotVerifiedException();
        }
        // Duplicated — drifts when verification logic changes
    }
}
```
---
## Good Example
```php
class CustomerVerificationGuard
{
    public function __invoke(Order $order): void
    {
        if (! $order->user->isVerified()) {
            throw new CustomerNotVerifiedException($order->user->id);
        }
    }
}

// Reused in both transitions:
class ApproveOrderGuard
{
    public function __construct(
        private CustomerVerificationGuard $verification,
    ) {}

    public function __invoke(Order $order): void
    {
        ($this->verification)($order);
        // Approve-specific checks...
    }
}

class ShipOrderGuard
{
    public function __construct(
        private CustomerVerificationGuard $verification,
    ) {}

    public function __invoke(Order $order): void
    {
        ($this->verification)($order);
        // Ship-specific checks...
    }
}
```
---
## Exceptions
When the precondition appears to be the same but has slightly different semantics in different contexts. Prefer a single guard with parameters over duplication.
---
## Consequences Of Violation
Inconsistent enforcement when one copy of a precondition is updated and others are missed, increasing the risk of business rule violations.

---

## Rule: Avoid Expensive Operations Inside Guards
---
## Category
Performance
---
## Rule
Keep guard logic limited to fast property reads, simple comparisons, and pre-cached data. Never perform expensive database queries, external API calls, or heavy computations inside a guard.
---
## Reason
Guards run on every transition attempt. Expensive guard logic turns routine state changes into slow operations, and the cost multiplies with every guard in the composite chain.
---
## Bad Example
```php
class FraudCheckGuard
{
    public function __invoke(Order $order): void
    {
        $result = Http::post('https://fraud-api.example.com/check', [
            'amount' => $order->total_cents,
        ]);
        // External API call in every transition — slow and unreliable!

        if ($result->json()['is_fraud']) {
            throw new FraudDetectedException($order->id);
        }
    }
}
```
---
## Good Example
```php
class FraudCheckGuard
{
    public function __invoke(Order $order): void
    {
        // Fast in-memory check using pre-computed data
        if ($order->total_cents > config('fraud.threshold_cents')) {
            throw new FraudDetectedException($order->id);
        }
    }
}

// Heavy fraud checks happen asynchronously via domain event listeners
```
---
## Exceptions
When an expensive check is absolutely required to prevent an irreversible transition. In that case, cache the result aggressively.
---
## Consequences Of Violation
Slow transition methods that degrade user experience, external API dependencies introducing latency and unreliability into every state change, and timeouts during high-traffic periods.
