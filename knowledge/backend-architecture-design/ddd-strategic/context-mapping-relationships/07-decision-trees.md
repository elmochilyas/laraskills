# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** DDD Strategic
**Knowledge Unit:** Context mapping relationship patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Which context mapping pattern to choose
* Decision 2: ACL vs Conformist downstream integration
* Decision 3: Partnership vs Shared Kernel vs Customer-Supplier
* Decision 4: Separate Ways vs full integration

---

# Architecture-Level Decision Trees

---

## Decision: Which Context Mapping Pattern to Choose

---

## Decision Context

Select the appropriate context mapping relationship pattern for a pair of bounded contexts.

---

## Decision Criteria

* performance considerations: ACL and OHS add translation overhead; Shared Kernel adds coordination cost
* architectural considerations: pattern determines coupling strength and model independence
* security considerations: tighter patterns (Shared Kernel) expose more internal data; Separate Ways limits exposure
* maintainability considerations: documented patterns reduce surprise breakages; undocumented patterns cause drift

---

## Decision Tree

Do the two contexts have an existing customer-supplier dynamic in the organization?
↓
YES → Is the downstream context's team able to influence the upstream team's schedule?
    YES → Customer-Supplier pattern (formal negotiation terms)
    NO → Does the downstream context's team want to adopt the upstream model exactly as-is?
        YES → Conformist pattern (adopt without translation — lowest effort)
        NO → Anti-Corruption Layer pattern (translate upstream to own model)
NO → Do both teams collaborate closely and share development responsibility?
    YES → Can the shared model be kept small (<10% of total domain concepts)?
        YES → Shared Kernel pattern (share stable, agreed concepts only)
        NO → Does the shared model cover the entire integration surface?
            YES → Partnership pattern (joint development with regular sync)
            NO → Shared Kernel with explicit boundary (define what's shared and what's private)
NO → Is the integration benefit worth the coupling cost?
    YES → Can the upstream provide a stable, consumable API for multiple downstreams?
        YES → Open-Host Service with Published Language pattern (standardized API)
        NO → Does only one downstream consume this context?
            YES → Customer-Supplier (single consumer relationship)
            NO → Published Language (formalize the contract for multiple consumers)
    NO → Separate Ways pattern (duplicate data rather than integrate)

---

## Rationale

Context mapping patterns form a spectrum from tight coupling (Partnership, Shared Kernel) to loose coupling (OHS, Separate Ways). Choose the loosest pattern that meets business needs. Partnership requires high collaboration bandwidth. Shared Kernel works only when the shared surface is small and stable. ACL provides protection at the cost of translation. Separate Ways avoids coupling entirely through data duplication.

---

## Recommended Default

**Default:** Start with Customer-Supplier for most inter-team relationships; use ACL downstream.

**Reason:** Customer-Supplier formalizes expectations without requiring high collaboration overhead. ACL protects downstream model quality. Upgrade to Shared Kernel or Partnership only when teams demonstrate sustained collaboration capacity.

---

## Risks Of Wrong Choice

Partnership without collaboration: meetings skipped, context drift. Shared Kernel too large: coordination overhead across all contexts. Conformist without model alignment: foreign concepts pollute downstream model. ACL everywhere: unnecessary translation for aligned contexts.

---

## Related Rules

- Rule 1: Document every context relationship using one of the 7 standard patterns
- Rule 3: Establish a Customer-Supplier relationship when the upstream controls the schedule
- Rule 4: Avoid Shared Kernel unless the shared part is small, stable, and agreed
- Rule 5: Use Separate Ways when integration cost outweighs benefit

---

## Related Skills

- Define Context Mapping Relationships
- Implement an Anti-Corruption Layer
- Identify Bounded Contexts

---

## Decision: ACL vs Conformist Downstream Integration

---

## Decision Context

Choose whether a downstream context should translate the upstream model (ACL) or adopt it directly (Conformist).

---

## Decision Criteria

* performance considerations: ACL adds mapping overhead per call; Conformist has zero translation cost
* architectural considerations: ACL preserves downstream model purity; Conformist couples downstream to upstream's model
* security considerations: ACL can sanitize data crossing boundaries; Conformist passes data through unchanged
* maintainability considerations: ACL adds maintenance burden; Conformist breaks when upstream model changes

---

## Decision Tree

Is the upstream context's Ubiquitous Language compatible with the downstream context's language?
↓
YES → Is the upstream model well-designed and stable?
    YES → Conformist pattern (adopt directly — simplest approach)
    NO → Does the downstream team have influence to fix the upstream model?
        YES → Negotiate model improvements (Partnership or Customer-Supplier terms)
        NO → Anti-Corruption Layer pattern (protect downstream from poor upstream model)
NO → Does the downstream context need only a subset of upstream concepts?
    YES → ACL with selective mapping (translate only what's needed)
    NO → Does the mismatch affect more than 50% of the integration surface?
        YES → Anti-Corruption Layer pattern (high translation cost now, but model purity preserved)
        NO → Consider if the downstream context can adjust its language (cheaper than ACL)
            YES → Adjust downstream Ubiquitous Language to align (if alignment is possible)
            NO → Anti-Corruption Layer pattern

---

## Rationale

ACL preserves downstream model independence at the cost of translation code. Conformist is cheaper but creates coupling — the downstream inherits all upstream model quality issues. Use ACL when the upstream language or model quality would pollute the downstream. Use Conformist only when the upstream model is mature, well-designed, and language-compatible.

---

## Recommended Default

**Default:** Anti-Corruption Layer downstream, unless the upstream model is demonstrably well-designed and language-compatible.

**Reason:** The cost of ACL is a predictable maintenance burden; the cost of Conformist is unpredictable coupling that surfaces as incidents when upstream changes.

---

## Risks Of Wrong Choice

Conformist with poor upstream model: downstream accumulates technical debt from foreign concepts. ACL when Conformist would suffice: unnecessary translation code, slower throughput, higher maintenance cost.

---

## Related Rules

- Rule 2: Use ACL downstream when the upstream context's language cannot be adopted
- Rule 1: Document every context relationship using one of the 7 standard patterns

---

## Related Skills

- Implement an Anti-Corruption Layer
- Define Context Mapping Relationships

---

## Decision: Partnership vs Shared Kernel vs Customer-Supplier

---

## Decision Context

Choose among the three high-collaboration context mapping patterns for closely related bounded contexts.

---

## Decision Criteria

* performance considerations: Shared Kernel adds synchronization cost; Partnership adds ceremony overhead
* architectural considerations: Shared Kernel creates shared model dependency; Partnership maintains separate models
* security considerations: Shared Kernel exposes internal data across contexts
* maintainability considerations: Partnership requires regular sync meetings; Shared Kernel requires coordinated change approval

---

## Decision Tree

Is the integration surface small (<10% of domain concepts)?
↓
YES → Are these concepts foundational and stable (value objects, identities)?
    YES → Shared Kernel pattern (share stable value objects only)
    NO → Could the integration be handled asynchronously via events?
        YES → Customer-Supplier via events (less coupling)
        NO → Shared Kernel with tight change control (document approval process)
NO → Do both teams have equal organizational power and collaborative culture?
    YES → Do the contexts need to be deployed together to function?
        YES → Are both teams willing to coordinate all changes?
            YES → Partnership pattern (full collaboration, joint planning, shared milestones)
            NO → Customer-Supplier with negotiation terms (formalize expectations)
        NO → Partnership pattern still feasible (separate deployments, joint planning)
    NO → Does the upstream team hold power over the downstream?
        YES → Customer-Supplier pattern (formalize upstream's obligations to downstream)
        NO → Equal power, unequal collaboration willingness?
            YES → Customer-Supplier with written terms (protect downstream legally)
            NO → Evaluate non-collaborative patterns (OHS, Separate Ways)

---

## Rationale

Shared Kernel works best for small, stable shared concepts (value objects like Money, OrderId). Partnership works when both teams collaborate intensively and have equal influence. Customer-Supplier formalizes an inherently unequal relationship, protecting the dependent team. Misapplying these patterns — especially Shared Kernel for large shared models — creates coupling that undermines the benefits of bounded contexts.

---

## Recommended Default

**Default:** Customer-Supplier over Partnership; Shared Kernel only for value objects.

**Reason:** Customer-Supplier provides structure without requiring high collaboration bandwidth. Partnership assumes a level of organizational alignment that rarely persists. Shared Kernel is the riskiest — it's easy to expand, hard to shrink.

---

## Risks Of Wrong Choice

Partnership without equal power: the stronger team dominates, weaker team becomes de facto Conformist. Shared Kernel expansion: gradual model pollution, loss of context independence. Customer-Supplier without terms: upstream breaks downstream without notice.

---

## Related Rules

- Rule 3: Establish a Customer-Supplier relationship when the upstream controls the schedule
- Rule 4: Avoid Shared Kernel unless the shared part is small, stable, and agreed

---

## Related Skills

- Define Context Mapping Relationships
- Identify Bounded Contexts

---

## Decision: Separate Ways vs Full Integration

---

## Decision Context

Determine whether two bounded contexts should integrate or operate independently with data duplication.

---

## Decision Criteria

* performance considerations: Separate Ways avoids all integration latency; integration adds network calls and serialization
* architectural considerations: Separate Ways trades consistency for autonomy; integration adds dependency
* security considerations: Separate Ways limits data exposure; integration opens cross-context data flow
* maintainability considerations: Separate Ways duplicates data and logic; integration adds contract maintenance

---

## Decision Tree

Does the downstream context need real-time data from the upstream context?
↓
YES → Is the data critical for correct operation (financial amounts, inventory counts)?
    YES → Integrate (consistency is non-negotiable — use Customer-Supplier or OHS)
    NO → Can the downstream tolerate stale data (minutes/hours old)?
        YES → Is the data read-mostly or rarely changing?
            YES → Separate Ways with event-based copy (consume events, store local copy)
            NO → Periodic sync (batch ETL, cached read — acceptable staleness)
        NO → Integrate (latency requirements force direct integration)
NO → Would the integration complexity exceed the cost of occasional duplication?
    YES → Separate Ways pattern (maintain independent data stores)
    NO → Does the data change frequently enough that duplication becomes complex?
        YES → Integrate (change tracking and sync logic costs outweigh integration cost)
        NO → Is duplication already happening ad-hoc without coordination?
            YES → Formalize Separate Ways (document what's duplicated and why)
            NO → Separate Ways with explicit data ownership (each context owns its copy)

---

## Rationale

Separate Ways is the most robust pattern — zero cross-context dependency, zero integration failures. But it requires accepting data duplication and eventual inconsistency. Use it when the data changes slowly, the integration cost is high, or the downstream only occasionally needs the data. Integrate when real-time consistency is critical or when the data changes so frequently that sync logic becomes complex.

---

## Recommended Default

**Default:** Separate Ways with event-based data copy unless real-time consistency is required.

**Reason:** Most business data can tolerate minutes of staleness. Event-based copy provides eventual consistency without synchronous API coupling. Reserve real-time integration for genuinely critical paths.

---

## Risks Of Wrong Choice

Separate Ways without data ownership: duplication goes unchecked, drift causes bugs. Integration without necessity: added latency, failure modes, contract maintenance burden for rarely-used data.

---

## Related Rules

- Rule 5: Use Separate Ways when integration cost outweighs benefit
- Rule 1: Document every context relationship using one of the 7 standard patterns

---

## Related Skills

- Define Context Mapping Relationships
- Identify Bounded Contexts
- Implement Domain Events
