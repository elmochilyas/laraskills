# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: Facade pattern risks at context boundaries
Knowledge Unit ID: CPC-12
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

The Facade pattern provides a simplified interface to a complex subsystem. At context boundaries, facades are risky: they can evolve into god objects, obscure real coupling, and hide cross-context dependencies. A facade that exposes many methods from multiple internal services becomes a leaky abstraction. Developers end up working around the facade by importing internal classes directly. The alternative is to use explicit Bridge/Adapter contracts per capability, rather than a single unified facade per context.

---

# Core Concepts

- **Facade:** A single class that delegates to multiple internal services, exposing a unified interface.
- **God facade anti-pattern:** A facade that grows to expose dozens of methods, each delegating to different services. Becomes a coupling point for the entire context.
- **Leaky abstraction:** A facade that exposes methods which require knowledge of the underlying services' internals (e.g., calling `$facade->prepareInvoice()` which requires calling `$facade->validateAddress()` first).

---

# When To Use

- Wrapping external third-party libraries (Stripe, Twilio, Mailchimp).
- Genuinely complex subsystems where the consumer needs a simplified interface.

---

# When NOT To Use

- Cross-context boundaries (use multiple small capability interfaces instead).
- When the facade would grow beyond 5-7 methods.

---

# Best Practices

- **Use facades for external libraries only.** WHY: The facade isolates the third-party API from the rest of the context. Changes in the third-party library only affect the facade, not the consumers.
- **Use capability-based interfaces instead of context facades.** WHY: Instead of one facade per context (`BillingFacade`), define one interface per capability (`PaymentProcessor`, `InvoiceGenerator`, `TaxCalculator`). Consumers depend only on what they need.
- **Keep facades small.** WHY: If a facade is necessary, keep it focused on a single concern. Split when it grows beyond 5-7 methods. A growing facade is a sign it needs decomposition.
- **Never expose internal types through the facade.** WHY: If the facade returns internal value objects or enums, consumers depend on them. Changes to internals break consumers.

---

# Architecture Guidelines

- Avoid context-level facades (single `BillingFacade` for everything).
- Prefer multiple small interfaces per capability.
- Use facades only for third-party or genuinely complex subsystems.
- Split facades that exceed 5-7 methods.
- Ensure facades don't expose internal types.

---

# Performance Considerations

- Facade adds one extra delegation layer (microseconds). Negligible.

---

# Security Considerations

- A god facade may inadvertently expose operations that shouldn't be accessible cross-context. Smaller interfaces restrict access per capability.

---

# Common Mistakes

1. **God facade:** A facade with dozens of unrelated methods. Cause: incremental growth without refactoring. Consequence: every cross-context call goes through one class — bottleneck and coupling point. Better: split into capability-based interfaces.

2. **Facade that uses internal types:** The facade exposes internal classes, value objects, or enums. Cause: convenience. Consequence: consumers depend on the facade's internals. Better: facade should use only shared/public types.

3. **Facade as the only entry point:** Developers must use the facade even for simple operations. Cause: rigid design. Consequence: the facade adds ceremony without value for simple operations. Better: allow direct use of capability interfaces for simple needs.

---

# Anti-Patterns

- **God facade context**: One monolithic facade per context. Grows unbounded and becomes a coupling hub.
- **Facade-only access**: No alternative entry point. Forces all consumers through the bloated facade.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-07 Bridge/adapter pattern | CPC-01 Interface contracts | DBC-04 Anti-corruption layer |
| DBC-01 Bounded context basics | CPC-06 Circuit breaker | DBC-05 Context mapping |

---

# AI Agent Notes

- Avoid single context-level facades. Use capability-based interfaces.
- Facades are acceptable for third-party library wrappers.
- Split any facade exceeding 5-7 methods.
- Never expose internal types through facades.

---

# Verification

- [ ] No single "god facade" per context (e.g., `BillingFacade` with 20+ methods)
- [ ] Capability-based interfaces used instead of context facades
- [ ] Facades (if used) are limited to 5-7 methods
- [ ] Facades don't expose internal types
- [ ] Third-party integrations use facades for isolation
