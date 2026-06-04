# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Event Projections
**Generated:** 2026-06-03

---

# Decision Inventory

* Projection vs direct query
* Sync vs async projection
* Projection design (minimum fields)

---

# Architecture-Level Decision Trees

---

## Projection vs Direct Query

---

## Decision Context

Deciding whether to build a read-side projection or query the write model directly.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Is the read query on the write model slow due to joins and normalization?
↓
YES → Build a projection optimized for the read use case
NO → Does the same data need multiple read representations?
    YES → Projections provide tailored read structures
    NO → Direct query on the write model is sufficient

---

## Rationale

Projections trade write complexity for read performance. When writes are infrequent but reads are frequent and complex, projections pay off. For simple queries that the write model handles efficiently, projections add unnecessary complexity.

---

## Recommended Default

**Default:** Direct query on the write model
**Reason:** Simpler, no synchronization needed, always consistent. Only project when query performance or multiple representations demand it.

---

## Risks Of Wrong Choice

Building projections for every query path creates synchronization overhead and stale data. Querying the write model for complex analytical queries causes slow responses and database load.

---

## Related Rules

* Projections are disposable (rebuildable from events)

---

## Related Skills

* Build a Read-Side Projection from Domain Events

---

## Sync vs Async Projection

---

## Decision Context

Choosing between synchronous (in-transaction) and asynchronous (queued) projection updates.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Does the read model need to be immediately consistent with the write?
↓
YES → Sync projection — update in the same request/transaction
NO → Is eventual consistency acceptable for this read model?
    YES → Async projection — queue the projector, better write performance
    NO → Sync projection — must be immediately consistent

---

## Rationale

Sync projections keep read and write models always consistent but slow the write path. Async projections improve write performance but introduce a window where read models are stale.

---

## Recommended Default

**Default:** Async projection for non-critical read models
**Reason:** Better write performance and scalability. Only use sync when immediate consistency is a hard requirement.

---

## Risks Of Wrong Choice

Using sync projections for all read models makes the write path slow and increases failure risk. Using async for read models that need immediate consistency (payment status, balance) shows stale data to users.

---

## Related Rules

* Make projectors idempotent
* Provide an Artisan command to rebuild projections

---

## Related Skills

* Build a Read-Side Projection from Domain Events

---

## Projection Design

---

## Decision Context

Deciding what fields to include in a projection table.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Does the field serve the specific read use case?
↓
YES → Include it — projection is purpose-built for this query
NO → Is the field needed for a different read use case?
    YES → Create a separate projection for that use case
    NO → Exclude it — extra fields couple the read model to write internals

---

## Rationale

Projections should contain the minimum fields needed for their specific read use case. Adding extra "just in case" fields couples the read model to write model changes and bloats the projection.

---

## Recommended Default

**Default:** Minimum fields required for the specific read query
**Reason:** Leaner tables, faster queries, and reduced coupling between read and write models.

---

## Risks Of Wrong Choice

Over-including fields in projections creates coupling to the write model (write schema changes break projections). Under-including forces additional joins or lookups to supply missing data.

---

## Related Rules

* Projection contains only required fields

---

## Related Skills

* Build a Read-Side Projection from Domain Events
