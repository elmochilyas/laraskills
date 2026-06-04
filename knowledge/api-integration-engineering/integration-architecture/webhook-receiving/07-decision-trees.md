# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** webhook-receiving
**Generated:** 2026-06-03

---

# Decision Inventory

1. Receiving Architecture (Event Sourcing vs Standard)
2. Event Store Strategy (Which Events to Record)
3. Projection Strategy (Read Model Design)

---

# Architecture-Level Decision Trees

---

## Receiving Architecture

---

## Decision Context

Choosing between event-sourced and standard webhook receiving.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the webhook processing need complete auditability and replay?
↓
YES → Use event-sourced webhook receiving with event store
  ↓
  Are there compliance requirements (PCI-DSS, SOC2)?
  ↓
  YES → Event sourcing provides required immutable audit trail
  NO → Standard Spatie webhook-client may suffice
NO → Is the webhook high-reliability (fintech, healthcare)?
  ↓
  YES → Event sourcing enables replay on processing failures
  NO → Standard receiving with table storage is sufficient
  ↓
  Multiple downstream consumers of the same event?
  ↓
  YES → Event sourcing enables multiple projectors from one event stream
  NO → Single consumer; event sourcing overhead may not be justified

---

## Rationale

Event-sourced receiving provides the highest reliability with complete audit and replay capability. Standard receiving is simpler and sufficient for most applications without compliance requirements.

---

## Recommended Default

**Default:** Event-sourced receiving for fintech/compliance; standard for general applications
**Reason:** Match reliability to requirements; avoid over-engineering

---

## Risks Of Wrong Choice

Event sourcing for simple webhooks adds unnecessary complexity and storage. Standard receiving for compliance-heavy applications fails audit requirements.

---

## Related Rules
Record Receipt Event BEFORE Processing

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Event Store Strategy

---

## Decision Context

Determining which webhook lifecycle events to record in the event store.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Should every webhook lifecycle phase be recorded?
↓
YES → Record events: Received → Validated → Processed → Failed
  ↓
  Need separate events for verification outcomes?
  ↓
  YES → Record WebhookSignatureValidated / Invalid as separate events
  NO → Combine validation status in the WebhookReceived event
NO → Record only terminal events (Processed, Failed)?
  ↓
  YES → Minimal event stream; no intermediate state tracking
  NO → Record Received + Processed/Failed for basic lifecycle
  ↓
  Store raw payload in the receipt event?
  ↓
  YES → Full payload in event store for replay capability
  NO → Payload stored separately; event store has metadata only

---

## Rationale

Full lifecycle recording provides the richest audit trail and replay capability. Minimal recording reduces storage but limits debugging and replay options.

---

## Recommended Default

**Default:** Full lifecycle events (Received → Validated → Processed/Failed) with raw payload
**Reason:** Maximum audit capability; complete replay; debug visibility

---

## Risks Of Wrong Choice

No intermediate events make it impossible to know where processing stalled. No raw payload in events prevents reprocessing. Minimal events limit forensic analysis.

---

## Related Rules
Store Raw Payload in the Event, Use Projectors for Read Models

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Projection Strategy

---

## Decision Context

Designing read models from the webhook event stream.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Need a delivery status dashboard per provider?
↓
YES → Build projector that reads events and updates delivery status table
  ↓
  Need per-provider failure rate telemetry?
  ↓
  YES → Separate projector for provider-level metrics
  NO → Single aggregated delivery status projector
NO → Need per-webhook detailed status?
  ↓
  YES → Projector with per-webhook status including retry history
  NO → Query event store directly for single webhook status
  ↓
  Projectors must be replay-safe (no side effects)?
  ↓
  YES → Pure function projectors: read events, update read models
  NO → Side effects in projectors cause replay duplicates

---

## Rationale

Projectors build read-optimized views from the event stream. Per-provider metrics projectors enable independent monitoring. Replay-safe projectors prevent duplicate side effects on replay.

---

## Recommended Default

**Default:** Delivery status projector + per-provider metrics projector; both replay-safe
**Reason:** Read-optimized views; per-provider monitoring; safe replay

---

## Risks Of Wrong Choice

Direct event store queries for delivery status are slow for dashboards. Side effects in projectors cause duplicate notifications on replay. No metrics projector hides per-provider degradation.

---

## Related Rules
Keep Reactors Async (Queued)

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie
