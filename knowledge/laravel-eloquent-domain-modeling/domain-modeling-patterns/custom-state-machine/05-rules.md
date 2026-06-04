# Custom State Machine — Rules

---

## Rule: Use PHP Backed Enums for State Representation
---
## Category
Design
---
## Rule
Always represent each state as a case in a PHP backed enum with a string or integer value that matches the database column value.
---
## Reason
Backed enums provide type safety, serialize cleanly via Eloquent's `enum` cast, and prevent invalid string values from being assigned to the state column. Raw strings or integers without enum types allow any value to be stored.
---
## Bad Example
```php
class Order extends Model
{
    // Status stored as arbitrary string — any value is accepted
    protected $fillable = ['status'];
}
```
---
## Good Example
```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}

class Order extends Model
{
    protected $casts = ['status' => OrderStatus::class];
}
```
---
## Exceptions
When the state machine must support dynamic states defined at runtime (extremely rare). Use a dedicated state machine package in that case.
---
## Consequences Of Violation
Invalid state values silently stored in the database, causing unexpected behavior in state-dependent logic and requiring runtime validation for every state read.

---

## Rule: Define All Transitions in a Single Visible Map
---
## Category
Maintainability
---
## Rule
Expose an `allowedTransitions()` method on the state enum or a dedicated state machine class that returns a complete `from => [to states]` mapping for every state.
---
## Reason
A single transition map makes the entire state machine auditable at a glance. Scattered transition logic across multiple files or methods makes it impossible to verify correctness without reading the entire codebase.
---
## Bad Example
```php
// Transitions are scattered — no single source of truth
public function approve(): void
{
    if ($this->status !== 'pending') throw new \Exception();
    $this->status = 'approved';
    $this->save();
}

public function ship(): void
{
    if ($this->status !== 'approved') throw new \Exception();
    $this->status = 'shipped';
    $this->save();
}
```
---
## Good Example
```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Shipped = 'shipped';

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Approved, self::Cancelled],
            self::Approved => [self::Shipped],
            self::Shipped => [self::Delivered],
            self::Delivered => [],
            self::Cancelled => [],
        };
    }
}

public function transitionTo(OrderStatus $newStatus): void
{
    if (! in_array($newStatus, $this->status->allowedTransitions())) {
        throw new \DomainException("Cannot transition from {$this->status->value} to {$newStatus->value}");
    }
    $this->status = $newStatus;
    $this->save();
}
```
---
## Exceptions
Extremely simple binary states (active/inactive) where an enum with two cases and a single guard is clearer.
---
## Consequences Of Violation
Transition bugs where invalid state changes are allowed, requiring runtime discovery instead of compile-time or static analysis detection.

---

## Rule: Separate Guard Conditions from Transition Execution Logic
---
## Category
Maintainability
---
## Rule
Extract precondition checks (guards) into separate methods or classes, distinct from the code that performs the state change and persistence.
---
## Reason
Combining guards and execution logic makes it impossible to test preconditions independently, violates Single Responsibility, and makes the transition method harder to understand.
---
## Bad Example
```php
public function transitionTo(OrderStatus $newStatus): void
{
    if (! $this->isVerified()) {
        throw new \DomainException('Customer not verified.');
    }
    if ($this->hasOutstandingBalance()) {
        throw new \DomainException('Outstanding balance.');
    }
    if (! in_array($newStatus, $this->status->allowedTransitions())) {
        throw new \DomainException('Invalid transition.');
    }
    // Guard logic mixed with transition logic
    $this->status = $newStatus;
    $this->save();
    Log::info("Transitioned to {$newStatus->value}");
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
    if (! $this->isVerified()) {
        throw new CustomerNotVerifiedException();
    }
    if ($this->hasOutstandingBalance()) {
        throw new OutstandingBalanceException();
    }
    if (! in_array($newStatus, $this->status->allowedTransitions())) {
        throw new InvalidTransitionException($this->status, $newStatus);
    }
}
```
---
## Exceptions
No common exceptions. Guards and execution must remain separable for testability.
---
## Consequences Of Violation
Inability to unit-test guards independently, bloated transition methods, and difficulty reasoning about which precondition failed when a transition is denied.

---

