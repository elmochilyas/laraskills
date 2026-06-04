# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** CQRS maturity levels (0-4)
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: CQRS maturity level per bounded context
* Decision 2: When to introduce separate read models (Level 2)
* Decision 3: When to progress to separate databases (Level 3)

---

# Architecture-Level Decision Trees

---

## Decision: CQRS Maturity Level Per Bounded Context

---

## Decision Context

Choose the appropriate CQRS maturity level for a bounded context, balancing complexity against actual need.

---

## Decision Criteria

* performance considerations: Level 1 adds no overhead; Level 3-4 add significant infrastructure
* architectural considerations: higher levels provide more flexibility but more complexity
* security considerations: higher levels may improve read/write isolation
* maintainability considerations: Level 0 is simplest; Level 4 is most complex

---

## Decision Tree

Does the bounded context have read/write asymmetry (different read vs write patterns)?
↓
YES → Assess: Do queries span multiple aggregates or need complex reshaping?
    YES → Are queries causing performance issues on the write model?
        YES → Is event sourcing needed for temporal/audit requirements?
            YES → Level 4 (event-sourced CQRS)
            NO → Is separate read/write database justified by scalability needs?
                YES → Level 3 (separate databases)
                NO → Level 2 (separate read models, same database)
        NO → Level 2 (separate read models for complex queries)
    NO → Level 1 (CQS: same model, separated command/query methods)
NO → Is the context simple CRUD with minimal business logic?
    YES → Level 0 (no CQRS separation needed)
    NO → Level 1 (CQS: minimal separation for clarity)

---

## Rationale

The default should be the lowest level that meets the bounded context's needs. Most contexts benefit from Level 1 (CQS). Level 2 is justified when queries span aggregates. Level 3 requires scalability data. Level 4 needs temporal or audit requirements.

---

## Recommended Default

**Default:** Level 1 (CQS) for most bounded contexts; progress to higher levels only when concrete need arises.

**Reason:** Level 1 provides clear command/query separation with zero infrastructure overhead. Higher levels add complexity that must be justified by actual bottlenecks or requirements.

---

## Risks Of Wrong Choice

Level 4 for CRUD: massive over-engineering, slow development, unnecessary infrastructure costs. Level 0 for complex domain: mixed read/write models, performance issues, hard to refactor.

---

## Related Rules

- Rule 1: Start at Level 1 (same model, separate command/query methods) before progressing
- Rule 2: Enforce command and query segregation at the API/controller level even at Level 1

---

## Related Skills

- Assess and Progress Through CQRS Maturity Levels
- Apply CQRS Selectively per Bounded Context
- Assess CQRS Overengineering Risk

---

## Decision: When to Introduce Separate Read Models (Level 2)

---

## Decision Context

Determine when to introduce separate read models (denormalized projections) alongside the write model.

---

## Decision Criteria

* performance considerations: read models optimize query speed at the cost of projection latency
* architectural considerations: read models decouple query shape from domain model
* security considerations: read models can have different access controls than write model
* maintainability considerations: projections add maintenance and eventual consistency complexity

---

## Decision Tree

Do queries need data from multiple aggregates or bounded contexts?
↓
YES → Introduce read models (querying across aggregates from write model is problematic)
NO → Do queries require complex computed views or reporting structures?
    YES → Are the queries slow (> 200ms p95) on the write model?
        YES → Introduce read models (performance justifies separation)
        NO → Is the query complexity causing write model schema compromises?
            YES → Introduce read models (schema purity justifies separation)
            NO → Continue with Level 1 (CQS on same model)
    NO → Continue with Level 1 (no need for separate read models)

---

## Rationale

Separate read models are justified when: (1) queries cross aggregate boundaries, (2) query performance on the write model is unacceptable, or (3) query requirements force compromises on the write model's schema. Otherwise, Level 1 is sufficient.

---

## Recommended Default

**Default:** Introduce read models only when queries cross aggregate boundaries.

**Reason:** Cross-aggregate queries on the write model create coupling between unrelated domain concepts. Read models provide an optimized, denormalized view without polluting the domain model.

---

## Risks Of Wrong Choice

Read models prematurely: projection infrastructure overhead, eventual consistency where not needed. No read models when needed: write model schema compromises, complex slow queries.

---

## Related Rules

- Rule 3: Introduce separate read models (Level 2) when queries require reshaping or aggregating data across aggregates

---

## Related Skills

- Assess and Progress Through CQRS Maturity Levels
- Implement Read Model Strategies
- Implement Event Bus Patterns

---

## Decision: When to Progress to Separate Databases (Level 3)

---

## Decision Context

Determine when read and write models should have physically separate databases.

---

## Decision Criteria

* performance considerations: separate databases eliminate read/write contention
* architectural considerations: separate databases enable independent scaling
* security considerations: separate databases allow different access controls
* maintainability considerations: separate databases add significant operational overhead

---

## Decision Tree

Is there measurable read/write contention on the current database?
↓
YES → Is the contention causing SLA violations (> 1% error rate or > 500ms p99)?
    YES → Consider separate databases (performance crisis justifies operational cost)
    NO → Is the read traffic significantly higher than write traffic (100:1+)?
        YES → Consider separate read replica (less complex than full separate DB)
        NO → Monitor; defer separate databases unless contention worsens
NO → Do read and write models have genuinely different scaling characteristics?
    YES → Consider separate databases (independent scaling)
    NO → Keep same database with separate schemas/tables
        ↓
        Is the team experienced with multi-database operations?
        YES → Separate databases if performance data justifies
        NO → Single database (operational complexity not justified)

---

## Rationale

Separate databases are the most operationally complex CQRS decision. They're justified only when performance data shows read/write contention causing SLA violations, or when read and write sides have fundamentally different scaling needs. A read replica is a simpler intermediate step.

---

## Recommended Default

**Default:** Keep the same database; add a read replica first if read performance is a concern before separate read/write databases.

**Reason:** Separate databases add significant operational complexity (backup, migration, consistency). A read replica provides many of the performance benefits at lower cost.

---

## Risks Of Wrong Choice

Separate databases prematurely: operational overhead, data synchronization complexity, deployment coordination. Same database when separate needed: contention, SLA violations, scaling limitations.

---

## Related Rules

- Rule 4: Move to separate databases (Level 3) only when justified by scalability data

---

## Related Skills

- Assess and Progress Through CQRS Maturity Levels
- Assess CQRS Overengineering Risk
