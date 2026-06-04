# State Pattern Fundamentals

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | State Pattern Fundamentals |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

The State pattern models behavior as a finite set of states with defined transitions, encapsulating state-specific logic in separate classes. For Laravel developers, this is the theoretical foundation for packages like `spatie/laravel-model-states` and custom enum-based state machines. This KU covers the pure object-oriented state pattern and its application to Eloquent model lifecycle management.

## Core Concepts

- **State**: A distinct condition of an object during its lifecycle, represented as a first-class object
- **Transition**: A directed move from one state to another, triggered by an event or method call
- **Context**: The object whose behavior varies based on current state (the Eloquent model)
- **State-Specific Behavior**: Methods that behave differently depending on which state the context is in
- **Finite State Machine (FSM)**: A model with a finite number of states and well-defined transitions

## When To Use

- An object's behavior changes significantly based on its current state
- There are well-defined, constrained state transitions
- The same transition logic is needed in multiple places
- You need explicit documentation of allowed state transitions

## When NOT To Use

- The state space is small (2-3 states) with simple transitions (use enum + if statements)
- States don't affect behavior — only data filtering
- The transition logic changes with every business rule update

## Best Practices

- **Make invalid states unrepresentable**: Define only valid states and transitions. If a state/transition combination is invalid, it should be impossible to reach through the type system, not just caught at runtime.
- **Separate state data from state behavior**: The state identifier (enum, string) is data; the transition logic is behavior. Keep them separate for testability and flexibility.
- **Explicit transition map**: A visible array of `from => [allowed to states]` is easier to audit than implicit transitions. Document every possible path.

## Architecture Guidelines

- Store state as a database column (string or integer backed enum)
- Use Eloquent's `enum` cast for the state column
- State-specific behavior can be in switch statements, strategy pattern, or state classes
- Transaction guards validate preconditions before transitions

## Performance Considerations

- State resolution (converting DB value to state object) adds minimal overhead
- State classes are typically short-lived — one per state transition
- Complex transition guards may add validation overhead for frequent transitions

## Examples

```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Shipped = 'shipped';
    case Delivered = 'delivered';

    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Approved, self::Cancelled],
            self::Approved => [self::Shipped],
            self::Shipped => [self::Delivered],
            self::Delivered => [],
        };
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Enum Casts |
| Prerequisite | Domain Methods on Models |
| Closely Related | Spatie Model States |
| Closely Related | Custom State Machine |
| Closely Related | Transition Guards |

## AI Agent Notes

- States are distinct conditions with defined transitions
- Make invalid states unrepresentable
- Separate state data (enum) from transition behavior (logic)

## Verification

- [ ] States are represented as backed enums
- [ ] Allowed transitions are explicitly defined
- [ ] Invalid state combinations cannot be created
- [ ] Transition guards enforce preconditions
