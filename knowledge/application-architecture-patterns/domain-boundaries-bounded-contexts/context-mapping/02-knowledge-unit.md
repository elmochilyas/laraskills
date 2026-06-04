# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Context mapping: relationships between contexts
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Context mapping documents the relationships between bounded contexts. Common relationship types include: Partnership (teams coordinate changes), Shared Kernel (shared code with synchronized changes), Customer-Supplier (one context provides data the other needs), Conformist (one context conforms to another's model), Anti-Corruption Layer (translation between contexts), Open Host Service (published API), and Separate Ways (no integration). Each relationship type implies different integration patterns and coupling levels.

---

# Core Concepts

**Context map relationship types:**
- **Partnership:** Two teams coordinate changes. Tight alignment, frequent communication.
- **Shared Kernel:** A shared subset of the domain model. Changes are synchronized.
- **Customer-Supplier:** Upstream context provides data; downstream consumes it. Upstream may need to accommodate downstream needs.
- **Conformist:** Downstream conforms to upstream's model without translation. Simplest but most coupling.
- **Anti-Corruption Layer:** Downstream translates upstream's model to its own. Protects downstream's model integrity.
- **Open Host Service:** Upstream publishes a clear API; any downstream can consume.
- **Separate Ways:** No integration. Different solutions for different contexts.

---

# Mental Models

**The "Diplomatic Relations" model:** Each relationship is a treaty between two sovereign entities (contexts). Some are close allies (Partnership), some are trade agreements (Customer-Supplier), some have embassies (Anti-Corruption Layer).

**The "Integration Cost" model:** More explicit integration (ACL, OHS) costs more upfront but provides better isolation. Less explicit integration (Conformist, Shared Kernel) costs less upfront but creates more coupling.

---

# Internal Mechanics

Context mapping is documented as a diagram or matrix:
```
[Identity] --(OHS)--> [Billing]
   |                      |
   |(ACL)              (Customer-Supplier)
   v                      v
[Catalog] <--(Partnership)-- [Inventory]
```

---

# Patterns

**Open Host Service + Published Language:** The most decoupled relationship. Upstream defines a clear API with its own domain language. Downstream consumes via translation.

**Anti-Corruption Layer for legacy integration:** When integrating with a legacy system, the ACL translates its model into the current context's model. This is the DBC-04 pattern.

**Shared Kernel for cross-cutting concepts:** When contexts share fundamental concepts (Money, Currency, Date), use a Shared Kernel with tight synchronization.

---

# Architectural Decisions

**Choose Partnership when:** Teams need tight coordination and changes are frequent.

**Choose Open Host Service when:** Upstream context has consumers that need clear, stable contracts.

**Choose Anti-Corruption Layer when:** Downstream context must be protected from upstream's model changes.

---

# Tradeoffs

| Relationship | Benefit | Cost |
|---|---|---|
| Partnership | Rapid iteration | High coordination overhead |
| Shared Kernel | No translation needed | Changes break both contexts |
| Customer-Supplier | Clear dependency direction | Upstream changes affect downstream |
| Anti-Corruption Layer | Complete isolation | Translation code overhead |
| Open Host Service | Clear contract | API maintenance cost |
| Separate Ways | Zero coupling | Redundant code |

---

# Common Mistakes

**No context map:** Contexts exist but relationships are undocumented. Integration patterns are inconsistent.

**Defaulting to Shared Kernel:** Sharing too much code across contexts. Creates hidden coupling.

**Defaulting to Separate Ways:** Two contexts implementing the same concept differently. Leads to business logic duplication.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-01 Context identification | DBC-03 Shared kernel | DBC-04 Anti-corruption layer |
| MMD-08 Shared kernel | CPC-01 Interface contracts | DBC-10 Legacy integration |

---

## Performance Considerations

Identifying bounded context boundaries adds negligible performance overhead at runtime. The cost is at design time: event storming sessions, context mapping workshops, and documentation. Once boundaries are identified, the performance characteristics depend on the communication pattern between contexts. Synchronous calls between contexts add network latency if services are separated. In a modular monolith, context boundaries add no runtime cost.

---

## Production Considerations

Bounded contexts must be enforced in production through CI checks (architecture tests, import rules). Without enforcement, boundaries degrade: cross-context direct model access creeps in, shared database tables emerge, and the bounded context becomes a folder boundary in name only. Production monitoring should track cross-context call volume and latency (if using service-level boundaries). Team ownership should align with context boundaries in production incident response.

---

## Failure Modes

**Leaky context boundary:** Other contexts directly access Eloquent models or database tables owned by a different context. The boundary exists in folder structure but not in runtime enforcement.

**Wrong boundary identification:** Splitting a domain where the concepts are tightly coupled causes transaction and consistency problems. The overhead of coordinating across the boundary exceeds the benefit of separation.

**Boundary erosion over time:** As the codebase evolves, changes naturally blur context boundaries. Regular architecture reviews and automated enforcement are required to maintain integrity.

---

## Ecosystem Usage

Event Storming (Alberto Brandolini) is the most popular technique for bounded context identification. The Context Mapper DSL provides tooling for context mapping. In the Laravel ecosystem, nwidart/laravel-modules and domain-based directory organization are the primary implementation approaches. Eric Evans Domain-Driven Design (2003) remains the definitive reference. Vaughn Vernons Implementing Domain-Driven Design provides practical implementation guidance.

---

## Research Notes

Research in 2025-2026 shows continued adoption of strategic DDD patterns in Laravel. The community consensus favors starting with coarse context boundaries and splitting later over premature fine-grained separation. The bounded context heuristic (language divergence, team alignment, data lifecycle) remains the standard identification approach. Anti-Corruption Layers are increasingly recognized as essential for legacy Laravel application integration.
