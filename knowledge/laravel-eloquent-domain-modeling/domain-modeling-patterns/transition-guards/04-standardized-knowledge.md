# Transition Guards

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Transition Guards |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Transition guards are precondition checks that must pass before a state transition is allowed. They enforce business rules, authorization policies, and data integrity constraints at the point of transition. Guards ensure that state changes only occur when all conditions are satisfied, preventing invalid domain state.

## Core Concepts

- **Guard**: A predicate returning true (allow) or false/throwing (deny) for a proposed transition
- **Precondition**: A condition that must be true before a transition executes
- **Authorization Guard**: Checks whether the current actor is permitted to perform the transition
- **Business Rule Guard**: Checks domain invariants (e.g., "order cannot ship before payment")
- **Data Integrity Guard**: Checks required data exists (e.g., shipping address must be present)
- **Composite Guard**: Multiple guards evaluated in sequence (all must pass)

## When To Use

- A transition has business rule prerequisites
- Authorization is required for specific state changes
- Data completeness must be verified before transitioning
- You want explicit documentation of transition requirements

## When NOT To Use

- The transition has no prerequisites (simple save)
- Guards duplicate validation already performed elsewhere
- The guard logic repeats for every transition (consider a model-level invariant)

## Best Practices

- **Fail fast, fail clearly**: Evaluate guards before the transition executes and throw specific, actionable exceptions. A generic "Transition not allowed" message forces developers to dig through logs.
- **One check per guard**: Each guard validates one condition. Composite guards combine multiple single-responsibility guards. This makes testing and debugging straightforward.
- **Guards are not transaction logic**: Guards only check preconditions. They should not modify state, dispatch events, or perform side effects.

## Architecture Guidelines

- Guards are separate invocable classes or methods
- Guards return void (throw on failure) or bool
- Composite guards iterate over an array of guards
- Guards are tested independently from transition logic

## Performance Considerations

- Guard checks are typically fast (property reads, simple comparisons)
- Expensive guards (database queries, external API calls) should be cached or batched
- Guards are evaluated before every transition — ensure they are efficient

## Examples

```php
class OrderCanBeShippedGuard
{
    public function __invoke(Order $order): void
    {
        if ($order->status !== OrderStatus::Approved) {
            throw new TransitionNotAllowedException('Only approved orders can be shipped.');
        }
        if (! $order->shipping_address) {
            throw new TransitionNotAllowedException('Shipping address is required.');
        }
        if ($order->items->isEmpty()) {
            throw new TransitionNotAllowedException('Cannot ship an empty order.');
        }
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | State Pattern Fundamentals |
| Closely Related | Custom State Machine |
| Closely Related | Spatie Model States |
| Closely Related | Domain Methods on Models |

## AI Agent Notes

- Guards check preconditions, not perform side effects
- Each guard validates one condition
- Throw specific, actionable exceptions on failure

## Verification

- [ ] Each guard validates one condition
- [ ] Guards do not modify state or perform side effects
- [ ] Guards throw specific exception types
- [ ] Guards are tested independently
