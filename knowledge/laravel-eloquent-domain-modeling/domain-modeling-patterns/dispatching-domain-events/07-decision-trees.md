# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Dispatching Domain Events
**Generated:** 2026-06-03

---

# Decision Inventory

* Dispatch timing (before vs after persistence)
* Event payload (model instance vs identifiers)
* Synchronous vs queued listeners

---

# Architecture-Level Decision Trees

---

## Dispatch Timing

---

## Decision Context

Deciding whether to dispatch a domain event before or after the database transaction commits.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Should the event be dispatched only if the transaction succeeds?
↓
YES → Use `DB::afterCommit()` or dispatch after `save()` in the domain method
NO → Is there a valid reason to dispatch before persistence?
    YES → Rare — document the rationale explicitly
    NO → Always dispatch after persistence to prevent ghost events

---

## Rationale

Dispatching events before persistence can trigger listeners that operate on data that doesn't yet exist (if the transaction rolls back). This creates ghost events that lead to inconsistent projections, notifications, and audit trails.

---

## Recommended Default

**Default:** Dispatch after transaction commit
**Reason:** Ensures events only fire when data is actually persisted, preventing ghost events and inconsistent state.

---

## Risks Of Wrong Choice

Pre-persistence dispatch causes listeners to act on data that may roll back, leading to phantom notifications, incorrect projections, and audit trail pollution.

---

## Related Rules

* Dispatch after transaction commit using DB::afterCommit()
* Carry IDs and value objects, not model instances

---

## Related Skills

* Dispatch a Domain Event from a Model

---

## Event Payload Strategy

---

## Decision Context

Choosing what data to include in a domain event payload — model instances vs identifiers.

---

## Decision Criteria

* reliability
* performance
* maintainability

---

## Decision Tree

Will the event be processed synchronously or asynchronously (queued)?
↓
Synchronously → Is the model state guaranteed unchanged when the listener runs?
    YES → Carrying the model instance is acceptable (but still prefer IDs)
    NO → Carry IDs and value objects — model may have changed
Async (queued) → ALWAYS carry IDs and value objects, NEVER model instances

---

## Rationale

Model instances in event payloads risk stale data (model changes between dispatch and listener execution), serialization issues (Eloquent models are heavy to serialize), and tight coupling (listeners depend on the full model).

---

## Recommended Default

**Default:** Carry IDs and value objects
**Reason:** Decouples event from model, enables queued processing, and prevents stale-data bugs.

---

## Risks Of Wrong Choice

Carrying model instances causes serialization failures for queued events, couples listeners to Eloquent, and risks listeners operating on outdated data.

---

## Related Rules

* Carry IDs and value objects, not model instances

---

## Related Skills

* Dispatch a Domain Event from a Model

---

## Synchronous vs Queued Listeners

---

## Decision Context

Choosing whether a domain event listener should run synchronously or be queued.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is the listener operation critical to the response (must complete before response)?
↓
YES → Synchronous — the response depends on the side effect completing
NO → Is the listener operation slow (HTTP call, email, report generation)?
    YES → Queue the listener — don't block the response
    NO → Sync is acceptable — simple operations are fast enough

---

## Rationale

Synchronous listeners increase response time but guarantee completion before the response. Queued listeners improve user-perceived performance but introduce eventual consistency.

---

## Recommended Default

**Default:** Queue non-critical listeners
**Reason:** Most side effects (notifications, projections, logging) don't need to complete before the response.

---

## Risks Of Wrong Choice

Queuing critical listeners (password reset emails needed before response) causes poor UX. Synchronous slow listeners (PDF generation, API calls) make the application feel unresponsive.

---

## Related Rules

* Queue listeners for expensive side effects

---

## Related Skills

* Dispatch a Domain Event from a Model
