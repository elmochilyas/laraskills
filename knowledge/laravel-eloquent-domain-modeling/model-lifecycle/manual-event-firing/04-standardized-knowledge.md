# Manual Event Firing

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Manual Event Firing |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Manual event firing allows triggering model events outside of the normal persistence flow. The `fireModelEvent()` method and `Model::dispatchEvents()` provide control over when and how model events are dispatched. This is useful for testing, replaying events, or triggering side effects without model persistence.

## Core Concepts

- **fireModelEvent($event)**: Manually fires a model event on the instance — accepts event name string
- **Model::dispatchEvents()**: Dispatches all queued model events without performing a save
- **Model::withoutEvents()**: Suppresses events during a callable execution
- **Model::flushEventListeners()**: Removes all registered event listeners
- **Custom events**: Extend observable events via `$observables` property

## When To Use

- Firing events during testing without persisting the model
- Replaying model events for data recovery or audit
- Triggering side effects programmatically without saving

## When NOT To Use

- Normal persistence operations (events fire automatically)
- Domain events that should go through the Event facade (use explicit dispatch)

## Best Practices

- **Use `fireModelEvent()` for testing**: Trigger `created` event without actually creating a database record to test observer logic in isolation.
- **Use `$observables` for custom events**: Add custom event names to the `$observables` array and use `fireModelEvent()` to dispatch them alongside standard events.
- **Don't replace normal persistence with manual events**: Manual event firing is for special cases; standard `save()`/`delete()` methods fire events automatically.

## Examples

```php
class Order extends Model
{
    protected $observables = ['processing'];

    public function process(): void
    {
        $this->fireModelEvent('processing');
    }
}

// Test
$order = Order::factory()->make();
$order->fireModelEvent('created', false); // Fire created event without persisting
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Event Catalog |
| Closely Related | Event Control / Quiet Operations |
| Closely Related | Event Propagation |

## AI Agent Notes

- `fireModelEvent()` for testing observer logic without persistence
- `$observables` for custom model events
- Manual events supplement, not replace, automatic events

## Verification

- [ ] Manual events are not replacing normal persistence flows
- [ ] `$observables` used for custom event names
- [ ] Test coverage includes manual event firing scenarios
