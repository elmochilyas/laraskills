# Domain Event vs Model Event

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Laravel developers encounter two event systems: Eloquent model events (`saved`, `created`, `updated`) and domain events (`OrderPaid`, `SubscriptionCancelled`). While both can dispatch via Laravel's `Event` facade, they serve fundamentally different purposes. Model events signal persistence activity; domain events signal business occurrences. This KU clarifies the distinction and provides guidance on when and how to use each.

## Core Concepts
- **Model Event:** Fired by Eloquent when a model is saved, created, deleted, etc. Observes persistence lifecycle.
- **Domain Event:** Represents something meaningful that happened in the domain, independent of persistence mechanism.
- **Persistence Concern:** Model events track changes to database state (e.g., "a row was inserted").
- **Business Concern:** Domain events capture business occurrences (e.g., "an order was placed").
- **Event Name Convention:** Model events are generic (`eloquent.saved: App\Models\Order`); domain events are specific (`OrderPlaced`).

## Mental Models
- **"Model Events = Plumbing, Domain Events = Story":** Model events are about the technical act of saving. Domain events are about the business narrative.
- **"Model Events Fire for Every Save, Domain Events Fire for Business Reasons":** A model event fires when any attribute changes; a domain event only fires when the business significance occurs.
- **"The What vs The Why":** Model events tell you *what* happened (something was saved). Domain events tell you *why* (an order was completed because payment succeeded).

## Internal Mechanics
Model events:
- Registered in `$dispatchesEvents` property, `boot()` method, or `Observers`
- Fired by `Model::save()`, `Model::delete()`, etc.
- Pass the model instance to listeners
- Can cancel persistence by returning `false` from `saving`/`deleting` listeners
- Fired inside the Eloquent query lifecycle

Domain events:
- Classes implementing `Illuminate\Contracts\Events\ShouldDispatch`
- Fired explicitly via `Event::dispatch(new OrderPaid($order))`
- No built-in persistence hooks; they are pure communication
- Can be queued with `ShouldQueue` on listeners
- Typically fired at the end of a domain method after successful state mutation

## Patterns
- **Model Events for Cross-Cutting Concerns:** Sync caches, update search indexes, log changes.
- **Domain Events for Business Side Effects:** Send notifications, trigger workflows, update projections.
- **Bridging Pattern:** A model event listener may create and dispatch a domain event (bridge between persistence and business).
- **Suppressing Model Events:** Use `Model::withoutEvents()` to prevent model events during bulk operations, then fire a single domain event manually.
- **Event Sourcing:** Domain events become the source of truth; model persistence is derived from the event stream.

## Architectural Decisions
- Whether to fire domain events from model event listeners or directly from domain methods
- Whether domain events should carry full model state or only identifiers
- Whether to use Laravel's built-in event system, a message bus, or a dedicated event sourcing store
- How to handle event failures — queue retry vs dead letter vs compensating events

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Model events are automatic, no explicit dispatch code | Fire on every attribute change, not just meaningful ones | Add guard conditions inside listeners |
| Domain events carry business meaning | Must be explicitly dispatched | Wrap in domain methods for consistency |
| Model events can cancel saves (return false) | Can cause subtle bugs if not expected | Use sparingly; prefer validation before save |
| Domain events are ideal for event sourcing | Requires infrastructure change (event store) | Start with simple dispatch; migrate if needed |

## Performance Considerations
- Model events add overhead to every `save()` call. For bulk inserts, use `Model::withoutEvents()`.
- Domain events dispatched synchronously increase response time. Queue listeners for slow side effects.
- Event listeners for model events should be fast (< 5ms) to avoid slowing persistence.
- Domain events should carry minimal data (IDs) and let listeners load what they need.

## Production Considerations
- Monitor event listener duration separately for model and domain events.
- Ensure idempotency in domain event listeners (events may be dispatched multiple times).
- Use `ShouldBeUnique` for domain event listeners that should only run once.
- Log both model and domain events with request correlation IDs for debugging.
- Model event listeners that fail silently can cause hard-to-trace data inconsistencies.

## Common Mistakes
- Treating model events as domain events and putting business logic in `saved` listeners
- Firing domain events from `created` hooks, causing events during non-domain operations (testing, seeding)
- Not distinguishing between "a record was updated" (model event) and "the critical field changed" (domain event)
- Over-relying on model events for cross-cutting concerns when a dedicated observer would be clearer
- Making domain event listeners non-queued when they perform slow operations

## Failure Modes
- **Event Cascade:** A model event triggers a domain event, which triggers a model event, creating infinite loops. Use `Model::withoutEvents()` guards or loop detection.
- **Duplicate Events:** A domain event is dispatched both from a domain method and from a model event listener. Dispatch in one place only.
- **Missing Domain Events:** Domain operations performed directly via `::update()` skip domain event dispatch. Enforce domain method usage.
- **Stale Model Events:** An observer is registered but not attached to the model, causing missed events. Test event firing in integration tests.

## Ecosystem Usage
- Laravel's core uses model events for its own features (e.g., `Authenticatable` login events)
- `spatie/laravel-event-sourcing` uses domain events as storage primitives
- `spatie/laravel-model-events` (separate package) enhances model event debugging
- Laravel Horizon / Telescope provide visibility into event dispatches
- OSS projects commonly mix both patterns; mature projects separate them clearly

## Related Knowledge Units

### Prerequisites
- Laravel Event System Basics — EventServiceProvider, event registration, and listeners
- Eloquent Model Lifecycle & Events — boot, saving, saved, creating, created hooks

### Related Topics
- dispatching-domain-events
- aggregate-boundaries
- domain-methods-on-models

### Advanced Follow-up Topics
- event-projections
- bounded-contexts

## Research Notes
- Evans: Domain Events chapter in *DDD* (2003) — events as first-class domain concepts
- Fowler: "Event Sourcing" and "Domain Event" patterns on martinfowler.com
- Laravel docs: Eloquent Events, Event System
- Community best practice: model events for infrastructure concerns, domain events for business concerns
- Growing trend toward explicit domain event dispatch in domain methods rather than relying on model hooks
