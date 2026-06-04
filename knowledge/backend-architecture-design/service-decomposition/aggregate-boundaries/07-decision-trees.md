# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Aggregate boundaries as decomposition units
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Aggregate size — small vs large aggregates
* Decision 2: Cross-aggregate reference — by ID vs by object
* Decision 3: Cross-aggregate consistency — eventual vs distributed transaction

---

# Architecture-Level Decision Trees

---

## Decision: Aggregate Size — Small vs Large Aggregates

---

## Decision Context

Choose how many entities and value objects to include in a single aggregate.

---

## Decision Criteria

* performance considerations: large aggregates cause more write conflicts and higher load costs
* architectural considerations: small aggregates align with service boundaries and independent deployment
* security considerations: smaller aggregates limit the blast radius of data exposure
* maintainability considerations: small aggregates are easier to reason about and test

---

## Decision Tree

How many entities does the aggregate contain?
↓
1 ENTITY + ≤2 VOs → Small aggregate (ideal — DDD recommended size)
↓
Is the aggregate loading more than 3 entities on every operation?
    YES → Can entities be split into separate aggregates with eventual consistency?
    YES → Split into smaller aggregates (use domain events to communicate)
    NO → Large aggregate (but verify invariants truly span all entities)
↓
2-3 ENTITIES + several VOs → Medium aggregate (acceptable if invariants justify it)
↓
Do all entities change together in a single transaction?
    YES → Keep as one aggregate (cohesion justifies the size)
    NO → Split: entities that change independently should be separate aggregates
↓
4+ ENTITIES → Large aggregate (warning sign)
↓
Do entities have different lifecycle or change rates?
    YES → Split by lifecycle (entities that update daily vs monthly are different aggregates)
    NO → Verify invariants — do all entities share the same business rules?
        YES → Is every entity modify load needed on every operation?
            YES → Large aggregate may be correct, but consider read models for queries
            NO → Design aggregate to lazy-load or reference by ID where possible

---

## Rationale

Small aggregates (one entity + few VOs) are the DDD-recommended size. They minimize write conflicts, reduce load overhead, align naturally with service boundaries, and can communicate cross-aggregate via domain events. Large aggregates cause performance issues and transaction contention.

---

## Recommended Default

**Default:** Aim for 1 entity + 1-2 value objects per aggregate. Grow only when business invariants demonstrably require it.

**Reason:** Small aggregates minimize conflicts, improve performance, and map cleanly to service and module boundaries.

---

## Risks Of Wrong Choice

Large aggregate: write contention, slow loads, transaction conflicts. Tiny aggregate (single field): unnecessary fragmentation, excessive event overhead for meaningless cross-aggregate communication.

---

## Related Rules

- Rule 1: Aggregates are consistency boundaries — each aggregate is modified as a whole in one transaction

---

## Related Skills

- Design Aggregate Boundaries
- Apply Aggregate Pattern in Laravel

---

## Decision: Cross-Aggregate Reference — By ID vs By Object

---

## Decision Context

Choose whether aggregates reference each other by their identity or by loading the full object.

---

## Decision Criteria

* performance considerations: full object references cause cascade loads and N+1 queries
* architectural considerations: by-ID references respect aggregate boundaries; by-object violates them
* security considerations: by-object references may expose data the owning aggregate controls
* maintainability considerations: by-ID references decouple aggregates; by-object couples them

---

## Decision Tree

Does the operation need data from both aggregates to enforce an invariant?
↓
YES → Can the invariant be enforced with the other aggregate's ID and cached/eventual data?
    YES → Reference by ID (load what you need via a separate query or query model)
    NO → Are these truly separate aggregates if they share an invariant?
        YES → Reference by ID, redesign the invariant to be eventually consistent
        NO → Merge into a single aggregate (the invariant spans both)
