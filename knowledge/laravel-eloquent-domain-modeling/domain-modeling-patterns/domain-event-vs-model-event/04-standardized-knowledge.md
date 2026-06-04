# Domain Event vs Model Event

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Domain Event vs Model Event |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Laravel developers encounter two event systems: Eloquent model events (`saved`, `created`, `updated`) and domain events (`OrderPaid`, `SubscriptionCancelled`). Both can dispatch via Laravel's `Event` facade, but they serve fundamentally different purposes. Model events signal persistence activity; domain events signal business occurrences. Correct separation prevents domain logic from leaking into persistence concerns.

## Core Concepts

- **Model Event**: Fired by Eloquent when a model is saved, created, deleted — observes persistence lifecycle
- **Domain Event**: Represents something meaningful that happened in the domain, independent of persistence
- **Persistence Concern**: Model events track changes to database state ("a row was inserted")
- **Business Concern**: Domain events capture business occurrences ("an order was placed")
- **Naming Convention**: Model events are generic (`eloquent.saved: App\Models\Order`); domain events are specific (`OrderPlaced`)

## When To Use Model Events

- Cache invalidation after save
- Logging model changes for audit
- Updating denormalized counters (via saved/created)
- Synchronizing search indexes

## When To Use Domain Events

- Notifying other parts of the system about business occurrences
- Triggering cross-aggregate workflows (order placed → send notification → update inventory)
- Building read model projections
- Integrating with external systems via event-driven communication

## Best Practices

- **Model events for infrastructure, domain events for business**: Use model events for persistence-related side effects (cache, logging, search index). Use domain events for business-related reactions (notifications, workflows, projections).
- **Don't dispatch domain events from model event listeners**: Model events fire on every save, including irrelevant attribute changes. Domain events should fire explicitly from domain methods when the business occurrence actually happens.
- **Name domain events in past tense**: `OrderPlaced`, `PaymentReceived`, `SubscriptionCancelled`. Past tense signals the event has already happened and cannot be undone.

## Architecture Guidelines

- Model events are registered in `$dispatchesEvents` property or observers
- Domain events are dispatched from explicit domain method calls, not model event hooks
- Listeners for model events focus on infrastructure; listeners for domain events focus on business
- Domain events carry business-relevant payload (IDs, values), not model instances

## Performance Considerations

- Model events fire on every save — even on `touch()` calls — reducing performance for bulk operations
- Domain events fire only on explicit business operations
- Use `saveQuietly()` for bulk operations that don't need model event side effects

## Examples

```php
// Model event — infrastructure concern
class OrderObserver
{
    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}");
    }
}

// Domain event — business concern
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $customerId,
        public readonly Money $total,
    ) {}
}

class Order extends Model
{
    public function place(): void
    {
        $this->status = 'placed';
        $this->save();
        Event::dispatch(new OrderPlaced($this->id, $this->user_id, $this->total));
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Model Events |
| Prerequisite | Domain Methods on Models |
| Closely Related | Dispatching Domain Events |
| Closely Related | Event Projections |
| Advanced | Event Sourcing |

## AI Agent Notes

- Model events = persistence concerns; Domain events = business occurrences
- Dispatch domain events explicitly from domain methods, not model events
- Name domain events in past tense

## Verification

- [ ] Model events are used for infrastructure side effects only
- [ ] Domain events are dispatched explicitly from domain methods
- [ ] Domain events are named in past tense
- [ ] No business logic in model event listeners
