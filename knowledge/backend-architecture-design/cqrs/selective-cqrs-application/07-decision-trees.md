# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** When to apply CQRS selectively per bounded context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: CQRS depth per bounded context
* Decision 2: Which context to pilot CQRS first
* Decision 3: Mixed CQRS levels coexistence strategy

---

# Architecture-Level Decision Trees

---

## Decision: CQRS Depth Per Bounded Context

---

## Decision Context

Determine the appropriate CQRS depth for each bounded context based on its read/write characteristics.

---

## Decision Criteria

* performance considerations: read-heavy contexts benefit most from CQRS
* architectural considerations: simple CRUD contexts don't need CQRS separation
* security considerations: contexts with sensitive data may benefit from read/write isolation
* maintainability considerations: CQRS is justified only when it solves a concrete problem

---

## Decision Tree

What is the context's read/write characteristic?
↓
BALANCED (50/50) → Level 0 or 1: Simple CRUD or CQS (no separate infrastructure needed)
WRITE-HEAVY (80%+ writes) → Level 0 or 1: CQS is sufficient (reads are simple)
READ-HEAVY (80%+ reads) → Do reads need data from multiple aggregates?
    YES → Level 2: Separate read models (optimized for query patterns)
    NO → Level 1: CQS (method-level separation is enough)
COMPLEX READS (reporting, analytics) → Level 2: Separate read models (aggregated, pre-computed)
    ↓
    Does this context also need strong read/write isolation?
    YES → Level 3: Separate databases (if scalability data justifies it)
    NO → Level 2 sufficient

---

## Rationale

CQRS depth should match the context's read/write asymmetry. Balanced or write-heavy contexts get minimal CQRS (Level 0-1). Read-heavy and complex-read contexts benefit from read models (Level 2). Separate databases (Level 3) are rarely justified.

---

## Recommended Default

**Default:** Level 0 or 1 for most contexts; Level 2 for read-heavy or reporting contexts only.

**Reason:** Most bounded contexts have balanced or write-heavy characteristics that don't benefit from CQRS infrastructure. Reserve CQRS investment for contexts where the read/write asymmetry justifies it.

---

## Risks Of Wrong Choice

Level 3 for all contexts: massive over-engineering, operational complexity. Level 0 for reporting context: slow queries, write model schema polluted with query concerns.

---

## Related Rules

- Rule 1: Apply CQRS selectively per use case — not globally across the entire application
- Rule 2: Use CQS (same model, separated methods) as the default; upgrade to full CQRS only when needed

---

## Related Skills

- Apply CQRS Selectively per Bounded Context
- Assess CQRS Overengineering Risk

---

## Decision: Which Context to Pilot CQRS First

---

## Decision Context

Choose which bounded context to pilot CQRS on when adopting it incrementally.

---

## Decision Criteria

* performance considerations: pilot on a context with clear performance benefit
* architectural considerations: choose a context with clear read/write asymmetry
* security considerations: avoid security-critical contexts for the pilot
* maintainability considerations: pilot on a lower-risk context first

---

## Decision Tree

Which bounded context has the clearest read/write asymmetry?
↓
Select that context
    ↓
    Does this context have measurable performance issues on reads?
    YES → Pilot this context (clear before/after comparison possible)
    NO → Is this context a non-critical, lower-risk part of the system?
        YES → Pilot this context (low risk if CQRS adoption goes wrong)
        NO → Find a context that is both asymmetric AND lower-risk
            ↓
            Does the team have 3+ months to evaluate the pilot?
            YES → Proceed with pilot (adequate evaluation period)
            NO → Choose a simpler context for faster evaluation

---

## Rationale

The pilot context should have clear read/write asymmetry to demonstrate CQRS value, but should be low-risk to avoid catastrophic failure if adoption goes wrong. Reporting and dashboard contexts are excellent pilot candidates.

---

## Recommended Default

**Default:** Pilot CQRS on a reporting or dashboard context first.

**Reason:** Reporting contexts have clear read/write asymmetry, measurable performance improvement potential, and are typically non-critical (off the main transaction path). This provides a safe environment to learn CQRS patterns.

---

## Risks Of Wrong Choice

Piloting on mission-critical context: high risk if CQRS design is wrong, difficult to roll back. Piloting on symmetric context: low CQRS value, team concludes CQRS isn't useful.

---

## Related Rules

- Rule 1: Apply CQRS selectively per use case

---

## Related Skills

- Apply CQRS Selectively per Bounded Context
- Assess and Progress Through CQRS Maturity Levels

---

## Decision: Mixed CQRS Levels Coexistence Strategy

---

## Decision Context

Design how different CQRS levels coexist across bounded contexts in the same system.

---

## Decision Criteria

* performance considerations: mixed levels shouldn't cause deployment conflicts
* architectural considerations: clear boundaries prevent confusion about which level applies
* security considerations: cross-context queries must respect different CQRS levels
* maintainability considerations: teams must understand which level applies to which context

---

## Decision Tree

Do contexts with different CQRS levels need to communicate?
↓
YES → Is communication via events or APIs?
    YES → Events: publish from any context, consume in any other (level-independent)
    NO → API calls: consumer doesn't care about provider's internal CQRS level
NO → Can the CQRS level be documented per context in an ADR?
    YES → Document level and rationale per context in an ADR
    NO → Simplify: converge to a single CQRS level across the system
        ↓
        Do teams need to know which level applies to which context?
        YES → Document in context README and ADR
        NO → Mixed levels can coexist with clear boundaries

---

## Rationale

Different CQRS levels can coexist within the same system as long as (1) clear boundaries exist between contexts, (2) communication uses events or APIs, and (3) each context's level is documented. The key constraint is that no context should depend on another context's internal CQRS implementation.

---

## Recommended Default

**Default:** Allow different CQRS levels per bounded context; document each context's level and rationale in an ADR.

**Reason:** Different contexts have different needs. Forcing the same level across all contexts causes either under-engineering or over-engineering. Documented boundaries prevent confusion.

---

## Risks Of Wrong Choice

Single level everywhere: either over-engineering simple contexts or under-engineering complex ones. Mixed levels without documentation: confusion about which level applies, inappropriate usage.

---

## Related Rules

- Rule 3: Draw bounded-context boundaries at natural CQRS inflection points

---

## Related Skills

- Apply CQRS Selectively per Bounded Context
- Identify Bounded Contexts
