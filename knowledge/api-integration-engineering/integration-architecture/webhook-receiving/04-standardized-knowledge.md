# ECC Standardized Knowledge — Webhook Receiving (Event Sourcing)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Webhook Receiving |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K034, K011, K018 |

## Overview (Engineering Value)
Event-sourced webhook receiving applies CQRS/ES patterns to incoming webhook processing: each webhook delivery is recorded as an immutable event in an event store, projectors build read-optimized delivery status views, and reactors handle post-processing side effects. This provides complete auditability, replay capability for failed webhooks, temporal querying (state at any point), and resilience against processing failures. For high-reliability systems (fintech, healthcare), event-sourced webhook receiving is the most robust pattern.

## Core Concepts
- **Event Store**: Append-only log of webhook received events (received, valid, processing, processed, failed)
- **Webhook Receipt Event**: Immutable record of raw payload, headers, signature, and timestamp upon receipt
- **Projectors**: Read model processors that build delivery status views from the event stream
- **Reactors**: Side-effect handlers that trigger notifications, retries, or compensation on webhook events
- **Replay**: Reprocess all events through projectors to rebuild state from scratch

## When To Use
- Fintech and payment systems requiring complete audit trails
- Compliance-heavy environments (PCI-DSS, SOC2, GDPR)
- High-reliability systems where webhook replay capability is critical
- Multiple downstream consumers of the same webhook events

## When NOT To Use
- Simple webhook processing where basic audit storage suffices
- Low-volume webhooks where replay is unnecessary
- Prototypes or internal tools

## Best Practices
- Record receipt event BEFORE processing; guarantees the event is captured even if processing fails
- Store raw payload in the event; never modify after recording
- Use projectors for read models, not querying the event store directly
- Keep reactors async (queued) to avoid slowing the projection pipeline
- Version events from day one for schema evolution

## Architecture Guidelines
- Spatie's laravel-event-sourcing as the event store foundation
- Domain events: `WebhookReceived`, `WebhookSignatureValidated`, `WebhookProcessed`, `WebhookProcessingFailed`
- Projector per read model (delivery status, per-provider dashboard)
- Reactors for cross-cutting concerns (alerts, metrics, reconciliation)
- Separate event processing pipeline from HTTP receiving path

## Performance Considerations
- Event store write: ~5-15ms per event
- Projector update: ~5-20ms per event
- HTTP receipt completes in 10-50ms (no processing in request lifecycle)
- Full replay O(n) over all events; snapshot-driven for efficiency

## Related Topics
- **Prerequisites**: Event sourcing fundamentals, Spatie laravel-event-sourcing
- **Closely Related**: Webhook verification (ku-02), Inbox pattern (ku-05)
- **Advanced**: CQRS separation, event versioning, aggregate design
- **Cross-Domain**: Event-driven architecture, domain-driven design

## Verification
- [ ] Webhook receipt recorded as immutable event before processing
- [ ] Projectors build correct read models from event stream
- [ ] Replay produces identical state to original processing
- [ ] Events are versioned for schema evolution