## Rule: Throw Domain-Specific Exceptions on Invalid Transitions
---
## Category
Maintainability
---
## Rule
Create and throw distinct exception classes for each type of transition failure instead of using a generic `\DomainException` or `\InvalidArgumentException`.
---
## Reason
Generic exceptions force callers to parse error messages to determine the failure reason. Specific exception types allow callers to catch and handle each failure mode independently and enable automated testing.
---
## Bad Example
```php
throw new \DomainException('Cannot transition from pending to shipped');
// Callers must string-match to handle different failure types
```
---
## Good Example
```php
throw new InvalidTransitionException(OrderStatus::Pending, OrderStatus::Shipped);
// Or:
throw new OrderAlreadyShippedException($this->id);
// Callers can catch specific types
```
---
## Exceptions
No common exceptions. Always use typed exceptions for transition failures.
---
## Consequences Of Violation
Brittle error handling that relies on message parsing, poor developer experience when debugging, and tests that cannot assert on specific failure modes.

---

## Rule: Keep State Machine Logic Out of Controllers and Actions
---
## Category
Code Organization
---
## Rule
Encapsulate all state transition logic — validation, guards, and execution — within the model or a dedicated state machine class. Never write status checks or transitions in controllers.
---
## Reason
Repeating transition logic in controllers duplicates business rules across every HTTP endpoint, making changes error-prone and bypassing the model's invariant enforcement.
---
## Bad Example
```php
class OrderController extends Controller
{
    public function approve(Order $order): JsonResponse
    {
        // Transition logic in controller
        if ($order->status !== 'pending') {
            return response()->json(['error' => 'Invalid status'], 422);
        }
        $order->status = 'approved';
        $order->save();

        return response()->json($order);
    }
}
```
---
## Good Example
```php
class OrderController extends Controller
{
    public function approve(Order $order): JsonResponse
    {
        $order->transitionTo(OrderStatus::Approved);

        return response()->json($order);
    }
}
```
---
## Exceptions
No common exceptions. All transition logic belongs in the domain layer (model or state machine class).
---
## Consequences Of Violation
Business logic scattered across controllers, duplicated transition guards, and domain rules that are untestable without HTTP integration tests.

---

## Rule: Test Every Valid and Invalid Transition Path
---
## Category
Testing
---
## Rule
Write tests that verify every allowed transition succeeds and every disallowed transition throws the appropriate exception, covering the full transition matrix.
---
## Reason
An untested state machine is a source of silent bugs. Missing a single invalid transition path can lead to production data in an illegal state, which is expensive to remediate.
---
## Bad Example
```php
public function test_order_can_be_approved(): void
{
    $order = Order::factory()->create(['status' => OrderStatus::Pending]);
    $order->transitionTo(OrderStatus::Approved);

    $this->assertEquals(OrderStatus::Approved, $order->status);
    // Only happy path tested — invalid paths are not verified
}
```
---
## Good Example
```php
public function test_allowed_transitions(): void
{
    foreach (OrderStatus::cases() as $from) {
        foreach (OrderStatus::cases() as $to) {
            $order = Order::factory()->create(['status' => $from]);

            if (in_array($to, $from->allowedTransitions())) {
                $order->transitionTo($to);
                $this->assertEquals($to, $order->fresh()->status);
            } else {
                $this->expectException(InvalidTransitionException::class);
                $order->transitionTo($to);
            }
        }
    }
}
```
---
## Exceptions
State machines with a very large number of states — test representative paths and boundary cases instead of the full matrix.
---
## Consequences Of Violation
Undiscovered invalid transition paths corrupting production data, requiring manual database fixes and root-cause analysis after business impact.

---

## Rule: Cast the State Column Using Eloquent's Enum or Custom Cast
---
## Category
Framework Usage
---
## Rule
Always register the state column with an Eloquent cast in the model's `$casts` property to ensure it is always deserialized as the enum type.
---
## Reason
Without a cast, the state column is a raw string at all times. Callers must manually convert to the enum type before any comparison or transition, creating opportunities for type errors and inconsistent state handling.
---
## Bad Example
```php
class Order extends Model
{
    // No cast — status is always a string
    protected $fillable = ['status'];
}

// Callers must manually convert every time:
$status = OrderStatus::from($order->status);
```
---
## Good Example
```php
class Order extends Model
{
    protected $casts = ['status' => OrderStatus::class];
}

// Status is always OrderStatus enum:
if ($order->status === OrderStatus::Pending) { ... }
```
---
## Exceptions
No common exceptions. Always cast state columns.
---
## Consequences Of Violation
Inconsistent handling of state values, runtime errors from invalid enum values, and verbose code that repeatedly converts between strings and enums.
