# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** event-sourcing-cqrs
**Generated:** 2026-06-03

---

# Decision Inventory

1. Event Sourcing Adoption Strategy (Full ES vs Audit Log)
2. Projector vs Reactor Responsibility Split
3. Replay Strategy

---

# Architecture-Level Decision Trees

---

## Event Sourcing Adoption Strategy

---

## Decision Context

Choosing between full event sourcing and simple audit logging.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the webhook delivery require complete auditability and replay?
↓
YES → Consider full event sourcing with event store
  ↓
  Are there compliance requirements (PCI-DSS, SOC2) for audit trails?
  ↓
  YES → Event sourcing provides the required audit trail
  NO → Simple audit log in webhook_calls table may suffice
NO → Is temporal querying (state at any point in time) needed?
  ↓
  YES → Event sourcing is the right pattern
  NO → Standard webhook delivery tracking is sufficient
  ↓
  Multiple downstream consumers of same webhook events?
  ↓
  YES → Event sourcing enables multiple projectors/reactors per event
  NO → Single consumer; event sourcing overhead not justified

---

## Rationale

Event sourcing provides full auditability and replay at the cost of complexity. Simple audit logging is sufficient for most webhook delivery tracking without compliance requirements.

---

## Recommended Default

**Default:** Event sourcing for fintech/compliance webhooks; audit logging for standard webhooks
**Reason:** Match complexity to need — full ES where audit/replay critical, logging where not

---

## Risks Of Wrong Choice

Full event sourcing for simple webhooks adds unnecessary complexity and storage. Audit logging without replay capability prevents recovery from processing bugs.

---

## Related Rules
Record Delivery Attempt Event BEFORE Making HTTP Call

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Projector vs Reactor Responsibility Split

---

## Decision Context

Dividing read model building and side-effect handling.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the event need to update a read model (database view)?
↓
YES → Use projector for read model updates
  ↓
  Does the projector depend on external services?
  ↓
  YES → Avoid; projectors should be pure functions for replay safety
  NO → Projector is safe for replay
NO → Does the event need to trigger a side effect (notification, API call)?
  ↓
  YES → Use reactor for side effects
  NO → Event doesn't need either; store only
  ↓
  Need reactor to be async (queued)?
  ↓
  YES → Queue reactor for async execution; don't slow projection pipeline
  NO → Synchronous reactor is acceptable for fast side effects

---

## Rationale

Projectors build read models and must be replay-safe (no side effects). Reactors handle side effects and should be async to avoid slowing the projection pipeline.

---

## Recommended Default

**Default:** Projectors for read models (replay-safe); async reactors for side effects
**Reason:** Clean separation; replay-safe projections; non-blocking side effects

---

## Risks Of Wrong Choice

Side effects in projectors cause duplicate external calls on replay. Synchronous reactors slow the entire event processing pipeline.

---

## Related Rules
Use Projectors for Read Models, Not Direct Event Store Queries

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Replay Strategy

---

## Decision Context

Managing event replay to rebuild read models.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Need to rebuild read models from scratch (new projector, bug fix)?
↓
YES → Trigger full replay of all events through projectors
  ↓
  Are there many events (>1M)?
  ↓
  YES → Use snapshot-based replay to skip already-processed ranges
  NO → Full sequential replay is acceptable
NO → Need to replay only specific event types?
  ↓
  YES → Filter replay by event class; faster than full replay
  NO → Full replay from event store beginning
  ↓
  Test replay regularly?
  ↓
  YES → Scheduled replay test (QA/staging) ensures projectors work
  NO → Replay untested; may fail when needed most

---

## Rationale

Replay rebuilds read models from the event store. Snapshots speed up replay by skipping already-processed ranges. Regular replay testing ensures projectors work when recovery is needed.

---

## Recommended Default

**Default:** Snapshot-driven replay with quarterly replay tests in staging
**Reason:** Efficient rebuild; verified projector correctness; minimal downtime

---

## Risks Of Wrong Choice

No snapshots make replay O(n) and slow for large event stores. Untested replay fails when recovery is most critical. No replay capability means can't recover from projector bugs.

---

## Related Rules
Version Events from Day 1, Test Replay Regularly

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie
