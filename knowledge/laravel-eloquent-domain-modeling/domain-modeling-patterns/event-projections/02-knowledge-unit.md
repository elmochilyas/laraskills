# Event Projections

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Event projections build and maintain read-optimized data structures from domain events. Instead of querying the primary domain model (which may be normalized for writes), projections aggregate event data into denormalized read models tailored for specific use cases. This KU covers projection patterns within Laravel, whether using event sourcing or simply using domain events to update read tables.

## Core Concepts
- **Projection:** A read-only data structure derived from processing domain events, often stored in a dedicated database table.
- **Projector:** A listener class that receives domain events and updates the projection.
- **Read Model:** The projection's output — a table or data structure optimized for querying (not for writes).
- **Replay:** Re-processing all historical domain events to rebuild a projection from scratch.
- **Async Projection:** A projector that processes events asynchronously via a queue, trading immediacy for scalability.
- **Sync Projection:** A projector that updates in real-time within the same transaction/request as the event.

## Mental Models
- **"Projections are Pre-computed Views":** Like database materialized views, projections pre-compute query results so reads are fast and simple.
- **"Event as Source of Truth, Projection as Cache":** The domain events are the definitive record; projections are derived, disposable, and rebuildable.
- **"Write-Optimized vs Read-Optimized":** Your domain model is optimized for enforcing invariants (writes). Projections are optimized for display and reporting (reads).

## Internal Mechanics
A projector listens to domain events and updates a read model table:

```
OrderPlaced → OrderProjector → upserts order_summaries table row
OrderPaid   → OrderProjector → updates status and paid_at on order_summaries
```

Projection tables are typically:
- Denormalized (duplicate data from multiple sources)
- Indexed for the specific queries they serve
- Not constrained by referential integrity (they're derived data)
- Append-only if event-sourced; mutable updates otherwise

Replay works by:
1. Truncating the projection table
2. Re-processing all relevant events in order
3. Each projector re-applies its logic to rebuild the read model

## Patterns
- **Single Projector per Read Model:** One projector class maintains one projection table.
- **Projection from Multiple Event Types:** A single projector handles multiple event types (e.g., OrderPlaced + OrderPaid + OrderShipped).
- **Idempotent Upsert:** Use `updateOrCreate()` or `updateOrInsert()` so replay doesn't duplicate.
- **Offset Tracking:** Store the last processed event ID in a `projector_statuses` table for resume capability.
- **Separate Database Connection:** Projection databases may be read replicas or dedicated reporting databases.
- **Snapshot Projections:** Periodically store full aggregate state as a projection snapshot for fast rebuilds.

## Architectural Decisions
- Sync vs async projection for each read model
- Whether to use event sourcing or just project from dispatched domain events
- How to handle projection rebuilds (automated via command, triggered by deploy)
- Whether projections live in the same database or a separate read store
- How to version projections when event schemas evolve

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Read queries are simple and fast | Additional storage for projection tables | Acceptable tradeoff for query performance |
| Decouples read concerns from write model | Projection may lag behind source of truth | Async lag is seconds; acceptable for many UIs |
| Projections can be rebuilt from events | Replay logic must be maintained and tested | Write idempotent projectors with integration tests |
| Enables CQRS separation | Operational complexity of multiple data stores | Start with same-database projections |

## Performance Considerations
- Projection updates add write load. For high-traffic events, batch updates in the projector.
- Index projection columns for the queries they serve (but minimize indexes on high-write tables).
- Async projections reduce request-time latency but introduce staleness.
- Replay performance depends on projector efficiency; test with production-scale event volumes.
- Consider partitioning projection tables by date for large datasets.

## Production Considerations
- Monitor projection lag (time between event dispatch and projection update) with metrics.
- Implement a health check that verifies projection data matches source data periodically.
- Have a `projector:rebuild` Artisan command that truncates and replays all events.
- Version projection schemas to handle migrations gracefully.
- Alert on projection rebuild failures — if a projector crashes, the data becomes stale until fixed.

## Common Mistakes
- Making projections writable by the application (they should only be updated by projectors)
- Using projections as the source of truth (events are the source of truth)
- Building projections that exactly mirror the write model (wasted storage; just query the source)
- Not handling event idempotency, causing duplicate rows on replay
- Putting business logic in projectors (they should only transform data for reads)

## Failure Modes
- **Stale Projection:** A projector fails silently, leaving the read model outdated. Monitor projector execution.
- **Projection Drift:** Data inconsistency between projection and source events due to a bug. Fix the projector and replay.
- **Event Ordering Violation:** Events arrive out of order, causing incorrect projection state. Use sequence numbers.
- **Replay Downtime:** Rebuilding a large projection takes too long, causing read unavailability. Use swap-table strategy (build new table, rename).

## Ecosystem Usage
- `spatie/laravel-event-sourcing` provides built-in projector support
- `beyondcode/laravel-projectionist` (legacy) offered CQRS/ES projections
- Laravel apps often implement simple projections with event listeners and `updateOrCreate`
- Reporting packages (Laravel Reporting, Laravel Charts) often work best with projection tables
- Common in e-commerce: `order_summaries`, `customer_analytics`, `dashboard_metrics` projections

## Related Knowledge Units

### Prerequisites
- dispatching-domain-events — how domain events are dispatched to projectors
- Eloquent Query Builder & Upserts — updateOrCreate, updateOrInsert patterns
- Read Model Design Concepts — denormalization and CQRS fundamentals

### Related Topics
- dispatching-domain-events
- domain-event-vs-model-event
- bounded-contexts

### Advanced Follow-up Topics
- aggregate-boundaries
- aggregate-roots

## Research Notes
- Fowler: "CQRS" and "Event Sourcing" patterns on martinfowler.com
- Greg Young: CQRS/ES pioneer — projections as read models
- `spatie/laravel-event-sourcing` docs: Projector and Projectionist concepts
- Laravel community: projections often implemented ad-hoc before adopting formal event sourcing
- Common pattern: API returns data from projections while commands write to domain models
