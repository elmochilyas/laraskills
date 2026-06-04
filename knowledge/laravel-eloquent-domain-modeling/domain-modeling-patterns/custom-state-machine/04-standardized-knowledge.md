# Custom State Machine

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Custom State Machine |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Not every state machine warrants a package. Building a custom state machine with PHP enums, array transition maps, and dedicated transition logic keeps the dependency footprint small and gives full control. This KU covers patterns for lightweight, testable, and expressive state machines directly in your Laravel application.

## Core Concepts

- **State Enum**: A PHP backed enum representing all possible states
- **Transition Map**: A data structure mapping each state to its allowed transitions
- **Transition Logic**: Code executed during a state change, separate from state representation
- **Transition Guard**: A precondition check that must pass for a transition to be allowed
- **State Machine Class**: A dedicated class encapsulating state configuration, validation, and execution

## When To Use

- The state machine is simple enough that a package would be overkill
- You want full control over the implementation
- You want zero external dependencies for state management
- The state machine is tightly coupled to your domain model

## When NOT To Use

- The state machine has complex requirements (multiple transitions with side effects) — use spatie/laravel-model-states
- You need persistence of transition history — use a package or event sourcing
- The state machine is shared across multiple models — consider a package for consistency

## Best Practices

- **Use backed enums for state identity**: Backed enums provide type-safe state identifiers that store cleanly in the database. Their `value` is the database column value.
- **Define transitions in a single map**: A visible array of `from => [allowed to states]` makes the entire machine auditable in one place.
- **Separate guards from transition logic**: Guards check preconditions; transition logic executes the change. This separation enables testing guards independently.

## Architecture Guidelines

- State enum in `App\Enums\`
- Transition map defined as a method on the enum or a dedicated enum method
- Guards are separate classes or methods, not inline in transition logic
- The model calls the state machine helper method for transitions

## Performance Considerations

- Custom state machines add zero overhead beyond the enum cast and guard checks
- Guard checks are typically fast (property comparisons, simple validations)

## Examples

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

class Order extends Model
{
    protected $casts = ['status' => OrderStatus::class];

    public function transitionTo(OrderStatus $newStatus): void
    {
        if (! in_array($newStatus, $this->status->allowedTransitions())) {
            throw new \DomainException("Cannot transition from {$this->status->value} to {$newStatus->value}");
        }
        $this->status = $newStatus;
        $this->save();
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | State Pattern Fundamentals |
| Closely Related | Transition Guards |
| Closely Related | Spatie Model States |
| Closely Related | Enum Casts |

## AI Agent Notes

- Use backed enums for state identity
- Define transitions in a single visible map
- Separate guards from transition logic

## Verification

- [ ] Backed enum represents all states
- [ ] Transition map is explicit and auditable
- [ ] Guards check preconditions before transitions
- [ ] State machine is tested with all valid and invalid transitions
