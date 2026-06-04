# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** CQRS overengineering risk assessment
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: CQRS vs CQS for a bounded context
* Decision 2: Same repository vs separate read/write repositories
* Decision 3: Event sourcing vs CQRS without event sourcing

---

# Architecture-Level Decision Trees

---

## Decision: CQRS vs CQS for a Bounded Context

---

## Decision Context

Determine whether a bounded context needs full CQRS (separate read/write models) or just CQS (method-level separation).

---

## Decision Criteria

* performance considerations: CQS has zero overhead; CQRS adds infrastructure cost
* architectural considerations: CQRS provides stronger separation; CQS is simpler
* security considerations: CQRS enables different security for read vs write
* maintainability considerations: CQS is much simpler to maintain; CQRS adds projection infrastructure

---

## Decision Tree

Do read operations need data from multiple aggregates or different shapes than write operations?
↓
YES → Full CQRS (separate read models justified)
NO → Is eventual consistency acceptable for this use case?
    YES → Are there performance bottlenecks on read operations?
        YES → Full CQRS (read models optimize query performance)
        NO → CQS (method-level separation is sufficient)
    NO → CQS (strong consistency required; CQRS would add unnecessary eventual consistency)
        ↓
        Does the team have prior CQRS experience?
        YES → Full CQRS if justified; CQS otherwise
        NO → CQS (learn CQRS on a simpler context first)

---

## Rationale

CQS (same model, separate methods for commands and queries) provides most of the architectural benefit of CQRS with none of the infrastructure overhead. Full CQRS should be reserved for contexts with genuine read/write asymmetry, performance bottlenecks, or cross-aggregate queries.

---

## Recommended Default

**Default:** CQS for most bounded contexts; full CQRS only when read/write asymmetry is proven.

**Reason:** CQS eliminates mixed read/write methods while keeping infrastructure simple. Adding read models later is straightforward when the need arises.

---

## Risks Of Wrong Choice

Full CQRS without need: over-engineering, slow delivery, unnecessary complexity. CQS when CQRS needed: write model schema polluted with query concerns, performance issues.

---

## Related Rules

- Rule 1: Apply CQRS only where justified by query complexity or throughput requirements
- Rule 2: Separate commands and queries at the method/controller level first (CQS) before adding infrastructure

---

## Related Skills

- Assess CQRS Overengineering Risk
- Assess and Progress Through CQRS Maturity Levels
- Apply CQRS Selectively per Bounded Context

---

## Decision: Same Repository vs Separate Read/Write Repositories

---

## Decision Context

Choose whether to keep command and query handlers in the same repository or separate them into different repositories.

---

## Decision Criteria

* performance considerations: same repo avoids deployment coordination; separate repos enable independent scaling
* architectural considerations: same repo is simpler; separate repos provide stronger isolation
* security considerations: separate repos allow different deployment security profiles
* maintainability considerations: same repo is much simpler; separate repos add duplication

---

## Decision Tree

Do the read and write sides have different deployment cadence (different teams, different schedules)?
↓
YES → Separate repositories (independent deployment)
NO → Do the read and write sides need to scale independently?
    YES → Separate repositories (different infrastructure requirements)
    NO → Is the expected team size larger than 5 developers per side?
        YES → Consider separate repositories (team autonomy)
        NO → Same repository (simpler, less duplication)
            ↓
            Will separate repositories cause significant code duplication?
            YES → Same repository (duplication cost outweighs isolation benefit)
            NO → Same repository (simpler, enough isolation at code level)

---

## Rationale

Same repository with code-level separation (different directories for Commands and Queries) provides sufficient isolation for most teams. Separate repositories are justified only when deployment cadence, scaling needs, or team autonomy requirements demand independence.

---

## Recommended Default

**Default:** Same repository with commands and queries in separate directories.

**Reason:** Same repository avoids duplicated infrastructure boilerplate, simplifies onboarding, and enables easier refactoring. Separate repositories should be a deliberate choice, not a default.

---

## Risks Of Wrong Choice

Separate repositories: duplicated code (database config, middleware, models), deployment coordination complexity. Same repository when separate needed: deployment coupling, scaling conflicts.

---

## Related Rules

- Rule 3: Keep write and read models in the same repository until separation is proven necessary

---

## Related Skills

- Assess CQRS Overengineering Risk
- Apply CQRS Selectively per Bounded Context

---

## Decision: Event Sourcing vs CQRS Without Event Sourcing

---

## Decision Context

Decide whether to pair CQRS with event sourcing or use CQRS with traditional persistence.

---

## Decision Criteria

* performance considerations: event sourcing adds storage cost and projection rebuild time
* architectural considerations: event sourcing provides temporal queries and complete audit trail
* security considerations: event sourcing stores all data forever — GDPR compliance challenge
* maintainability considerations: event sourcing is significantly more complex than traditional persistence

---

## Decision Tree

Is a complete audit trail required (regulatory or compliance requirement)?
↓
YES → Event sourcing (audit is built-in — every state change is recorded)
NO → Are temporal queries needed ("what was the state at any point in time")?
    YES → Event sourcing (temporal queries are natural with event store)
    NO → Is there a business requirement to replay past states?
        YES → Event sourcing (rebuild from events)
        NO → CQRS without event sourcing (simpler, traditional persistence)
            ↓
            Is the team experienced with event sourcing?
            YES → Event sourcing may be considered if other benefits apply
            NO → CQRS without event sourcing (event sourcing learning curve is steep)

---

## Rationale

Event sourcing should be a deliberate choice driven by specific requirements (audit, temporal queries, replay capability), not an automatic pairing with CQRS. CQRS works perfectly well with traditional persistence. Adding event sourcing dramatically increases complexity.

---

## Recommended Default

**Default:** CQRS without event sourcing for most bounded contexts.

**Reason:** Event sourcing adds significant complexity, storage costs, and learning curve. It should be adopted only when audit, temporal queries, or replay requirements justify the investment.

---

## Risks Of Wrong Choice

Event sourcing without need: massive over-engineering, GDPR compliance problems, slow development, expensive storage. CQRS without event sourcing when audit needed: missing state change history, manual audit logging.

---

## Related Rules

- Rule 1: Apply CQRS only where justified by query complexity or throughput requirements
- Rule 5: Validate CQRS adoption with a 6-month retrospective

---

## Related Skills

- Assess CQRS Overengineering Risk
- Implement Event Sourcing Components
- Implement Event Bus Patterns
