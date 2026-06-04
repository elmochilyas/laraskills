# ECC Standardized Knowledge — Event-Driven Architecture with Webhook Event Sourcing (CQRS/ES)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Event-Driven Architecture with Webhook Event Sourcing (CQRS/ES) |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K034, K011, K012, K018 |

## Overview (Engineering Value)
Event sourcing for webhooks applies CQRS and event sourcing patterns to webhook delivery: every delivery attempt is stored as an event, projectors maintain read-optimized delivery views, and reactors trigger post-delivery side effects. This provides complete auditability, replay capability for failed webhooks, and temporal querying. Spatie's laravel-event-sourcing provides the foundation, with webhook deliveries as domain events.

## Core Concepts
- **Event Store**: Append-only log of all delivery events (attempted, succeeded, failed, retried)
- **Projectors**: Read models building delivery status views from events
- **Reactors**: Side-effect handlers (notifications, retries, reconciliation)
- **CQRS**: Separate write model (event store) from read models (projections)
- **Replay**: Reprocess events through projectors to rebuild read models
- **Aggregate**: Each webhook call as an aggregate with lifecycle events

## When To Use
- High-reliability webhook delivery where audit and replay are critical
- Fintech and compliance-heavy applications with audit requirements
- Multi-step webhook workflows requiring delivery state tracking

## When NOT To Use
- Simple webhook delivery where audit trail suffices (Spatie webhook-server + logging)
- Low-volume webhooks where event sourcing overhead isn't justified
- Systems without requirements for temporal querying or replay

## Best Practices
- Record delivery attempt event BEFORE making HTTP call; response updates the event
- Use projectors for delivery status views, not direct event store queries
- Use reactors for cross-cutting concerns (notifications, reconciliation)
- Version events from day 1, even with only one version
- Test replay regularly to ensure projectors can rebuild from scratch

## Architecture Guidelines
- Event store in `stored_events` table with aggregate UUID and serialized payload
- Projectors implement `Projector` interface with handler methods per event
- Projectors track position in `projector_status` table
- Reactors for side effects separate from delivery logic
- Snapshots for long-running aggregates to speed up replay

## Performance Considerations
- Event store writes: ~5-15ms per event
- Projector updates: ~5-20ms per event
- Full replay: O(n) over all events
- Snapshot-driven replay: O(snapshots + events since last snapshot)
- Reactors execute synchronously; can be queued for async

## Security Considerations
- Event store is append-only; use database-level permissions to enforce
- Never store raw secrets (API keys, tokens) in event payloads
- Projectors must handle idempotency for safe replay
- Log all replay operations for audit trail of the audit trail
- Implement event store backup and restore procedures

## Common Mistakes
- Using event sourcing when simple audit log suffices (over-engineering)
- Not versioning events from the start (schema breaks existing projectors)
- Business logic in reactors instead of projectors
- Projectors dependent on external services (replay calls them thousands of times)
- Storing large webhook payloads in events (separate storage from metadata)

## Anti-Patterns
- Event sourcing for every webhook regardless of criticality
- Unversioned events (breaking changes on replay)
- Synchronous reactors blocking event processing
- No snapshot strategy for long-running aggregates

## Examples
```php
class WebhookDeliveryProjector extends Projector
{
    public function onWebhookDeliveryAttempted(WebhookDeliveryAttempted $event): void
    {
        WebhookDeliveryStatus::updateOrCreate(
            ['aggregate_uuid' => $event->aggregateUuid()],
            ['status' => 'pending', 'attempt' => $event->attempt]
        );
    }
}
```

## Related Topics
- **Prerequisites**: Spatie event-sourcing, CQRS fundamentals
- **Closely Related**: Webhook payload storage, event versioning
- **Advanced**: Temporal querying, snapshot strategies, event upcasting
- **Cross-Domain**: Event-driven architecture, DDD, CQRS

## AI Agent Notes
- Use event sourcing only for critical webhook delivery paths
- Generate projector classes for delivery status views
- Always version events from the initial implementation

## Verification
- [ ] Event store configured with appropriate storage backend
- [ ] Delivery events recorded for each lifecycle stage
- [ ] Projectors maintain current delivery status views
- [ ] Reactors handle side effects asynchronously
- [ ] Replay capability tested regularly
- [ ] Event versioning implemented from day 1
