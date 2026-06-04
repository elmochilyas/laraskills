# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Shared kernel design: minimal shared code
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The Shared Kernel is the minimal set of code that multiple bounded contexts share. It must be the most stable code in the system—changing rarely and only with broad coordination. Contents typically include: base value objects (Money, Email), foundational interfaces (EventBus, Logger), and shared enums. The rule: share what would be unacceptably painful to duplicate, but nothing else. Every item in the shared kernel is a coupling point—more items mean more coupling.

---

# Core Concepts

**What belongs:**
- Value objects that are genuinely universal: `Money`, `Email`, `Address`
- Foundation interfaces: `EventDispatcher`, `Logger`, `IdGenerator`
- Shared enums: `Currency`, `Country`, `Language`
- Base classes (with caution): `AggregateRoot`, `Entity`, `ValueObject`

**What doesn't belong:**
- Business logic (discount calculations, validation rules)
- Domain-specific concepts (even if shared)
- Infrastructure code (database access, HTTP clients)
- DTOs for cross-context communication (these belong to the provider context)

---

# Mental Models

**The "Evolutionary Shared Kernel" model:** The shared kernel emerges, it isn't designed upfront. Extract to shared when the third context needs the same concept. The first two contexts can duplicate.

**The "Shared Kernel as Coupling" model:** Every item in the shared kernel binds all contexts to it. Changes to shared code affect all contexts. The smaller the shared kernel, the more independent the contexts.

---

# Internal Mechanics

The shared kernel typically lives in a dedicated namespace:
```
app/Domains/Shared/
├── ValueObjects/
│   ├── Money.php
│   └── Email.php
├── Contracts/
│   └── EventDispatcher.php
└── Enums/
    └── Currency.php
```

---

# Patterns

**Stable interface, proliferate implementations:** Shared kernel defines interfaces. Each context implements its own version. This keeps coupling at the interface level.

**Value objects as the safest sharing:** Immutable value objects with no behavior beyond self-validation. These are the lowest-risk items to share.

---

# Architectural Decisions

**Add to shared kernel when:** Three or more contexts independently need the same concept, and the concept is stable.

**Duplicate instead of sharing when:** The concept might evolve differently across contexts, or only two contexts use it.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eliminates unacceptable duplication | Creates coupling point | Changing shared code requires all-context synchronization |
| Single source of truth for fundamental types | Shared kernel must be stable | Refactoring shared code is expensive |
| Reduces code volume | Shared kernel can become a dumping ground | Every "common" thing ends up in shared |

---

# Common Mistakes

**Business logic in shared kernel:** A `DiscountCalculator` in shared "because all contexts need discounts." Discount rules change differently per context. Duplicate.

**Model classes in shared kernel:** A shared `User` Eloquent model used by all contexts. This creates maximum coupling—every context depends on the same model structure.

**Large shared kernel:** A shared kernel with 50+ classes. This is a sign that context boundaries are wrong or that shared kernel has become a dumping ground.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-01 Context identification | DBC-02 Context mapping | MMD-08 Shared kernel |
| DBC-05 Model ownership | MMD-08 Shared kernel | CPC-01 Interface contracts |

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
