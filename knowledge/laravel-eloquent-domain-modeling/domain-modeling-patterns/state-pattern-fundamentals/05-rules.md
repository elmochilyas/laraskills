# State Pattern Fundamentals — Rules

---

## Rule: Represent Each State as a Backed PHP Enum
---
## Category
Design
---
## Rule
Always model states as PHP backed enums (string or integer) with each state as a named case, mapped to the database column value.
---
## Reason
Backed enums provide type safety, native serialization through Eloquent's `enum` cast, and make all possible states discoverable through IDE autocompletion. Raw strings or integers allow invalid state values to be stored silently.
---
## Bad Example
```php
class Order extends Model
{
    protected $fillable = ['status'];
    // Any string can be assigned — no type safety
}
$order->status = 'invalid_status'; // Silently accepted
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
// $order->status = 'invalid_status' — type error!
```
---
## Exceptions
When using `spatie/laravel-model-states` which uses dedicated state classes instead of enums. The principle of typed representation still applies.
---
## Consequences Of Violation
Invalid states silently stored in the database, runtime errors when unexpected values are encountered, and inability to discover all possible states through static analysis.

---

## Rule: Make Invalid State Transitions Impossible at the Type Level
---
## Category
Design
---
## Rule
Design the state machine so that invalid state and transition combinations cannot be represented, not merely caught at runtime. Define allowed transitions explicitly and reject everything else.
---
## Reason
Type-level enforcement catches invalid transitions during development, not during production. Runtime-only validation depends on code paths being executed to discover bugs, which is unreliable.
---
## Bad Example
```php
public function transitionTo(string $newStatus): void
{
    // Runtime-only check — easy to forget or get wrong
    if ($this->status === 'delivered' && $newStatus === 'shipped') {
        throw new \DomainException('Cannot ship a delivered order');
    }
    $this->status = $newStatus;
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
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';

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
        throw new InvalidTransitionException($this->status, $newStatus);
    }
    $this->status = $newStatus;
    $this->save();
}
```
---
## Exceptions
When transition rules are dynamic and loaded from configuration at runtime. Prefer static definition whenever possible.
---
## Consequences Of Violation
Invalid state transitions corrupting production data, business rule violations that require manual database fixes, and security gaps if state transitions control access to features.

---

## Rule: Separate State Data from State Behavior
---
## Category
Architecture
---
## Rule
Keep the state identifier (enum value, stored in DB) separate from the transition logic that governs state changes. Do not mix them in a single monolithic class.
---
## Reason
State identifiers are data; transition logic is behavior. Mixing them creates tight coupling between storage format and business rules. Separation allows testing transition logic independently and changing storage without affecting behavior.
---
## Bad Example
```php
class Order extends Model
{
    // State data and transition logic mixed in one class
    public function markAsPaid(): void
    {
        if ($this->status !== 'pending') {
            throw new \Exception('Cannot pay');
        }
        $this->status = 'paid';
        $this->save();
    }

    public function markAsShipped(): void
    {
        if ($this->status !== 'paid') {
            throw new \Exception('Cannot ship');
        }
        $this->status = 'shipped';
        $this->save();
    }
}
```
---
## Good Example
```php
// State data is the enum
enum OrderStatus: string { ... }

// State behavior is in the enum's method
enum OrderStatus: string
{
    public function allowedTransitions(): array { ... }
}

// Or in a dedicated state machine class
class OrderStateMachine
{
    public function __construct(private Order $order) {}

    public function transitionTo(OrderStatus $newStatus): void { ... }
}
```
---
## Exceptions
Simple binary states (active/inactive) where the overhead of separation outweighs the benefit. Still, prefer separation even for simple cases.
---
## Consequences Of Violation
Difficulty changing storage format without rewriting business logic, inability to test transition rules without a database connection, and monolithic model classes that violate Single Responsibility.

---

## Rule: Define the Complete Transition Map in a Single Visible Location
---
## Category
Maintainability
---
## Rule
Consolidate all allowed state transitions into one explicit map — either on the enum as `allowedTransitions()` or in a dedicated state machine configuration class.
---
## Reason
A single transition map provides a complete, auditable picture of the state machine. Scattered transition rules across multiple methods or files make it impossible to verify correctness without reading the entire codebase.
---
## Bad Example
```php
class Order extends Model
{
    public function approve(): void
    {
        if ($this->status !== 'pending') throw ...;
        $this->status = 'approved';
        $this->save();
    }

    public function ship(): void
    {
        if ($this->status !== 'approved') throw ...;
        $this->status = 'shipped';
        $this->save();
    }

    public function deliver(): void
    {
        if ($this->status !== 'shipped') throw ...;
        $this->status = 'delivered';
        $this->save();
    }
    // Transitions are implicit — no single map to audit
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
// The entire state machine is visible in one method — 100% auditable
```
---
## Exceptions
No common exceptions. Always consolidate transitions into a single map.
---
## Consequences Of Violation
Undiscovered invalid transition paths, difficulty onboarding new developers who must hunt through code to understand allowed transitions, and increased regression risk when modifying transition rules.

