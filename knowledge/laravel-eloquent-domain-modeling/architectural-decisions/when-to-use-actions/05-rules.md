# Architectural Decision Rules: When to Use Actions

---

## Rule 1: Extract an action when the operation coordinates two or more aggregates
---
## Category
Architecture
---
## Rule
Create an action class whenever a use case must coordinate operations across two or more aggregate roots. Do not put cross-aggregate logic in a controller or a single model method.
---
## Reason
Cross-aggregate operations must manage transactions, enforce ordering, and handle partial failures. A dedicated action class encapsulates this orchestration in a testable, single-responsibility unit. Controllers should not contain business orchestration, and a single model should not control other models.
---
## Bad Example
```php
// Controller with cross-aggregate logic
class OrderController
{
    public function place(PlaceOrderRequest $request, Order $order)
    {
        DB::transaction(function () use ($order) {
            $order->markAsPlaced();
            Inventory::deductForOrder($order);
            $this->generateShipment($order);
        });
        return redirect()->route('orders.show', $order);
    }
}
```
---
## Good Example
```php
// Dedicated action class
class PlaceOrderAction
{
    public function __construct(
        private GenerateShipmentAction $generateShipment,
    ) {}

    public function __invoke(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->markAsPlaced();
            Inventory::deductForOrder($order);
            $this->generateShipment->forOrder($order);
        });
    }
}

// Thin controller
class OrderController
{
    public function place(PlaceOrderRequest $request, PlaceOrderAction $placeOrder, Order $order)
    {
        $placeOrder($order);
        return redirect()->route('orders.show', $order);
    }
}
```
---
## Exceptions
When the cross-aggregate logic is trivial (e.g., updating a timestamp on a related model) and the coordination is a single line. Keep it in the controller or model method.
---
## Consequences Of Violation
Fat controllers with business orchestration; model methods that write to other models; cross-aggregate logic duplicated across controllers; untestable orchestration logic buried in HTTP context.

---

## Rule 2: Keep actions stateless — never store mutable data between invocations
---
## Category
Reliability
---
## Rule
Actions must not hold any mutable state on `$this` between invocations. All state must be passed as method parameters or injected via constructor as immutable dependencies.
---
## Reason
Action classes are typically resolved once from the container and reused across requests. Mutable instance state persists between calls, causing cross-request contamination where data from one invocation leaks into the next.
---
## Bad Example
```php
class ProcessPaymentAction
{
    private int $attemptCount = 0; // Mutable state

    public function __invoke(Payment $payment): void
    {
        $this->attemptCount++;
        if ($this->attemptCount > 3) {
            throw new \RuntimeException('Too many attempts');
        }
    }
}
```
---
## Good Example
```php
class ProcessPaymentAction
{
    public function __construct(
        private PaymentGateway $gateway,
    ) {}

    public function __invoke(Payment $payment, int $maxRetries = 3): void
    {
        $attempts = 0;
        while ($attempts < $maxRetries) {
            try {
                $this->gateway->charge($payment);
                return;
            } catch (PaymentFailed) {
                $attempts++;
            }
        }
        throw new PaymentFailedException('Max retries exceeded');
    }
}
```
---
## Exceptions
When the action is explicitly registered as a singleton and the mutable state is the intended feature (e.g., a rate-limiter action). Document this clearly.
---
## Consequences Of Violation
Cross-request data leakage; non-deterministic test failures; state from one invocation corrupts the next; debugging occurs only in production under load.

---

