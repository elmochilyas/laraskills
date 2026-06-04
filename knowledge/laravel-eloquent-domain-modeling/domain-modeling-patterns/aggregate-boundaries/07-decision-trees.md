# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Aggregate Boundaries
**Generated:** 2026-06-03

---

# Decision Inventory

* Aggregate boundary scope
* Transaction boundary alignment
* Cross-aggregate reference strategy

---

# Architecture-Level Decision Trees

---

## Aggregate Boundary Scope

---

## Decision Context

Determining which models belong inside an aggregate boundary vs which are separate aggregates.

---

## Decision Criteria

* architectural
* performance
* maintainability

---

## Decision Tree

Do two models share an invariant that must be transactionally consistent?
↓
YES → Are they modified together in every business operation?
    YES → Same aggregate boundary — load and save together
    NO → Consider if the invariant is truly required or can be eventually consistent
NO → Are they independently modifiable?
    YES → Separate aggregates — different transaction boundaries
    NO → Re-evaluate — they may need to be in the same aggregate

---

## Rationale

The aggregate boundary is a transactional consistency zone. If two entities must always be consistent (invoice total = sum of line items), they belong together. If they can be eventually consistent, separate boundaries improve scalability.

---

## Recommended Default

**Default:** Separate aggregates (smaller boundaries)
**Reason:** Smaller aggregates mean smaller transactions, less locking, and better scalability. Only merge when a hard invariant requires it.

---

## Risks Of Wrong Choice

Overly large aggregates cause transactional contention and performance problems. Overly small aggregates risk data inconsistency when a multi-step operation modifies related entities without atomicity.

---

## Related Rules

* One transaction, one aggregate
* The root is the only entry point for modifications

---

## Related Skills

* Define an Aggregate Root with Consistency Boundaries

---

## Transaction Boundary Alignment

---

## Decision Context

Ensuring that database transaction boundaries match aggregate boundaries to maintain consistency.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Does the operation modify multiple aggregate instances?
↓
YES → Is there a hard requirement for cross-aggregate atomicity?
    YES → Redesign — one transaction should modify one aggregate. Consider a domain event + compensating action.
    NO → Use separate transactions per aggregate — eventual consistency is acceptable
NO → Does the operation modify exactly one aggregate instance?
    YES → Wrap in `DB::transaction()` for atomicity within the aggregate
    NO → No transaction needed for single-model reads

---

## Rationale

DDD principle: one transaction modifies one aggregate. When you need to modify multiple aggregates atomically, the boundary may be wrong. Use eventual consistency with domain events for cross-aggregate workflows.

---

## Recommended Default

**Default:** One DB transaction per aggregate modification
**Reason:** Aligns with DDD principles, prevents nested transaction issues, and keeps locking minimal.

---

## Risks Of Wrong Choice

Modifying multiple aggregates in one transaction creates large lock footprints, risk of deadlocks, and violates aggregate boundary principles. Using separate transactions for a single aggregate operation risks partial updates.

---

## Related Rules

* Wrap aggregate operations in DB::transaction()
* Use push() for saving root + children

---

## Related Skills

* Define an Aggregate Root with Consistency Boundaries

---

## Cross-Aggregate Reference Strategy

---

## Decision Context

Choosing how one aggregate should refer to another — by ID or by object reference.

---

## Decision Criteria

* architectural
* performance

---

## Decision Tree

Does the reference need to load the other aggregate's data for the current operation?
↓
YES → Load by ID on demand — eager load only what's needed
NO → Is the reference used only for identity (e.g., foreign key)?
    YES → Store only the ID — no Eloquent relationship needed
    NO → Is the relationship read-only (displaying related aggregate data)?
        YES → Use ID + optional read-side cache
        NO → Re-evaluate aggregate boundaries

---

## Rationale

Reference by ID prevents accidental modification of other aggregates and enables eventual consistency. Eloquent relationships across aggregate boundaries create implicit coupling that can lead to unintended cross-aggregate modifications.

---

## Recommended Default

**Default:** Reference by ID only
**Reason:** Prevents accidental cross-aggregate modification, supports eventual consistency, and reduces load on the ORM.

---

## Risks Of Wrong Choice

Using object references across aggregates risks cascading saves that modify aggregates outside the intended boundary, corrupting consistency guarantees. It also loads unnecessary data and creates N+1 query risks.

---

## Related Rules

* Reference other aggregates by ID, not by object
* External code references aggregate roots only

---

## Related Skills

* Define an Aggregate Root with Consistency Boundaries
