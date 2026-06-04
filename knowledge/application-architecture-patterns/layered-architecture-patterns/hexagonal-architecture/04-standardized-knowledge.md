# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Hexagonal/Ports and Adapters architecture concept
Knowledge Unit ID: LAP-03
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Hexagonal Architecture (Alistair Cockburn, 2005), also called Ports and Adapters, models the application as a "hexagon" (core) with symmetric ports for inbound and outbound communication. Ports are interfaces defined by the core; Adapters are implementations connecting the core to external systems. Unlike Clean Architecture's layers, Hexagonal treats all external systems symmetrically — databases, web frameworks, message queues are all equally "outside."

---

# Core Concepts

- **Port (interface):** Boundary defined by the core. Input ports define how the outside triggers the application (use cases). Output ports define how the application interacts with the outside (repositories, event buses).
- **Adapter (implementation):** Concrete code connecting a port to a specific technology. `WebController` is an inbound adapter. `EloquentUserRepository` is an outbound adapter.
- **The Hexagon (core):** Business logic containing use cases, domain entities, and port interfaces. Zero external dependencies.
- **Symmetry:** Database is not "lower" than the web interface — both are equally external.

---

# When To Use

- Application has multiple delivery mechanisms (HTTP + CLI + Queue)
- Framework-independence for core logic is required
- Infrastructure components need to be swappable
- Symmetrical treatment of external systems matches your mental model

---

# When NOT To Use

- Single delivery mechanism (HTTP only)
- Simple CRUD where infrastructure swapping is unlikely
- Small team without architectural experience
- When every external interaction having a port+adapter is overkill

---

# Best Practices

- **Keep ports pure — no framework types in method signatures.** WHY: Ports must only use core-defined types. A port accepting `Illuminate\Http\Request` leaks framework concerns into the core.
- **Test adapters against contract tests.** WHY: Each outbound port should have at least two implementations (production + test) verified against the same contract test suite.
- **Use primary (driving) and secondary (driven) adapter terminology.** WHY: Distinguishes what initiates interaction (controllers) from what reacts (repositories).
- **Validate adapter symmetry.** WHY: A use case should work identically whether called via HTTP, CLI, or queue — test through multiple adapter configurations.

---

# Architecture Guidelines

- In Laravel, inbound adapters are Controllers, Commands, and Queue Listeners.
- Outbound adapters are Repository implementations, Mail implementations, and external API clients.
- The core defines what it needs (interfaces); the outside provides implementations via dependency injection.
- Each port should represent a single concern — separate read ports from write ports.

---

# Performance Considerations

- Adapter indirection adds overhead per external call — virtual calls for interface dispatch.
- In high-throughput scenarios, the overhead can be measurable — profile before optimizing.
- Adapter count does not affect runtime performance directly.

---

# Security Considerations

- Authentication is typically handled by inbound adapters (controller middleware).
- The core should not handle authentication — it receives already-authenticated context.

---

# Common Mistakes

1. **Fat ports:** Port interfaces with too many methods. Cause: treating one port as the single interface to a domain concept. Consequence: ports violate Single Responsibility. Better: separate ports by concern (read vs write, specific use cases).

2. **Leaky port definitions:** Port methods accepting or returning framework types. Cause: convenience. Consequence: core depends on framework. Better: use only core-defined types in port signatures.

3. **Port proliferation:** Too many fine-grained ports. Cause: over-engineering. Consequence: indirection without clear benefit. Better: each port must justify its existence with a concrete variation point.

---

# Anti-Patterns

- **Adapter explosion**: Every infrastructure choice creates a new adapter — sometimes sharing is sufficient.
- **Anemic core**: Core contains only CRUD passthrough with no business logic — all value is in adapters.
- **Framework leak**: Framework-specific code in port interfaces or core logic.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-01 Three-layer architecture | LAP-04 Dependency Rule | LAP-09 Framework independence |
| LAP-02 Clean Architecture | LAP-07 Infrastructure layer | LAP-10 Domain entity mapping |

---

# AI Agent Notes

- Inbound adapters (controllers) call use cases; they do not contain business logic.
- Outbound adapters implement interfaces defined by the core; they contain technology-specific code.
- Never put framework imports in port interfaces or core classes.

---

# Verification

- [ ] Core has zero imports from `Illuminate\` or other external packages
- [ ] Every port interface uses only core-defined types in method signatures
- [ ] Inbound adapters only call inbound ports (use cases)
- [ ] Outbound adapters implement outbound ports defined by core
- [ ] Each adapter has at least one test verifying against port contract
- [ ] No controller contains business logic — only adapter code