---

## Rule: Use Eloquent's Enum Cast for the State Column
---
## Category
Framework Usage
---
## Rule
Always configure Eloquent's `enum` cast on the model attribute that stores the state value.
---
## Reason
The `enum` cast ensures the database value is always deserialized as the proper enum type, provides type-safe comparisons, and throws an error if an invalid value is encountered in the database.
---
## Bad Example
```php
class Order extends Model
{
    protected $fillable = ['status'];
    // No cast — status is a raw string
}

// Must manually convert every time:
$status = OrderStatus::tryFrom($order->status);
if ($status === null) { /* handle invalid value */ }
```
---
## Good Example
```php
class Order extends Model
{
    protected $casts = ['status' => OrderStatus::class];
}

// Status is always OrderStatus — type safe
if ($order->status === OrderStatus::Pending) { ... }
```
---
## Exceptions
When using `spatie/laravel-model-states` which requires its own `StateCast` instead of `enum`.
---
## Consequences Of Violation
Invalid database values causing runtime errors only when accessed, inconsistent type handling across the codebase, and verbose manual conversion code throughout the application.

---

## Rule: Test the Complete Transition Matrix
---
## Category
Testing
---
## Rule
Write tests that cover every valid state transition and every invalid transition attempt, using a data provider that iterates all `from → to` combinations.
---
## Reason
The state machine's correctness depends on every transition being either allowed or rejected correctly. Testing only happy paths misses edge cases where invalid transitions are accidentally permitted.
---
## Bad Example
```php
public function test_pending_can_transition_to_approved(): void
{
    $order = Order::factory()->pending()->create();
    $order->transitionTo(OrderStatus::Approved);
    $this->assertEquals(OrderStatus::Approved, $order->status);
    // Only one happy path tested
}
```
---
## Good Example
```php
#[DataProvider('transitionProvider')]
public function test_transition(OrderStatus $from, OrderStatus $to, bool $shouldSucceed): void
{
    $order = Order::factory()->create(['status' => $from]);

    if ($shouldSucceed) {
        $order->transitionTo($to);
        $this->assertEquals($to, $order->fresh()->status);
    } else {
        $this->expectException(InvalidTransitionException::class);
        $order->transitionTo($to);
    }
}

public static function transitionProvider(): array
{
    $cases = [];
    foreach (OrderStatus::cases() as $from) {
        foreach (OrderStatus::cases() as $to) {
            $cases["{$from->value} → {$to->value}"] = [
                $from, $to,
                in_array($to, $from->allowedTransitions()),
            ];
        }
    }
    return $cases;
}
```
---
## Exceptions
State machines with more than 10 states — test representative paths and critical boundary cases instead of the full Cartesian product.
---
## Consequences Of Violation
Undiscovered invalid transition paths reaching production, data corruption that requires expensive remediation, and business rule violations causing downstream errors.

---

## Rule: Apply Transition Guards at the State Machine Level, Not in Callers
---
## Category
Architecture
---
## Rule
Enforce all transition guards inside the state machine logic (on the enum, model method, or state machine class). Never check preconditions separately in controllers, actions, or other callers.
---
## Reason
Centralizing guard logic ensures every entry point — controllers, commands, queue jobs, tests — all enforce the same rules. Duplicating guards in callers creates drift where some paths bypass validation.
---
## Bad Example
```php
class OrderController extends Controller
{
    public function ship(Order $order): JsonResponse
    {
        // Guard logic duplicated in the controller
        if ($order->status !== 'approved') {
            return response()->json(['error' => 'Cannot ship'], 422);
        }
        if (! $order->shipping_address) {
            return response()->json(['error' => 'No address'], 422);
        }
        $order->transitionTo(OrderStatus::Shipped);
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function transitionTo(OrderStatus $newStatus): void
    {
        if (! in_array($newStatus, $this->status->allowedTransitions())) {
            throw new InvalidTransitionException($this->status, $newStatus);
        }
        if ($newStatus === OrderStatus::Shipped && ! $this->shipping_address) {
            throw new MissingShippingAddressException($this->id);
        }
        $this->status = $newStatus;
        $this->save();
    }
}

class OrderController extends Controller
{
    public function ship(Order $order): JsonResponse
    {
        try {
            $order->transitionTo(OrderStatus::Shipped);
        } catch (InvalidTransitionException|MissingShippingAddressException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }
    }
}
```
---
## Exceptions
Authorization guards (current user permissions) that are context-dependent. Business-rule and data-integrity guards always belong in the domain.
---
## Consequences Of Violation
Some entry points bypass guards, inconsistent enforcement across different codepaths, and business rule violations that are hard to reproduce because they depend on which caller invoked the transition.
