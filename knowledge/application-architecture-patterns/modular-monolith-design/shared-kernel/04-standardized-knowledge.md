# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Shared kernel: what belongs in shared vs. modules
Knowledge Unit ID: MMD-08
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

The shared kernel is the minimal set of code that multiple modules share: base value objects, cross-cutting interfaces, foundation types. The rule: shared code must be stable — it changes rarely, and when it does, every module updates simultaneously. Common mistakes: putting too much in shared (modules couple via shared code) or too little (duplication across modules). The shared kernel should be the smallest possible set that avoids unacceptable duplication.

---

# Core Concepts

- **Belongs in shared**: Base value objects (Money, Email, Address), cross-cutting interfaces (EventBus, Logger), foundation types (AggregateRoot, Entity, ValueObject), utility functions, shared constants/enums, contract interfaces owned by no single module.
- **Belongs in modules**: Business logic, domain models, Eloquent models, module-specific value objects, controllers, requests, resources, module-specific events.
- **Stability principle**: Shared kernel is the most stable code in the project. Changes require broad coordination.

---

# When To Use

- Three or more independent modules use the same concept, and the concept is stable (unlikely to diverge).

---

# When NOT To Use

- Only two modules need it (duplication is cheaper than wrong abstraction).
- The concept is still evolving (may diverge per module).
- Business logic or validation rules (belong in modules).
- Framework imports in shared kernel (couples all modules to framework).

---

# Best Practices

- **Extract from duplication, not from upfront design.** WHY: Premature extraction creates wrong abstraction. Wait until the third module needs the same thing.
- **Never share business logic.** WHY: Business rules belong in modules where they can evolve independently. Shared business logic prevents independent module evolution.
- **Never import Laravel facades in shared kernel.** WHY: Couples all modules to Laravel. Shared kernel should be framework-agnostic where possible.
- **Assign shared kernel ownership.** WHY: Changes need broader review than module changes because they affect all modules.

---

# Architecture Guidelines

- Treat `Shared/` as a special module that all others depend on. Shared has no module dependencies.
- Shared kernel requires comprehensive tests, thorough documentation, higher bar for change.
- Shared kernel changes require broader review than module changes.

---

# Performance Considerations

- No direct performance impact. Badly designed shared value objects instantiated in hot paths may create GC pressure — profile if concerned.

---

# Security Considerations

- Shared kernel has full application access through imports. Keep it minimal and audited.

---

# Common Mistakes

1. **Shared kernel as dumping ground:** Everything "common" goes into shared. Cause: convenience. Consequence: modules couple via huge shared namespaces. Better: extract only when three or more modules need it.

2. **Business logic in shared kernel:** Cross-cutting business rules in shared. Cause: thinking SRP applies centrally. Consequence: business logic isn't module-owned. Better: keep business logic in modules.

3. **Framework imports in shared:** Importing Laravel facades or helpers. Cause: habit. Consequence: all modules coupled to Laravel through shared.

---

# Anti-Patterns

- **Shared Eloquent model:** Placing User in shared kernel. Every module accesses it directly — creates implicit coupling between all modules.
- **Mutable shared state:** Global state in shared kernel modified by different modules.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-03 Module internal structure | DBC-03 Shared kernel design | DBC-01 Bounded context identification |
| MMD-01 Module vs microservice | CPC-01 Interface contracts | DBC-04 Anti-corruption layer |

---

# AI Agent Notes

- Default to duplication before extraction. Extract only when third consumer emerges.
- Never place Eloquent models or business logic in shared kernel.
- Keep shared kernel free of framework imports.

---

# Verification

- [ ] Shared kernel contains only stable, cross-cutting code
- [ ] No business logic in shared kernel
- [ ] No framework facades imported in shared kernel
- [ ] Shared kernel has comprehensive tests
- [ ] Three-plus modules use each shared component
