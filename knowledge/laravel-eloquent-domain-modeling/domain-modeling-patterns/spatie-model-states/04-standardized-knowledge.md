# Spatie Model States

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Spatie Model States |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

`spatie/laravel-model-states` is the dominant Laravel package for implementing state machines on Eloquent models. It formalizes states as dedicated PHP classes, auto-discovers allowed transitions, and provides a fluent API for transitioning and querying state. It integrates with Eloquent's custom cast system for transparent serialization.

## Core Concepts

- **State Class**: A PHP class extending `Spatie\ModelStates\State` representing one state
- **Transition Class**: Optional class extending `Spatie\ModelStates\Transition` defining transition logic
- **State Field**: An Eloquent cast that serializes/deserializes state objects to/from the database
- **Default State**: The state a model assumes when first created
- **Allowed Transitions**: Defined in the state class by overriding `transitionableStates()` or `publicTransitions()`

## When To Use

- You need a formal state machine with explicit transition validation
- You want state-specific behavior encapsulated in state classes
- You need transition lifecycle hooks (before/after transition actions)
- The state machine is complex enough to warrant a package rather than manual implementation

## When NOT To Use

- The state machine is simple (2-3 states) — an enum + switch is simpler
- You need full control over the implementation (use custom state machine)
- You don't want the package dependency

## Best Practices

- **Define transitions explicitly in each state class**: Override `transitionableStates()` to declare which states can be entered from this one. This makes the transition graph visible in each state file.
- **Use transition classes for side effects**: When a transition needs to perform actions beyond changing the state (logging, dispatching events, updating related records), create a dedicated Transition class.
- **Keep state classes focused on transition logic**: State classes should define allowed transitions and optionally state-specific query scopes. Complex business logic during transitions belongs in Transition classes or listeners.

## Architecture Guidelines

- State classes in `App\States\{Entity}\*` per domain entity
- Transitions in `App\Transitions\{Entity}\*`
- Register the state field in the model's `$casts` array using the package's `StateCast`
- Use `$model->state->transitionTo(NewState::class)` for transitions

## Performance Considerations

- State objects are resolved via the custom cast on each read
- Transition validation runs before execution — minimal overhead
- Complex transition classes with database operations should be transactional

## Examples

```php
class OrderState extends State
{
    abstract public function color(): string;
}

class Pending extends OrderState
{
    public function color(): string { return 'yellow'; }
    public function transitionableStates(): array
    {
        return [Approved::class, Cancelled::class];
    }
}

class Order extends Model
{
    protected $casts = ['status' => StateCast::class . ':' . OrderState::class];
}

$order->status->transitionTo(Approved::class);
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | State Pattern Fundamentals |
| Closely Related | Custom State Machine |
| Closely Related | Transition Guards |
| Advanced | Custom Casts Integration |

## AI Agent Notes

- Each state is a dedicated PHP class extending `State`
- Transitions are validated by `transitionableStates()`
- Use Transition classes for side effects

## Verification

- [ ] State classes extend `Spatie\ModelStates\State`
- [ ] `transitionableStates()` defines allowed transitions
- [ ] State field is registered with `StateCast` in `$casts`
- [ ] Transitions are tested with actual model instances
