# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Shared kernel design: minimal shared code
Knowledge Unit ID: DBC-03
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

The Shared Kernel is the minimal set of code that multiple bounded contexts share. It must be the most stable code — changing rarely and only with broad coordination. Contents: base value objects (Money, Email), foundational interfaces (EventBus, Logger), shared enums. Rule: share what would be unacceptably painful to duplicate, but nothing else. Every item in the shared kernel is a coupling point.

---

# Core Concepts

- **Belongs**: Universal value objects (Money, Email, Address), foundation interfaces (EventDispatcher, Logger), shared enums (Currency, Country), base classes (AggregateRoot, Entity).
- **Doesn't belong**: Business logic (discount calculations), domain-specific concepts, infrastructure code, DTOs for cross-context communication.
- **Evolutionary**: Extract to shared when third context needs it. First two contexts can duplicate.

---

# When To Use

- Three or more contexts independently need the same stable concept.

---

# When NOT To Use

- Only two contexts use it (duplicate instead).
- Concept might evolve differently across contexts.
- Business logic (even if shared across contexts).

---

# Best Practices

- **Extract from duplication, not from upfront design.** WHY: Premature extraction creates wrong abstractions. Wait until the third context needs the same thing.
- **Value objects are the safest thing to share.** WHY: Immutable value objects with no behavior beyond self-validation are lowest-risk items to share.
- **Prefer stable interfaces over shared implementations.** WHY: Shared kernel defines interfaces; each context implements its own version. This keeps coupling at the interface level.
- **Keep the shared kernel small.** WHY: A shared kernel with 50+ classes signals wrong context boundaries or a dumping ground. Every item is a coupling point.

---

# Architecture Guidelines

- Shared kernel in dedicated namespace: `app/Domains/Shared/`.
- Contents: value objects (stable), contracts (stable), enums (stable).
- Business logic, Eloquent models, and domain-specific concepts belong in contexts, not shared.

---

# Performance Considerations

- No runtime cost. Shared code is just regular PHP classes.

---

# Security Considerations

- Shared code is accessible to all contexts. Ensure no sensitive logic exposed.

---

# Common Mistakes

1. **Business logic in shared kernel:** `DiscountCalculator` in shared because "all contexts need discounts." Cause: DRY. Consequence: discount rules differ per context but are locked into shared. Better: duplicate per context.

2. **Model classes in shared kernel:** Shared `User` Eloquent model. Cause: convenience. Consequence: maximum coupling — every context depends on same model structure. Better: each context owns its model.

3. **Large shared kernel:** 50+ classes. Cause: dumping ground. Consequence: contexts coupled through shared code. Better: keep minimal.

---

# Anti-Patterns

- **Shared kernel as dumping ground**: Everything "common" ends up in shared.
- **Mutable shared state**: Global state in shared kernel modified by different contexts.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-01 Context identification | DBC-02 Context mapping | MMD-08 Shared kernel |
| DBC-05 Model ownership | MMD-08 Shared kernel | CPC-01 Interface contracts |

---

# AI Agent Notes

- Default to duplication, not sharing. Extract only when third consumer emerges.
- Never place business logic or Eloquent models in shared kernel.
- Value objects are the safest shared items.

---

# Verification

- [ ] Shared kernel contains only stable, cross-cutting code
- [ ] No business logic in shared kernel
- [ ] No Eloquent models in shared kernel
- [ ] Shared kernel is small (<20 classes)
- [ ] Content is extracted from duplication (3+ consumers)
