# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** async-event-mapping
**Generated:** 2026-06-03

---

# Decision Inventory

1. Mapping Strategy (Provider-Specific vs Generic)
2. Schema Versioning Strategy
3. Unknown Event Handling Strategy

---

# Architecture-Level Decision Trees

---

## Mapping Strategy

---

## Decision Context

Choosing between provider-specific mappers and a generic mapping layer.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the application receive webhooks from multiple providers?
↓
YES → Use per-provider mappers with a common domain event interface
  ↓
  Do providers send semantically similar events (payment.webhook vs charge.succeeded)?
  ↓
  YES → Map to shared domain events (PaymentReceived) from all providers
  NO → Keep provider-specific domain events; no cross-provider mapping
NO → Single provider with stable event schema?
  ↓
  YES → Direct mapping without abstraction layer is sufficient
  NO → Mapper provides provider-agnostic processing
  ↓
  Need to support future providers?
  ↓
  YES → Mapper interface from day one for extensibility
  NO → Direct mapping without abstraction

---

## Rationale

Per-provider mappers isolate provider-specific transformation logic. Shared domain events enable provider-agnostic processing when providers send similar events.

---

## Recommended Default

**Default:** Per-provider mapper classes with shared domain event interface for common events
**Reason:** Isolation for provider-specific logic; unified processing for shared event types

---

## Risks Of Wrong Choice

Single generic mapper becomes complex as provider count grows. No shared domain events duplicate processing logic across providers.

---

## Related Rules
Keep Mapping Stateless, Version Mapping Logic

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Schema Versioning Strategy

---

## Decision Context

Versioning event mapping logic for schema evolution.

---

## Decision Criteria

* maintainability
* reliability

---

## Decision Tree

Do provider event schemas change over time?
↓
YES → Version mapping logic independently from provider schema versions
  ↓
  Need to replay old events with updated mapping?
  ↓
  YES → Versioned mappers allow replay with new mapping logic
  NO → Single version; no replay of updated mapping
NO → Are domain events versioned for replay compatibility?
  ↓
  YES → Version both mappers and domain events together
  NO → Event versioning is still recommended for future changes
  ↓
  Multiple mapping versions active simultaneously?
  ↓
  YES → Route events to mapper version based on event timestamp
  NO → Single active mapper version; migrate all at once

---

## Rationale

Versioned mappers enable safe schema evolution — old events map with old logic, new events with new logic. This enables replay without breaking historical data.

---

## Recommended Default

**Default:** Versioned mappers aligned with domain event versions
**Reason:** Safe schema evolution; compatible replay; clear version lineage

---

## Risks Of Wrong Choice

Unversioned mappers break on provider schema changes. No replay compatibility means historical events can't be re-processed with fixed logic.

---

## Related Rules
Log Unmapped/Unknown Webhook Events

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Unknown Event Handling Strategy

---

## Decision Context

Handling webhook events that don't match any known mapping.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Is the event type recognized by any mapper?
↓
YES → Map and process normally
  ↓
  Is the mapped event type known to the processing logic?
  ↓
  YES → Normal processing pipeline
  NO → Log unknown mapped event for review and monitoring
NO → Log unmapped event type with full payload for analysis
  ↓
  Alert on unknown events?
  ↓
  YES → Alert immediately; unknown events may indicate provider schema change
  NO → Log only; review periodically
  ↓
  Need to process unknown events retroactively after mapper update?
  ↓
  YES → Store raw event; add mapper later; replay with new mapper
  NO → Unknown events are dropped; no retroactive processing

---

## Rationale

Unknown events should be stored and logged for analysis. Alerting on unknown events catches provider schema changes early. Raw event storage enables retroactive processing after mapper updates.

---

## Recommended Default

**Default:** Store unknown events; alert on unmapped event types; enable retroactive replay
**Reason:** Catches provider changes early; enables retroactive processing; full audit trail

---

## Risks Of Wrong Choice

Silently dropping unknown events misses important provider changes. No raw storage prevents retroactive processing. No alerting delays detection of schema changes.

---

## Related Rules
Validate Mapped Domain Events Before Dispatching

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks
