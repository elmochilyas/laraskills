# Dispatching Domain Events

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Dispatching Domain Events |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Domain events communicate business occurrences to other parts of the system. Dispatching domain events is a deliberate act — typically the final step of a domain method after all state changes are confirmed. This KU covers defining, dispatching, and testing domain events with Eloquent-based domain models.

## Core Concepts

- **Event Class**: A plain PHP class carrying data about what happened (aggregate root ID, changed values, timestamp)
- **Dispatch**: Sending an event to the Laravel event bus via `Event::dispatch()`
- **Payload**: Event data — typically identifiers and value objects, not model instances
- **Listener**: A class handling the event and performing side effects
- **ShouldQueue**: Marker interface telling Laravel to process the listener asynchronously
- **Recorded Events**: Pattern collecting events in an array during domain operations, dispatched after persistence

## When To Use

- A business operation needs to trigger side effects in other parts of the system
- You need to notify external systems about domain occurrences
- You want to decouple the domain operation from its side effects
- You need an audit trail of business occurrences

## When NOT To Use

- The side effect is tightly coupled and simple (inline call is clearer)
- The event would fire for every model change regardless of business significance
- The listener logic should be in the same transaction (use synchronous listener)

## Best Practices

- **Dispatch after persistence, not before**: Dispatch domain events after the transaction completes. Use `DB::afterCommit()` or dispatch in the event `__destruct` to ensure events only fire if the transaction succeeds.
- **Carry identity, not instances**: Pass the aggregate root's ID and relevant value objects in the event payload. Avoid passing Eloquent model instances — they may have changed by the time the listener processes the event (especially on queues).
- **Use recorded events pattern**: Collect events in an array during the domain operation, then flush them after the transaction commits. This ensures all events from a complex operation are dispatched atomically.

## Architecture Guidelines

- Event classes in `App\Events\Domain\*`
- Listeners in `App\Listeners\Domain\*`
- Register listeners in `EventServiceProvider`
- Use `ShouldQueue` for non-critical side effects (notifications, projections)

## Performance Considerations

- Synchronous listeners add time to the request
- Queue domain events for operations that don't need immediate reaction
- Serialization of events (for queuing) should avoid large payloads

## Security Considerations

- Events may contain sensitive data — ensure payload doesn't leak PII to logs or queues
- Authorization is the sender's responsibility, not the event's

## Examples

```php
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $customerId,
        public readonly int $totalCents,
    ) {}
}

class Order extends Model
{
    public function place(): void
    {
        $this->status = 'placed';
        $this->save();

        dispatch(new OrderPlaced(
            orderId: $this->id,
            customerId: $this->user_id,
            totalCents: $this->total_cents,
        ));
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Domain Event vs Model Event |
| Closely Related | Event Projections |
| Closely Related | Model Event Queue |
| Advanced | Event Sourcing |

## AI Agent Notes

- Dispatch after transaction commit using `DB::afterCommit()`
- Carry IDs and value objects, not model instances
- Use recorded events pattern for complex operations

## Verification

- [ ] Events are dispatched after transaction commits
- [ ] Event payload carries IDs and value objects, not model instances
- [ ] Events are named in past tense
- [ ] Listeners are registered in `EventServiceProvider`
