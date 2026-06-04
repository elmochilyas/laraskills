# Spatie Model States — Rules

---

## Rule: Define Allowed Transitions Explicitly in Each State Class
---
## Category
Design
---
## Rule
Override `transitionableStates()` in every state class to declare exactly which states can be transitioned to from that state. Never leave the default behavior that allows all transitions.
---
## Reason
Explicit `transitionableStates()` makes the transition graph visible in each state file, serving as documentation and runtime enforcement. Default-allowed transitions create hidden paths that violate domain rules.
---
## Bad Example
```php
class Pending extends OrderState
{
    // No transitionableStates() override — all transitions allowed by default!
}
```
---
## Good Example
```php
class Pending extends OrderState
{
    public function transitionableStates(): array
    {
        return [
            Approved::class,
            Cancelled::class,
        ];
    }
}
```
---
## Exceptions
No common exceptions. Every state class must explicitly declare its allowed transitions.
---
## Consequences Of Violation
Invalid state transitions allowed at runtime, violation of domain invariants, and state machines whose behavior differs from developer expectations.

---

## Rule: Use Transition Classes for Side Effects
---
## Category
Architecture
---
## Rule
When a state transition must perform actions beyond changing the state value (logging, dispatching events, updating related records), create a dedicated Transition class rather than putting side effects in the state class or the model.
---
## Reason
State classes should focus on defining allowed transitions and state-specific behavior. Injecting side effects into states violates Single Responsibility and makes state classes harder to test. Transition classes encapsulate the "during transition" logic cleanly.
---
## Bad Example
```php
class Approved extends OrderState
{
    public function transitionableStates(): array
    {
        return [Shipped::class];
    }

    // Side effect logic leaking into state class
    public function onTransitionToShipped(Order $order): void
    {
        Mail::send(new ShipmentConfirmation($order));
        Log::info('Order shipped', ['id' => $order->id]);
    }
}
```
---
## Good Example
```php
class ShipOrderTransition extends Transition
{
    public function __construct(
        private Order $order,
    ) {}

    public function handle(): OrderState
    {
        $this->order->shipped_at = now();
        $this->order->save();

        Event::dispatch(new OrderShipped($this->order->id));

        return new Shipped($this->order);
    }
}

// Usage:
$order->status->transitionTo(Shipped::class, ShipOrderTransition::class);
```
---
## Exceptions
No common exceptions. Side effects belong in Transition classes.
---
## Consequences Of Violation
State classes bloated with infrastructure logic, difficulty testing transitions independently, and side effects that fire even when only querying state metadata.

---

## Rule: Keep State Classes Focused on Transition Rules and State-Specific Behavior
---
## Category
Design
---
## Rule
Limit state class responsibilities to defining allowed transitions and providing state-specific query methods or scopes. Extract complex business logic to Transition classes or listeners.
---
## Reason
State classes that combine transition rules, business logic, and side effects become unmanageable as the number of states grows. Clear separation keeps each concern testable and replaceable.
---
## Bad Example
```php
class Pending extends OrderState
{
    public function transitionableStates(): array { ... }

    public function color(): string { return 'yellow'; }

    public function canBeModified(): bool { return true; }

    // Business logic that should be in a service
    public function calculateLateFee(Order $order): Money { ... }

    // Side effect that should be in a transition
    public function sendReminder(Order $order): void { ... }
}
```
---
## Good Example
```php
class Pending extends OrderState
{
    public function transitionableStates(): array
    {
        return [Approved::class, Cancelled::class];
    }

    public function color(): string
    {
        return 'yellow';
    }

    public function canBeModified(): bool
    {
        return true;
    }
}
// Late fee calculation → PricingCalculator service
// Reminder sending → dedicated listener or job
```
---
## Exceptions
Small, tightly-scoped helper methods that directly relate to the state's nature (e.g., `color()`, `label()`, `canBeModified()`).
---
## Consequences Of Violation
Bloated state classes that are hard to maintain, business logic hidden inside state classes, and difficulty reusing logic across multiple states.

---

## Rule: Register the State Field Using StateCast in the Model's `$casts`
---
## Category
Framework Usage
---
## Rule
Always register the state column in the model's `$casts` array using the Spatie `StateCast` class, pointing to the base state class.
---
## Reason
Without `StateCast`, the state field is a raw database value (string) and has no behavior. The cast enables state objects, transition methods, and query scopes. Forgetting the cast means the entire state machine is non-functional.
---
## Bad Example
```php
class Order extends Model
{
    protected $casts = [
        'status' => 'string', // Wrong — state machine won't work
    ];
}
```
---
## Good Example
```php
use Spatie\ModelStates\Casts\StateCast;

class Order extends Model
{
    protected $casts = [
        'status' => StateCast::class . ':' . OrderState::class,
    ];
}
```
---
## Exceptions
No common exceptions. The `StateCast` registration is mandatory.
---
## Consequences Of Violation
`$order->status` returns a raw string with no state behavior, `$order->status->transitionTo()` throws a method-not-found error, and the state machine is effectively disabled.

