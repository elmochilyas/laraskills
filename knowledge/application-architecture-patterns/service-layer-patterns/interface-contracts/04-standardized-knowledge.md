# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Interface contracts for services: when and why
Knowledge Unit ID: SLP-13
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Interface contracts for services (`UserServiceInterface` → `UserService`) are debated in Laravel. Proponents argue they enable loose coupling, test mocking, and implementation swapping. Critics argue they add ceremony without value when only one implementation exists. Pragmatic consensus: add interfaces only when you need multiple implementations (different drivers, testing with mocks, legacy integration), when the interface is shared across module boundaries, or when using Dependency Inversion in clean architectures.

---

# Core Concepts

- **Interface contract**: Declares what a service does without specifying how. `interface PaymentService { charge(); refund(); }`.
- **Implementation**: `class StripePaymentService implements PaymentService`.
- **Binding**: `$this->app->bind(PaymentService::class, StripePaymentService::class)`.
- **Consumption**: Consumers depend on interface, not concrete class.

---

# When To Use

- Multiple implementations likely (payment gateways, notification channels, file storage, cache backends).
- Interface consumed across module boundaries.
- Following Clean Architecture port-adapter pattern.
- Testing with mocks where interface mocking is preferred.

---

# When NOT To Use

- Single implementation with no planned alternative.
- Service consumed only within same layer/module.
- Interface-per-class syndrome (interface for every class, even value objects).

---

# Best Practices

- **Add interfaces only at variation points.** WHY: YAGNI — if only one implementation exists and no alternative is planned, an interface is speculative overhead. Add when the second implementation is needed.
- **Avoid interfaces that mirror implementation exactly.** WHY: Same methods, same signatures — provides no abstraction. The interface should represent a different level of abstraction.
- **Be consistent as a team.** WHY: Either use interfaces for all services or none. Inconsistency is worse than either choice.
- **Watch for interface pollution.** WHY: A single interface with 20+ methods covering every possible use case is too large. Split by client needs (Interface Segregation Principle).

---

# Architecture Guidelines

- Interface-per-service: service consumed by another module, multiple implementations, or Clean Architecture port-adapter.
- No interface: service consumed within same layer, single implementation, no planned alternative.
- Local interface (minimal): define interface next to implementation, use locally.

---

# Performance Considerations

- Interface dispatch has negligible overhead. PHP 8+ JIT eliminates virtual call cost.

---

# Security Considerations

- No direct implications. Interfaces are structural, not security-related.

---

# Common Mistakes

1. **Interface-per-class without reason:** Every service has an interface including single-implementation services. Cause: following pattern blindly. Consequence: ceremony without value. Better: add only where variation exists.

2. **Interface mirrors implementation exactly:** Methods and signatures identical. Cause: no abstraction. Consequence: interface adds no value. Better: design interface at a different abstraction level.

3. **Missing interfaces when swapping needed:** Payment service without interface, need to switch providers. Cause: started without interface. Consequence: harder swap. Better: add interface at variation points.

---

# Anti-Patterns

- **Interface/implementation drift**: Method added to implementation but not to interface. Type errors at runtime.
- **Interface pollution**: Single interface with 20+ methods. Split by client.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-09 Dependency injection | CPC-01 Interface contracts | SLP-14 Repository pattern debate |
| SLP-12 Service binding strategies | LAP-04 Dependency Rule | LAP-09 Framework independence |

---

# AI Agent Notes

- Default to no interface for business services (UserService, OrderService).
- Add interface for infrastructure services (payment, notification, storage).
- Only generate interfaces at actual variation points.

---

# Verification

- [ ] Interfaces exist only at variation points
- [ ] No interface-per-class syndrome
- [ ] Interface provides abstraction beyond mirroring implementation
- [ ] Interface-to-implementation bindings are registered
- [ ] No interface pollution (20+ methods)
