# Metadata
Domain: API Integration Engineering
Subdomain: Event Sourcing for Integrations
Knowledge Unit: Event-Driven Architecture with Webhook Event Sourcing (CQRS/ES)
Difficulty Level: Expert
Last Updated: 2026-06-02

## Executive Summary
Event sourcing for webhook integrations applies CQRS (Command Query Responsibility Segregation) and event sourcing patterns to webhook delivery: every delivery attempt is stored as an event in an event store, projectors maintain read-optimized delivery status views, and reactors trigger post-delivery side effects (notifications, retries, reconciliation). This pattern provides complete auditability, replay capability for failed webhooks, and temporal querying (state at any point in time). Spatie's laravel-event-sourcing package provides the foundation, with webhook deliveries as domain events.

## Core Concepts
- **Event Store**: Append-only log of all webhook delivery events (attempted, succeeded, failed, retried)
- **Projectors**: Read models that process events to build delivery status views (current state per webhook)
- **Reactors**: Side-effect handlers that react to events (send notifications, trigger compensation logic)
- **CQRS Separation**: Separate write model (event store) from read models (projections) for optimized query access
- **Event Versioning**: Schema versioning for webhook delivery events to handle evolving data structures
- **Replay**: Reprocess events through projectors to rebuild read models from scratch
- **Webhook as Aggregate**: Each webhook call is an aggregate with events describing its lifecycle

## Mental Models
- **Ledger and Reporting**: Event store is the financial ledger (append-only, immutable); projections are the reports derived from it
- **Movie Film**: Event store is the film reel; projectors are the projector playing frames (events) to show the current state
- **Audit Trail as Source of Truth**: The events are the truth; the current state is just a derived view

## Internal Mechanics
- `Spatie\LaravelEventSourcing` stores events in a `stored_events` table with event class, aggregate UUID, and serialized payload
- Webhook delivery events: `WebhookDeliveryAttempted`, `WebhookDeliverySucceeded`, `WebhookDeliveryFailed`, `WebhookDeliveryRetried`
- Projectors implement `Spatie\EventSourcing\Projectors\Projector` with event handler methods
- Projectors maintain a `projector_status` table tracking which events have been processed (position tracking)
- Reactors implement `Spatie\EventSourcing\Projectors\Reactors\Reactor` for side-effect handling
- Replay: reset projector position to 0, re-run all events through projector handlers
- Aggregate root (WebhookDelivery) records events and applies them to maintain current state

## Patterns
- **Event-First Delivery**: Record a delivery attempt event BEFORE making the HTTP call; HTTP response updates the event
- **Projector for Status View**: Maintain a `webhook_delivery_status` read model showing current delivery state per webhook
- **Reactor for Alerts**: Fire Slack/email notification when `WebhookDeliveryFinalFailed` event is recorded
- **Replay for Recovery**: After fixing subscriber endpoint, replay failed webhooks from the event store
- **Temporal Querying**: Query event store to see delivery state at any point in time (before/after retry)
- **Event Versioning**: Use `$event->version()` to handle schema changes in webhook payloads over time

## Architectural Decisions
- Use event sourcing for high-reliability webhook delivery where audit and replay are critical
- Use simpler pattern (Spatie webhook-server + audit table) for standard webhook delivery without CQRS overhead
- Store webhook delivery events in the same event store as domain events for unified auditability
- Use projectors to maintain delivery status views (avoid querying event store for current state)
- Use reactors for cross-cutting concerns (notifications, reconciliation) separate from delivery logic
- Version events from day 1, even if only one version exists initially (additive schema changes are easier)

## Tradeoffs
- Event sourcing adds significant complexity (event store, projectors, reactors, replay infrastructure)
- Append-only event store grows unbounded; implement cleanup policies (Snapshot, archival)
- Event replay can be slow for large event stores; use snapshots to reduce replay time
- CQRS introduces eventual consistency: read model may lag behind event store (milliseconds to seconds)
- Spatie's package is Laravel-specific; migrating away requires custom event store implementation

## Performance Considerations
- Event store writes: ~5-15ms per event (INSERT with JSON payload)
- Projector updates: ~5-20ms per event (read model update)
- Event store queries: fast for aggregate-based lookups (indexed by aggregate UUID)
- Full replay: O(n) over all events; snapshot-driven replay is O(snapshots + events since last snapshot)
- Reactors execute synchronously in the event processing pipeline (can be queued for asynchronous execution)

## Production Considerations
- Monitor event store growth and implement snapshot/snapshot strategy for long-running aggregates
- Set up event store pruning for old events (archive to cold storage after compliance period)
- Test replay regularly to ensure projectors can rebuild from scratch
- Monitor projector lag (difference between last event and last processed event)
- Implement dead letter queue for projector failures (events that can't be processed)
- Log all replay operations for audit trail of the audit trail

## Common Mistakes
- Using event sourcing when simple audit trail suffices (over-engineering)
- Not versioning events from the start (schema changes break existing projectors)
- Putting business logic in reactors that should be in projectors (reactors should handle side effects only)
- Making projectors dependent on external services (replay will call those services thousands of times)
- Not handling projector idempotency (multiple replays should produce same result)
- Storing large webhook payloads in event store events (separate payload storage from event metadata)

## Failure Modes
- Event store corruption: data integrity issue in `stored_events` table (restore from backup, partial replay)
- Projector failure during replay: an event that throws exception blocks the entire replay
- Reactor failure during event processing: side effect fails but event store write succeeded (inconsistent)
- Event version mismatch: projector can't handle older event versions (need event upcasters)
- Event store growth: unbounded storage consumption without snapshot/archive strategy

## Ecosystem Usage
- Spatie's laravel-event-sourcing is the standard event sourcing package for Laravel
- Spatie offers a dedicated course "Event Sourcing in Laravel" by Brent Roose
- Community practice: combine event sourcing with webhook delivery for fintech and compliance-heavy applications
- Webhook event sourcing is less common than simple audit logging; used primarily where replay capability is critical
- The CQRS/ES pattern is well-established in event-driven architectures; webhook delivery is a natural fit

## Related Knowledge Units
- K011: Spatie laravel-webhook-client (event-sourced webhook receipt)
- K012: Spatie laravel-webhook-server (event-sourced webhook delivery)
- K018: Webhook Payload Storage (predecessor to full event sourcing)
- K031-K037: Event Sourcing for Integrations (broader context)
- K034: Event-Driven Architecture with Webhook Event Sourcing (this document)

## Research Notes
- Domain analysis rates event sourcing for webhooks as "Emerging" with medium confidence
- Spatie's laravel-event-sourcing v7+ supports Laravel 10-13 with PHP 8.2+
- The Spatie course "Event Sourcing in Laravel" covers practical implementation patterns
- Webhook event sourcing enables "time travel debugging" for delivery issues
- Industry adoption is growing in fintech and regulated industries requiring complete audit trails
- Common pattern: keep event sourcing for critical delivery paths; simple logging for non-critical webhooks