---

## Rule: Use `transitionableStates()` for Validation, Not for UI Filtering
---
## Category
Design
---
## Rule
Rely on `transitionableStates()` as the single source of truth for transition validation. Do not duplicate transition rules in controllers, form requests, or frontend code.
---
## Reason
Duplicating transition rules creates drift — the frontend may allow a transition that `transitionableStates()` rejects, or vice versa. The state class is the authoritative source; all other layers should query it.
---
## Bad Example
```php
// Controller duplicates transition logic
class OrderController extends Controller
{
    public function approve(Order $order): JsonResponse
    {
        if ($order->status->label() !== 'Pending') {
            return response()->json(['error' => 'Only pending orders can be approved'], 422);
        }
        $order->status->transitionTo(Approved::class);
    }
}
```
---
## Good Example
```php
// Controller queries the state class for allowed transitions
class OrderController extends Controller
{
    public function approve(Order $order): JsonResponse
    {
        try {
            $order->status->transitionTo(Approved::class);
        } catch (InvalidTransition $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
```
---
## Exceptions
UI hints that query allowed transitions for display purposes (e.g., disabling buttons). Never for enforcement.
---
## Consequences Of Violation
Duplicate transition validation logic that drifts over time, inconsistent user experience (UI shows allowed but backend rejects), and increased maintenance burden.

---

## Rule: Test All Transitions with Actual Model Instances
---
## Category
Testing
---
## Rule
Write tests that create actual model instances in each state and verify every allowed and disallowed transition behavior, including Transition class side effects.
---
## Reason
State machine bugs manifest at the model level — only testing with real model instances (via factory) catches database cast issues, serialization problems, and transition guard integration failures that unit-testing state classes in isolation misses.
---
## Bad Example
```php
public function test_approved_state_allows_shipped(): void
{
    $state = new Approved(new Order());
    $allowed = $state->transitionableStates();

    $this->assertContains(Shipped::class, $allowed);
    // Doesn't test the actual transition with a persisted model
}
```
---
## Good Example
```php
public function test_order_can_transition_from_approved_to_shipped(): void
{
    $order = Order::factory()->create([
        'status' => Approved::class,
    ]);

    $order->status->transitionTo(Shipped::class);

    $this->assertInstanceOf(
        Shipped::class,
        $order->fresh()->status
    );
}

public function test_order_cannot_transition_from_approved_to_cancelled(): void
{
    $order = Order::factory()->create([
        'status' => Approved::class,
    ]);

    $this->expectException(InvalidTransition::class);

    $order->status->transitionTo(Cancelled::class);
}
```
---
## Exceptions
No common exceptions. Always test transitions with persisted model instances.
---
## Consequences Of Violation
Undiscovered cast or serialization bugs that only surface in production, transition failures that don't occur in isolated unit tests, and confidence gaps in state machine correctness.

---

## Rule: Group State Classes by Entity in Dedicated Namespaces
---
## Category
Code Organization
---
## Rule
Organize state classes into a namespace per entity: `App\States\{Entity}\*`. Keep transitions in `App\Transitions\{Entity}\*`.
---
## Reason
State classes for different entities (Order states, Payment states, User states) can have the same names (`Pending`, `Approved`). Per-entity namespaces prevent naming collisions and make it clear which entity a state belongs to.
---
## Bad Example
```
app/States/
  Pending.php      // Ambiguous — which entity?
  Approved.php     // Order payment? User approval?
  Cancelled.php
```
---
## Good Example
```
app/States/
  Order/
    OrderState.php
    Pending.php
    Approved.php
    Shipped.php
  Payment/
    PaymentState.php
    Pending.php
    Completed.php
    Failed.php
app/Transitions/
  Order/
    ApproveOrderTransition.php
  Payment/
    CompletePaymentTransition.php
```
---
## Exceptions
Applications with only one stateful entity — flat structure may suffice. Still, namespace proactively to anticipate growth.
---
## Consequences Of Violation
Naming collisions requiring awkward name disambiguation (`OrderPending`, `PaymentPending`), confusion about which entity a state class belongs to, and disorganized file structure.
