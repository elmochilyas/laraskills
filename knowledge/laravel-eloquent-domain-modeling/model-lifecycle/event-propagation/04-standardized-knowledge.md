# Event Propagation

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Event Propagation |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Event propagation in Eloquent determines whether model events continue to subsequent listeners or halt the operation. Returning `false` from a `*ing` (before) event listener prevents the database operation and stops further propagation. After-events (`*ed`) cannot halt. This is the primary control surface for aborting model operations from listeners.

## Core Concepts

- **Halting events**: Only `*ing` events (saving, creating, updating, deleting, trashing, restoring, forceDeleting) can halt by returning `false`
- **Non-halting events**: `*ed` events cannot halt; their return values are ignored
- **Propagation scope**: Halting stops both the event dispatch AND the database operation
- **True vs false vs null**: Only explicit `return false` halts; `null`, `true`, or no return continues

## When To Use

- Validating model state before persistence in an observer
- Authorizing delete/update operations based on business rules
- Preventing invalid state transitions

## When NOT To Use

- Returning false from events in a queued listener (unreliable — the listener may not execute)
- Using event halting as the primary validation mechanism (FormRequest and model methods are clearer)

## Best Practices

- **Be explicit with `return false`**: Implicit `return null` does NOT halt. Always use `return false` explicitly. A missing return statement allows the operation to proceed — this is a common bug source.
- **Document why you're halting**: Throw an exception or log the reason before returning false. Silent halts make debugging difficult.
- **Don't halt in `saved` events**: After-events cannot halt. If you need to abort after creation, use `creating` instead.

## Architecture Guidelines

- Halt in `*ing` events only
- Throw meaningful exceptions before returning false
- Use returning false sparingly — prefer explicit validation in model methods

## Examples

```php
class OrderObserver
{
    public function saving(Order $order): ?bool
    {
        if ($order->total_cents < 0) {
            Log::warning('Attempted to save order with negative total', ['order' => $order->id]);
            return false; // Aborts the save
        }
        return null; // Allows save to continue (or just don't return)
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Event Catalog |
| Closely Related | Event Dispatch Order |
| Closely Related | Event Control / Quiet Operations |
| Closely Related | Observer Pattern |

## AI Agent Notes

- Only `*ing` events can halt by returning `false`
- `null`, `true`, or no return = continue
- Throw/log before returning false for debugging

## Verification

- [ ] Only `*ing` events return false (halt)
- [ ] `*ed` events don't attempt to halt
- [ ] Meaningful error/log precedes `return false`
