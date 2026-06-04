# ECC Standardized Knowledge — Async Event Mapping

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | event-sourcing-integrations |
| Knowledge Unit ID | ku-07 |
| Knowledge Unit | Async Event Mapping |
| Difficulty | Expert |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K034 |

## Overview (Engineering Value)
Async event mapping translates incoming webhook events (from external providers) into internal domain events, decoupling the provider's event schema from the application's domain model. This mapping layer enables provider-agnostic processing: the application handles `PaymentReceived` domain events regardless of whether they come from Stripe, Adyen, or Braintree webhooks. Event sourcing records both the raw webhook event and the mapped domain event, preserving the original payload for audit and enabling reprocessing with updated mapping logic.

## Core Concepts
- **Webhook Event**: Raw provider-specific event (e.g., Stripe `charge.succeeded`)
- **Domain Event**: Application-specific event (e.g., `PaymentReceived`)
- **Event Mapper**: Transformation layer converting webhook schema to domain schema
- **Mapping Projector**: Read model showing mapping statistics (success rate, unknown events per provider)
- **Schema Translation**: Field mapping, type conversion, enrichment, and validation during mapping
- **Versioned Mapping**: Mapping logic versioned alongside domain events for replay compatibility

## When To Use
- Multiple providers sending similar event types (payment webhooks from Stripe + Adyen)
- Complex webhook events requiring enrichment or transformation before processing
- Systems where provider changes should not affect domain processing logic
- Event sourcing workflows where raw and domain events are both needed for audit

## When NOT To Use
- Single provider with simple, stable event schemas
- Direct passthrough processing where webhook event IS the domain event

## Best Practices
- Keep mapping stateless: same input always produces same output (mapping is a pure function)
- Version mapping logic to handle schema evolution separately from provider API versions
- Log unmapped/unknown webhook events for monitoring provider changes
- Validate mapped domain events before dispatching to processors

## Architecture Guidelines
- Event mapper as a dedicated class per provider with interface for pluggability
- Mapped domain events stored in event store alongside raw events
- Projectors for mapping health metrics (success rate, unknown event rate)
- Reactors for alerting on unmapped event types
- Mapping configuration externalized (not hardcoded) for provider-schema changes

## Performance Considerations
- Mapping is CPU-bound: field transformation + validation ~0.1-1ms per event
- Event store writes: 2 writes per webhook (raw + mapped)
- Mapping projector updates per event for statistics
- Batch mapping for high-volume webhooks

## Related Topics
- **Prerequisites**: Domain events, event sourcing fundamentals, webhook schemas
- **Closely Related**: Webhook receiving (ku-01), inbox pattern (ku-05), CQRS
- **Advanced**: Schema registry, event versioning, multi-provider abstraction
- **Cross-Domain**: Domain-driven design, anti-corruption layer

## Verification
- [ ] Mapper correctly transforms provider schema to domain event
- [ ] Both raw and mapped events stored in event store
- [ ] Unknown/unmapped events logged and alerted
- [ ] Mapping logic is versioned for replay compatibility
- [ ] Mapper is stateless and testable with fixtures
