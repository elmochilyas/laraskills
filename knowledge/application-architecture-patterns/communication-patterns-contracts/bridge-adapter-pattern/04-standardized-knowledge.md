# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Bridge/adapter pattern for context boundaries
Knowledge Unit ID: CPC-07
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The Bridge pattern separates abstraction (the contract) from implementation (the concrete service). At context boundaries, this means the consuming context depends on an interface (the bridge), not the concrete implementation. The Adapter pattern translates between interfaces: the adapter wraps the concrete context's implementation and adapts it to the contract expected by the consumer. Together, Bridge + Adapter allow Context A to call Context B without knowing Context B exists.

---

# Core Concepts

- **Bridge:** An interface that both contexts agree on. The contract is defined in a shared location (or duplicated per context). Each context implements the bridge independently.
- **Adapter:** A wrapper that converts one interface to another. When the producer's interface doesn't match the consumer's expected contract, the adapter does the conversion.
- **Laravel contract + binding:** Define the bridge as a Laravel `Contract`. Bind the adapter in the service provider.

---

# When To Use

- Every cross-context synchronous call.
- Swapping implementations (fake vs real, dev vs production).
- Testing: inject mock bridges.

---

# When NOT To Use

- Within a single context (interfaces are internal, no adapter needed).
- Trivial delegation where the producer's interface is already the contract.

---

# Best Practices

- **Bridge every cross-context call.** WHY: Directly instantiating a service from another context creates tight coupling. The consuming context now knows the producer's namespace, constructor, and implementation. Always use a bridge/adapter pair.
- **Adapter lives in the producer context.** WHY: The adapter that implements the bridge should live in the context that provides the functionality. The consumer depends only on the bridge interface. If the adapter is in the consumer context, the consumer now knows both the bridge and the producer's API — defeating the purpose.
- **Define the bridge in a shared kernel.** WHY: The bridge contract lives in a shared location. Both contexts depend on the shared kernel (not on each other). This prevents circular dependencies.
- **Use tiered adapters.** WHY: Multiple adapters for different environments. Development uses `FakePaymentAdapter`. Production uses `BillingPaymentAdapter`. Swappable without consumer changes.

---

# Architecture Guidelines

- Bridge = interface contract between contexts.
- Adapter = wrapper that converts producer interface to bridge contract.
- Bridge defined in shared kernel.
- Adapter lives in producer context.
- Laravel: bind adapter to bridge in service provider.

---

# Performance Considerations

- Bridge/adapter adds one extra method call (microseconds). Negligible.

---

# Security Considerations

- The bridge contract defines what operations and data cross the boundary. The adapter enforces the contract.

---

# Common Mistakes

1. **Skipping the bridge:** Importing and directly using another context's classes. Cause: convenience. Consequence: dependency is now explicit and tight — any change in the producer breaks the consumer. Prefer a bridge for cross-context communication. For simple same-module calls, direct communication may be acceptable.

2. **Adapter in the consumer context:** The consumer creates the adapter. Cause: misunderstanding the pattern. Consequence: the consumer now knows both the bridge and the producer's API. The point of the adapter is defeated. Better: adapter lives in the producer context.

3. **Bridge = DTO only:** Defining the bridge as only a data contract without any operation contract. Cause: incomplete implementation. Consequence: the consumer still couples to the producer's implementation for calling operations. Better: bridge includes both data and operation contracts.

---

# Anti-Patterns

- **Direct dependency**: Skipping the bridge entirely. Tight coupling between contexts.
- **Wrong-side adapter**: Adapter in consumer context. Consumer knows producer's API.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-01 Interface contracts | CPC-05 Message bus | CPC-12 Facade pattern risks |
| SLP-03 Contract interfaces | DBC-04 Anti-corruption layer | AEG-07 Dependency rules enforcement |

---

# AI Agent Notes

- Create bridge interfaces for every cross-context sync call.
- Adapter goes in the producer context, bridge in shared kernel.
- Use Laravel's contract system for bridge definitions.
- Bind adapters in service providers.

---

# Verification

- [ ] Cross-context calls use bridge interface, not direct instantiation
- [ ] Adapter lives in the producer context (not consumer)
- [ ] Bridge is defined in a shared location (shared kernel or contracts directory)
- [ ] Laravel service provider binds adapter to bridge
- [ ] Tiered adapters exist for different environments
