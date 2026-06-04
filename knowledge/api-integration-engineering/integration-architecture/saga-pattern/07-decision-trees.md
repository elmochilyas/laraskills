# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** saga-pattern
**Generated:** 2026-06-03

---

# Decision Inventory

1. Saga Coordination Strategy (Choreography vs Orchestration)
2. Compensation Strategy Design
3. Failure Recovery Strategy

---

# Architecture-Level Decision Trees

---

## Saga Coordination Strategy

---

## Decision Context

Choosing between choreography and orchestration for saga coordination.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Are the saga steps loosely coupled with simple linear flow?
↓
YES → Use choreography (services react to events, no central coordinator)
  ↓
  Is the saga flow simple (<5 steps) with no branching?
  ↓
  YES → Choreography is simpler and more decoupled
  NO → Choreography becomes complex with branching; use orchestration
NO → Does the saga have complex branching or conditional compensation?
  ↓
  YES → Use orchestration with central state machine
  NO → Choreography may work but orchestration provides clearer control
  ↓
  Need full saga audit trail from a single source?
  ↓
  YES → Orchestration provides central saga log
  NO → Choreography events distributed across services

---

## Rationale

Choreography is simpler for linear sagas with few steps. Orchestration provides central control and audit for complex workflows with branching compensation.

---

## Recommended Default

**Default:** Choreography for simple linear sagas; orchestration for complex branching workflows
**Reason:** Match coordination complexity to saga complexity

---

## Risks Of Wrong Choice

Orchestration adds central coordination overhead for simple linear flows. Choreography for complex sagas makes compensation logic hard to reason about.

---

## Related Rules
Define Compensating Actions Before Forward Actions

---

## Related Skills

Implement Reliable Outgoing Webhook Dispatch with Spatie

---

## Compensation Strategy Design

---

## Decision Context

Designing compensating actions for saga step failures.

---

## Decision Criteria

* reliability
* data consistency

---

## Decision Tree

Does each forward step have a defined compensating action?
↓
YES → Ensure compensation is idempotent and safe to replay
  ↓
  Is the compensation a business reversal or technical rollback?
  ↓
  BUSINESS → Compensation reverses business effect (refund, cancel)
  TECHNICAL → Compensation cleans up technical state (delete temp record)
NO → Can the operation be safely skipped (no compensation needed)?
  ↓
  YES → Handle gracefully; log the skip
  NO → Redesign saga to include compensation; data integrity at risk
  ↓
  Compensation order matters?
  ↓
  YES → Execute compensations in reverse order of forward steps (LIFO)
  NO → Compensation order is independent; parallel execution safe

---

## Rationale

Compensating actions undo completed steps when a later step fails. Idempotent compensation ensures safe retry. LIFO execution maintains data consistency.

---

## Recommended Default

**Default:** Idempotent compensating actions executed in LIFO order on step failure
**Reason:** Safe retry; consistent undo; predictable compensation behavior

---

## Risks Of Wrong Choice

No compensation leaves partial state on step failure. Non-idempotent compensation causes duplicate reversal on retry. Wrong compensation order creates data inconsistency.

---

## Related Rules
Test Compensation Paths as Rigorously as Forward Paths

---

## Related Skills

Implement Secure Incoming Webhook Processing with Spatie

---

## Failure Recovery Strategy

---

## Decision Context

Handling saga step failures and initiating compensation.

---

## Decision Criteria

* reliability
* maintainability

---

## Decision Tree

Has a saga step failed (exception, timeout, error response)?
↓
YES → Determine if retryable or permanent failure
  ↓
  Is the failure retryable (transient, timeout)?
  ↓
  YES → Retry step with backoff before compensating
  NO → Initiate compensation for all completed steps in LIFO order
NO → Is the step still in progress but timing out?
  ↓
  YES → Mark step as failed; compensate all completed steps
  NO → Continue saga normally
  ↓
  Need timeout per saga step?
  ↓
  YES → Set step timeout; compensate if step doesn't complete in time
  NO → No timeout; saga hangs indefinitely on slow step

---

## Rationale

Transient failures should be retried before compensation. Permanent failures trigger compensation for all completed steps. Timeouts prevent hung sagas from blocking resources.

---

## Recommended Default

**Default:** Retry transient failures (3 attempts, exponential backoff); compensate on permanent failure; step timeout = 30s
**Reason:** Recovery from transient issues; safe rollback on permanent; bounded execution time

---

## Risks Of Wrong Choice

No retry causes unnecessary compensation on transient failures. No timeout keeps sagas in-flight indefinitely. Compensation without LIFO ordering creates inconsistent state.

---

## Related Rules
Saga Log in Event Store for Full Audit Trail

---

## Related Skills

Implement Exponential Backoff for Webhook Delivery Retries