NO → Does the consumer need display/read-only data from the referenced aggregate?
    YES → Reference by ID, query the read model or use a repository
    ↓
    Would loading the full object cause cascade loads across aggregate boundaries?
    YES → Definitely reference by ID (prevent boundary leakage)
    NO → Still reference by ID (best practice regardless)
NO → Is it convenient to load the full object via Eloquent relations?
    YES → Resist the convenience: by-ID reference is maintainable long-term
    ↓
    Are you tempted to use Eloquent's `with()` or `load()` across aggregates?
    YES → Build a dedicated query/read model instead (don't cross aggregate boundaries)
    NO → Reference by ID (correct approach)

---

## Rationale

Aggregates must reference each other by ID, not by object reference. Loading a full aggregate object from within another aggregate violates the boundary — it couples aggregates at the persistence level, causes cascade loads, and makes independent evolution impossible.

---

## Recommended Default

**Default:** Always reference other aggregates by their identity (UUID or ID string). Query data across aggregates through dedicated query models or repositories.

**Reason:** By-ID references decouple aggregates, prevent cascade loads, and enable independent aggregate evolution.

---

## Risks Of Wrong Choice

Full object references: coupling between aggregates, cascade load overhead, N+1 queries, inability to extract aggregates into separate services later.

---

## Related Rules

- Rule 4: Aggregate roots reference other aggregates by identity only

---

## Related Skills

- Design Aggregate Boundaries
- Implement Aggregate Persistence in Laravel

---

## Decision: Cross-Aggregate Consistency — Eventual vs Distributed Transaction

---

## Decision Context

Choose how to maintain consistency across multiple aggregates when an operation spans them.

---

## Decision Criteria

* performance considerations: distributed transactions (2PC) block resources; eventual consistency is non-blocking
* architectural considerations: eventual consistency aligns with DDD patterns; distributed transactions couple aggregates
* security considerations: compensating actions in sagas must handle partial failure securely
* maintainability considerations: eventual consistency requires compensating logic; distributed transactions are simpler but fragile

---

## Decision Tree

Does the operation span multiple aggregates?
↓
YES → Can the operation tolerate a few seconds of inconsistency?
    YES → Use domain events + eventual consistency
    ↓
    Does the operation need guaranteed delivery across aggregates?
    YES → Use outbox pattern for reliable event delivery
    NO → Simple event dispatch (acceptable for best-effort)
    NO → Is transactional consistency business-critical (money transfer, inventory deduction)?
        YES → Can the aggregates be merged into one?
            YES → Merge into a single aggregate (one transaction)
            NO → Use saga pattern with compensating actions
                ↓
                Does the saga have compensating actions for every step?
                YES → Saga is safe to implement
                NO → Add compensating actions before proceeding (partial failure leaves system inconsistent)
    ↓
    Does the saga involve more than 3 steps?
    YES → Consider choreography-based saga (simpler, but harder to track)
    NO → Either choreography or orchestration works
NO → Use a single database transaction within the aggregate boundary

---

## Rationale

Cross-aggregate operations should use eventual consistency via domain events. Distributed transactions (2PC) are an anti-pattern in DDD — they couple aggregates, block resources, and reduce availability. The saga pattern is the correct approach when atomicity is needed across aggregates, but eventual consistency is preferred.

---

## Recommended Default

**Default:** Domain events with outbox pattern for cross-aggregate consistency. Saga pattern only when business rules require compensating transactions.

**Reason:** Eventual consistency aligns with aggregate independence, avoids distributed transaction overhead, and scales better. Sagas add complexity that is only justified for critical cross-aggregate workflows.

---

## Risks Of Wrong Choice

Distributed transactions: 2PC coordinator bottleneck, locking, coupling aggregates, poor scalability. No compensating actions in saga: partial failures leave data inconsistent with no recovery path.

---

## Related Rules

- Rule 3: Aggregate changes are committed atomically within their own boundary
- Rule 5: Cross-aggregate consistency is eventual — use domain events

---

## Related Skills

- Design Aggregate Boundaries
- Implement Outbox Pattern
- Implement Saga Pattern
