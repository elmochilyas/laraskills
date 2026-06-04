# Dispatching Domain Events

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Domain events communicate business occurrences to other parts of the system. In Laravel, dispatching domain events is a deliberate act — typically the final line of a domain method. This KU covers how to define, dispatch, and test domain events in the context of Eloquent-based domain models, including best practices for payload design, queuing, and idempotency.

## Core Concepts
- **Event Class:** A plain PHP class (often implementing `ShouldBroadcast` or `ShouldDispatch`) carrying data about what happened.
- **Dispatch:** The act of sending an event to the Laravel event bus via `Event::dispatch()`.
- **Payload:** Data carried by the event — typically aggregate root ID, changed values, and a timestamp.
- **Listener:** A class that handles the event and performs side effects (notifications, projections, workflows).
- **ShouldQueue:** A marker interface that tells Laravel to process the listener on a queue.
- **Recorded Events:** A pattern where domain methods collect events in an array, dispatched later (flush pattern).

## Mental Models
- **"The Domain Method's Final Act":** Dispatching a domain event is the last thing a domain method does, after all state changes are confirmed.
- **"Fire and Forget (or Remember)":** Domain events are announcements. The dispatcher doesn't wait for a response. If the listener fails, the domain operation has already completed.
- **"Event as Receipt":** A domain event is a record that something happened. It should contain enough information for listeners to act without querying the source.

## Internal Mechanics
Dispatching in Laravel:
1. `Event::dispatch(new OrderPlaced($orderId, $total))` places the event on the Laravel event bus
2. Laravel resolves registered listeners from `EventServiceProvider`
3. For synchronous listeners, execution continues immediately
4. For `ShouldQueue` listeners, the event is serialized and sent to the queue
5. Serialization uses `SerializesModels` trait which stores the model's class and key, re-hydrating on the queue worker

The `Dispatchable` trait adds convenience: `OrderPlaced::dispatch($orderId)` instead of `Event::dispatch()`.

## Patterns
- **Dispatch at Method End:** Always dispatch domain events as the final operation in a domain method.
- **Transactional Dispatch:** Wrap mutation + dispatch in a `DB::transaction()` for atomicity.
- **Collected Events:** Buffer events and flush them after the transaction commits (post-commit dispatch).
- **Event with ID Only:** Pass only identifiers in payload; let listeners load needed data (avoids stale serialization).
- **Stamped Event:** Include metadata (timestamp, causer ID, correlation ID) in every event.
- **Conditional Dispatch:** Only dispatch events when state actually changes, not on no-op calls.

## Architectural Decisions
- Synchronous vs queued dispatch for each event type
- Whether to use `Dispatchable` trait or `Event::dispatch()` explicitly
- How to ensure transactional atomicity between mutation and dispatch
- Whether events carry full models or just identifiers
- How to handle event failures (compensating events, dead letter queues)

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouples domain mutations from side effects | Requires event listener infrastructure | Leverages existing Laravel queue system |
| Enables audit trail from events | Events may fail after mutation succeeds | Use transactional outbox pattern for critical events |
| Listeners can be added without modifying source | Serialization of model snapshots can be stale | Pass IDs not models in payload |
| Supports eventual consistency across aggregates | Increases system complexity | Worthwhile when consistency isn't strict |

## Performance Considerations
- Synchronous dispatch blocks the response. Queue slow listeners.
- `SerializesModels` re-queries the database on the queue worker — be aware of the extra query.
- For high-frequency events, batch dispatching reduces overhead.
- Event serialization is fast for simple payloads; avoid embedding large collections.
- In transactional dispatch, the event is held in memory until commit — many events may increase memory.

## Production Considerations
- Implement an event deduplication mechanism for at-least-once delivery guarantees.
- Use `ShouldBeUnique` or `ShouldBeUniqueUntilProcessing` to prevent duplicate event processing.
- Monitor queue backlogs for domain event listeners.
- Log dispatched events with correlation IDs for debugging distributed operations.
- Consider an event publishing table (transactional outbox) for events that must not be lost.

## Common Mistakes
- Dispatching events before the model is persisted (event fires on stale data)
- Including the entire model in event payload (serialization issues, stale data)
- Firing events in model `boot()` methods that trigger on every `save()`, not just meaningful transitions
- Not handling listener failures — if a listener fails and the exception is swallowed, side effects are lost
- Dispatching the same event from multiple call sites (controller, CLI command, API) instead of centralizing in the domain method

## Failure Modes
- **Lost Event:** Transaction commits but queue push fails. Mitigate with transactional outbox pattern.
- **Duplicate Event:** Retry logic causes the listener to process twice. Ensure listener idempotency.
- **Stale Data in Listener:** Listener loads model and sees different state than when event was dispatched. Use event timestamping or optimistic locking.
- **Event Order Violation:** Listeners expect events in a specific order (e.g., OrderPlaced before OrderPaid). Use sequence numbers or design for unordered processing.

## Ecosystem Usage
- `spatie/laravel-event-sourcing` uses domain events as storage primitives for event sourcing
- Laravel's built-in `Event` system is sufficient for most domain event needs
- `broadcast:events` and `reverb` for real-time domain event broadcasting
- Cloud services (SQS, SNS) for cross-service event publishing
- `laravel-notification` events for domain-triggered notifications

## Related Knowledge Units

### Prerequisites
- domain-event-vs-model-event — understanding the distinction between event types
- Laravel Event System — dispatching events and registering listeners
- Laravel Queues (ShouldQueue, SerializesModels) — async event processing

### Related Topics
- domain-event-vs-model-event
- aggregate-boundaries
- domain-methods-on-models

### Advanced Follow-up Topics
- event-projections
- bounded-contexts

## Research Notes
- Evans: *Domain-Driven Design* (2003) — domain events as aggregate boundary crossing mechanism
- Fowler: "Domain Event" pattern — events as full-fledged domain objects
- Vaughn Vernon: *Implementing Domain-Driven Design* — event publishing and handling
- Laravel docs: Events, Queues, SerializesModels
- Transactional outbox pattern: standard solution for reliable event publishing in distributed systems
