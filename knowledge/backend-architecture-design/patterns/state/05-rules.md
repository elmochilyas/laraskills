## Rule 1: Encapsulate state-dependent behavior in State objects instead of conditionals
---
## Category
Architecture
---
## Rule
When an object's behavior changes based on its internal state, extract each state's behavior into a separate State class implementing a common interface.
---
## Reason
State-dependent conditionals scatter state logic and violate OCP—adding a new state requires modifying existing code.
---
## Bad Example
```php
class Order
{
    public function next(): void
    {
        match($this->status) {
            'pending' => $this->status = 'confirmed',
            'confirmed' => $this->status = 'shipped',
            'shipped' => $this->status = 'delivered',
        };
    }
}
```
---
## Good Example
```php
interface OrderState
{
    public function next(Order $order): void;
    public function cancel(Order $order): void;
}

class PendingState implements OrderState { /* ... */ }
class ConfirmedState implements OrderState { /* ... */ }
class ShippedState implements OrderState { /* ... */ }
```
---
## Exceptions
When the state machine is trivial (2 states, 1 transition) and unlikely to grow.
---
## Consequences Of Violation
Scattered state logic, OCP violation, large state-handling methods.
---
## Rule 2: State objects are stateless—state machine data stays in the context
---
## Category
Architecture
---
## Rule
State objects should not store the context's data; the context (e.g., `Order`) holds the data, and state objects receive it when executing behavior.
---
## Reason
Stateful state objects create concurrency issues and complicate state transitions.
---
## Bad Example
```php
class PendingState implements OrderState
{
    private Order $order; // holds reference to context
}
```
---
## Good Example
```php
class PendingState implements OrderState
{
    public function next(Order $order): void
    {
        // order is passed as parameter
        $order->transitionTo(new ConfirmedState());
    }
}
```
---
## Exceptions
When the state itself carries data that is specific to the state (e.g., `PendingApprovalState` holds the approver's identity).
---
## Consequences Of Violation
Concurrency issues, memory leaks, complex state management.
---
## Rule 3: State transitions should be explicit methods on the context
---
## Category
Architecture
---
## Rule
The context should provide explicit methods for state transitions (`next()`, `cancel()`, `approve()`) rather than generic `setState()`.
---
## Reason
Generic `setState()` allows invalid transitions; explicit methods enforce valid transition paths.
---
## Bad Example
```php
$order->setState(new ShippedState()); // bypasses validation
```
---
## Good Example
```php
$order->ship(); // internally validates and transitions
```
---
## Exceptions
When the state machine is data-driven and transitions are defined in configuration.
---
## Consequences Of Violation
Invalid transitions, state machine bypassed, inconsistent states.
---
## Rule 4: Initialize the context with a proper initial state
---
## Category
Architecture
---
## Rule
When creating a context object (e.g., `Order`), immediately set its initial state. Never leave the state null.
---
## Reason
Null state causes runtime errors and forces null checks throughout the code.
---
## Bad Example
```php
class Order
{
    private ?OrderState $state; // nullable — error-prone

    public function next(): void
    {
        if ($this->state === null) { return; } // defensive null check
        $this->state->next($this);
    }
}
```
---
## Good Example
```php
class Order
{
    private OrderState $state; // always set

    public function __construct()
    {
        $this->state = new PendingState();
    }
}
```
---
## Exceptions
When the initial state is determined by a factory parameter.
---
## Consequences Of Violation
Null state errors, defensive programming, hard-to-trace bugs.
