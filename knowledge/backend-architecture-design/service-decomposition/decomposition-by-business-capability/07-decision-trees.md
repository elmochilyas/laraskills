# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Decomposition by business capability vs subdomain
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Decomposition strategy — business capability vs DDD subdomain
* Decision 2: Service granularity — coarse vs fine decomposition
* Decision 3: Hybrid approach — core vs supporting/generic treatment

---

# Architecture-Level Decision Trees

---

## Decision: Decomposition Strategy — Business Capability vs DDD Subdomain

---

## Decision Context

Choose the primary lens for identifying service boundaries: business capabilities (process-oriented) or DDD subdomains (value-oriented).

---

## Decision Criteria

* performance considerations: capability decomposition may create chatty services; subdomain decomposition minimizes cross-service calls
* architectural considerations: subdomain decomposition handles complexity better; capability decomposition aligns with org structure
* security considerations: subdomain decomposition naturally isolates sensitive core subdomains
* maintainability considerations: subdomain decomposition is more stable over time; capability decomposition changes with process redesign

---

## Decision Tree

Does the organization have clear business capabilities mapped to teams?
↓
YES → Can each capability be mapped to a stable business process?
    YES → Start with business capability decomposition (Conway's Law alignment)
    ↓
    Does this capability contain both core business value and generic support logic?
    YES → Apply subdomain analysis within the capability (separate core from generic)
    NO → Capability decomposition is sufficient
    NO → Start with subdomain analysis first (capabilities aren't stable enough)
NO → Are you unsure which is more valuable — process alignment or value alignment?
    YES → Map both: list capabilities and subdomains, find the overlap
    ↓
    Do 80%+ of capability boundaries match subdomain boundaries?
    YES → Either approach works; choose capability decomposition for org alignment
    NO → Use subdomain decomposition as primary (core/supporting/generic)
    ↓
    Is the business willing to reorganize teams around subdomain boundaries?
    YES → Subdomain decomposition (align teams to core/supporting/generic)
    NO → Capability decomposition with subdomain refinement within each capability
NO → Use subdomain decomposition (fundamental — identifies where competitive advantage lies)

---

## Rationale

Business capability decomposition aligns with Conway's Law and maps to organizational structure. DDD subdomain decomposition identifies where the business creates value (core vs supporting vs generic). Both are valid; the choice depends on organizational stability and whether the business has clear capability boundaries. Hybrid approaches work best: use capabilities for org alignment and subdomains for prioritization.

---

## Recommended Default

**Default:** Map business capabilities first, then apply subdomain analysis (core/supporting/generic) within each capability. Use subdomain classification to determine investment level.

**Reason:** Capabilities align with teams and org structure. Subdomain analysis within each capability prevents over-investing in generic logic and under-investing in core differentiators.

---

## Risks Of Wrong Choice

Capability-only decomposition: treats commodity features as equal priority to core differentiators, over-engineers simple CRUD. Subdomain-only decomposition without org alignment: boundaries don't match team structures, causing communication overhead.

---

## Related Rules

- Rule 1: Decompose by business capability first; refine with subdomain analysis
- Rule 2: Capability decomposition aligns with organizational boundaries (Conway's Law)

---

## Related Skills

- Map Business Capabilities
- Identify DDD Subdomains (Core/Supporting/Generic)
- Design Service Boundaries

---

## Decision: Service Granularity — Coarse vs Fine Decomposition

---

## Decision Context

Choose how many services to create from a given business capability or subdomain.

---

## Decision Criteria

* performance considerations: fine-grained services increase network overhead and latency
* architectural considerations: coarse-grained services may become monolithic over time
* security considerations: fine-grained services provide more granular access control
* maintainability considerations: fine-grained services increase deployment and testing complexity

---

## Decision Tree

How many use cases does this capability/subdomain contain?
↓
1-5 USE CASES → Single service (coarse — appropriate for small capabilities)
6-15 USE CASES → Medium service: split only if use cases have different data ownership
    ↓
    Do some use cases have clearly different data access patterns (90% read vs 90% write)?
    YES → Consider splitting by read/write (CQRS-aligned boundaries)
    NO → Keep as one service
16+ USE CASES → Split into multiple services
    ↓
    Can you identify natural sub-groups by business concepts?
    YES → Split by concept group (e.g., Orders, Payments, Fulfillment under Commerce capability)
    ↓
    Would each sub-group have its own database schema?
    YES → Split into separate services (different data ownership)
    NO → Keep as modules within a service (avoid unnecessary distribution)
    NO → What's driving the split?
        Team size → Split if the team exceeds 8-10 people per service
        Deployment frequency → Split if different use cases deploy at different rates
        Scaling needs → Split if different use cases have different scaling requirements
        None of the above → Keep as one service (avoid-premature distribution)

---

## Rationale

Service granularity is a spectrum. Coarse-grained services are simpler to operate but may grow into monoliths. Fine-grained services are independently deployable but create distributed system complexity. The right size minimizes cross-service communication while keeping each service independently deployable.

---

## Recommended Default

**Default:** Start coarse (one service per capability/subdomain). Split only when team size, deployment frequency, or scaling needs justify the cost of distribution.

**Reason:** Coarse services are simpler, cheaper to operate, and avoid premature complexity. Distribution should be earned, not assumed.

---

## Risks Of Wrong Choice

Too fine: distributed monolith with network overhead, operational complexity, no real autonomy. Too coarse: one giant service that cannot be deployed independently, team coordination bottlenecks.

---

## Related Rules

- Rule 4: Services should be small enough to be owned by a single team but large enough to have meaning

---

## Related Skills

- Assess Service Granularity
- Apply Modular Monolith Before Microservices

---

## Decision: Hybrid Approach — Core vs Supporting/Generic Treatment

---

## Decision Context

Choose how to treat core (competitive advantage), supporting (necessary but not differentiating), and generic (commodity) subdomains differently in service design.

---

## Decision Criteria

* performance considerations: core services deserve optimization investment; generic can use off-the-shelf
* architectural considerations: core deserves custom architecture; generic benefits from standardization
* security considerations: core services need stronger isolation and security investment
* maintainability considerations: core deserves more engineering rigor; generic should be replaced whenever possible

---

## Decision Tree

What type of subdomain is this?
↓
CORE (competitive advantage, complex business logic, custom rules)
    → Build custom service with full DDD tactical patterns
    ↓
    Is this core subdomain's logic complex enough for event sourcing or CQRS?
    YES → Consider advanced patterns (investment justified by competitive value)
    NO → Standard DDD with tactical patterns (aggregates, repositories)
SUPPORTING (necessary but not differentiating)
    → Build custom service but with simpler patterns (CRUD/CQS, not full CQRS)
    ↓
    Could this supporting function be moved to a third-party or become generic?
    YES → Design as a thin wrapper that can be replaced later
    NO → Custom build with moderate engineering investment
GENERIC (commodity — auth, notifications, payments)
    → Buy or use open source if possible; wrap in anti-corruption layer
    ↓
    Is there a suitable SaaS or OSS solution available?
    YES → Use it with an anti-corruption layer (isolate from core)
    NO → Build the simplest possible implementation (no custom patterns)

---

## Rationale

Not all subdomans deserve the same architectural investment. Core subdomains (competitive advantage) justify advanced patterns, custom DDD design, and ongoing optimization. Supporting subdomains need custom implementation but with simpler patterns. Generic subdomains should be bought or built as thin wrappers. Misallocating investment (over-engineering generic, under-investing in core) is the most common decomposition mistake.

---

## Recommended Default

**Default:** Full DDD for core, simple CRUD/CQS for supporting, buy or thin wrapper for generic.

**Reason:** Investment should match business value. Over-engineering generic subdomains wastes resources; under-investing in core subdomains compromises competitive advantage.

---

## Risks Of Wrong Choice

Full DDD for generic: over-engineering commodity features, unnecessary complexity. CRUD for core: fails to capture complex business rules, lost competitive advantage. Building everything in-house: wasted resources on commodity features.

---

## Related Rules

- Rule 3: Core and supporting subdomains warrant custom implementation; generic subdomains should be bought or built thin
- Rule 1: Decompose by business capability first

---

## Related Skills

- Identify DDD Subdomains (Core/Supporting/Generic)
- Design Anti-Corruption Layer
- Assess Build vs Buy Decisions