## Rule 3: Never reference HTTP concerns (`Request`, `Response`) inside an action
---
## Category
Architecture
---
## Rule
Actions must not import `Illuminate\Http\Request`, return `Response` or `RedirectResponse`, or reference any HTTP-specific class. They receive validated data and return typed results or void.
---
## Reason
Actions that depend on HTTP classes cannot be reused from CLI commands, queue jobs, or tests without simulating HTTP requests. Keeping actions framework-agnostic ensures they are portable across all entry points into the application.
---
## Bad Example
```php
class RegisterUserAction
{
    public function __invoke(Request $request): RedirectResponse
    {
        User::create($request->validated());
        return redirect()->route('dashboard');
    }
}
```
---
## Good Example
```php
class RegisterUserAction
{
    public function __invoke(RegisterUserData $data): User
    {
        return User::create([
            'name' => $data->name,
            'email' => $data->email,
        ]);
    }
}

// Controller handles HTTP
class RegisterUserController
{
    public function __invoke(RegisterUserRequest $request, RegisterUserAction $action)
    {
        $action($request->toData());
        return redirect()->route('dashboard');
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Action cannot be called from CLI or queues; tests must create fake HTTP requests; action is tied to controller conventions like redirects and response types.

---

## Rule 4: Push domain logic down to models — actions orchestrate, they do not implement
---
## Category
Architecture
---
## Rule
Actions should call model methods and sub-actions. They should not contain raw query builder calls (`where()`, `orderBy()`), inline business rules, or `if` statements about domain state.
---
## Reason
Domain logic in actions is invisible when reasoning about the domain model. When business rules change, developers must update both the model and the action. Keeping domain logic in models ensures a single point of change.
---
## Bad Example
```php
class CancelOrderAction
{
    public function __invoke(Order $order, string $reason): void
    {
        if ($order->status !== 'pending') { // Business rule in action
            throw new \DomainException('Only pending orders can be cancelled.');
        }
        $order->status = 'cancelled'; // Direct state mutation in action
        $order->cancelled_at = now();
        $order->save();
    }
}
```
---
## Good Example
```php
class CancelOrderAction
{
    public function __invoke(Order $order, string $reason): void
    {
        $order->cancel($reason); // Business rule in model method
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
        $this->save();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [OrderStatus::Pending, OrderStatus::Processing]);
    }
}
```
---
## Exceptions
When the business rule involves state from multiple aggregates and does not naturally belong to any single model. In that case, the action is the appropriate place for the cross-aggregate rule.
---
## Consequences Of Violation
Anemic domain models; business rules duplicated across actions; changes require updating multiple action files; domain logic buried in orchestration code.

---

## Rule 5: Create one action per use case — never branch on argument values
---
## Category
Maintainability
---
## Rule
Each action class must represent exactly one use case. Never use a single action for multiple use cases by branching on an argument like `$mode` or `$type`.
---
## Reason
Actions with branching logic have multiple reasons to change, violating the Single Responsibility Principle. When one branch's logic changes, the entire action must be re-tested, and the other branches risk regression.
---
## Bad Example
```php
class ProcessPaymentAction
{
    public function __invoke(Payment $payment, string $mode): void
    {
        if ($mode === 'refund') {
            // Refund logic
        } elseif ($mode === 'capture') {
            // Capture logic
        } elseif ($mode === 'void') {
            // Void logic
        }
    }
}
```
---
## Good Example
```php
class RefundPaymentAction { /* ... */ }
class CapturePaymentAction { /* ... */ }
class VoidPaymentAction { /* ... */ }
```
---
## Exceptions
When the branching is on an infrastructure concern (e.g., synchronous vs. queued execution) and the business logic is identical. In that case, use a strategy or decorator pattern, not `if/else`.
---
## Consequences Of Violation
God actions with multiple reasons to change; testing requires covering all branches in each test; adding a new use case requires modifying an existing class, risking regression.

---

## Rule 6: Wrap cross-aggregate actions in `DB::transaction()` for atomicity
---
## Category
Reliability
---
## Rule
Always wrap action logic that touches multiple models or aggregates inside `DB::transaction()`. Single-model operations that only call `$model->save()` do not need the wrapping.
---
## Reason
Cross-aggregate operations that fail mid-way leave the system with partial updates. A transaction ensures all-or-nothing semantics: either all models are persisted or none are.
---
## Bad Example
```php
class TransferFundsAction
{
    public function __invoke(Account $from, Account $to, Money $amount): void
    {
        $from->withdraw($amount);
        $to->deposit($amount);
        // If deposit fails, withdrawal is already persisted!
    }
}
```
---
## Good Example
```php
class TransferFundsAction
{
    public function __invoke(Account $from, Account $to, Money $amount): void
    {
        DB::transaction(function () use ($from, $to, $amount) {
            $from->withdraw($amount);
            $to->deposit($amount);
        });
    }
}
```
---
## Exceptions
Read-only actions. Actions that delegate transaction management to a sub-action (document the delegation explicitly). Actions that should persist partially on failure (rare, use with caution).
---
## Consequences Of Violation
Partial writes cause data inconsistency; financial operations lose money; debugging requires manual database inspection to detect incomplete operations.

---

## Rule 7: Name actions as `{Verb}{Entity}Action` — document the use case in the class name
---
## Category
Code Organization
---
## Rule
Name action classes using the pattern `{Verb}{Entity}Action` (e.g., `PayInvoiceAction`, `CancelSubscriptionAction`). Place them in `App\Actions\{Domain}\`.
---
## Reason
A consistent naming convention makes actions discoverable by use case. Developers can navigate to `App\Actions\Billing\PayInvoiceAction` without searching or guessing. The name documents exactly what the action does.
---
## Bad Example
```php
// Unclear names — what do these do?
class InvoiceProcessor { /* ... */ }
class OrderService { /* ... */ }
class BillingHandler { /* ... */ }
```
---
## Good Example
```php
// Clear, discoverable names
class PayInvoiceAction { /* ... */ }
class CancelOrderAction { /* ... */ }
class GenerateInvoiceAction { /* ... */ }
```
---
## Exceptions
When the action is a sub-action used only internally and named for clarity within the module. However, maintain the suffix `Action` for consistency.
---
## Consequences Of Violation
Actions cannot be found by name alone; similar actions have inconsistent naming; developers create duplicate actions because they cannot find the existing one.

---

## Rule 8: Test actions against real models, not mocked dependencies
---
## Category
Testing
---
## Rule
Test actions using real model factories with `RefreshDatabase` for persistence assertions. Mock only external services (payment gateways, email, APIs), not domain models or repositories.
---
## Reason
Actions orchestrate real domain logic. Mocking the models hides the actual state mutations, validation rules, and event dispatches that the action triggers. Testing against real models ensures the action actually works with the domain's behavior.
---
## Bad Example
```php
public function test_place_order(): void
{
    $order = $this->createMock(Order::class);
    $action = new PlaceOrderAction();
    $action($order);
    // Only verifies the mock was called, not actual behavior
}
```
---
## Good Example
```php
use RefreshDatabase;

public function test_place_order(): void
{
    $order = Order::factory()->pending()->create();
    $action = app(PlaceOrderAction::class);
    $action($order);

    $this->assertEquals(OrderStatus::Placed, $order->fresh()->status);
    $this->assertDatabaseHas('inventory_movements', ['order_id' => $order->id]);
}
```
---
## Exceptions
When the action's dependency is an external API (Stripe, Twilio). In that case, mock at the HTTP client level using `Http::fake()` and assert the action's behavior with the real domain models.
---
## Consequences Of Violation
Tests pass with mocks but fail against real models; SQL constraints and validation rules untested; event listeners never fire in tests; false confidence in action behavior.
