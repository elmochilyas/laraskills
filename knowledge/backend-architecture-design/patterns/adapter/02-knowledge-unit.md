# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Adapter pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Adapter converts the interface of a class into another interface clients expect, enabling classes with incompatible interfaces to work together. In Laravel, adapters are fundamental to the framework's driver architecture — cache, queue, mail, and filesystem all wrap third-party SDKs behind consistent Laravel interfaces. The pattern is essential for integrating external services while protecting the application from vendor lock-in and API changes.

---

# Core Concepts

- Target interface: the interface clients depend on
- Adaptee: the existing class with incompatible interface
- Adapter: bridges target and adaptee, translating method calls
- Class Adapter (via inheritance): extends adaptee, implements target — less common in PHP
- Object Adapter (via composition): holds adaptee instance, implements target — preferred in PHP

---

# Mental Models

- **Translation Layer**: Adapter translates between two interface languages
- **Wrapper not Decorator**: Adapter changes interface, Decorator adds behavior
- **Vendor Isolation**: Adapter protects against third-party library changes
- **Payment Gateway Pattern**: Multiple payment providers behind single checkout interface

---

# Internal Mechanics

Object Adapter stores adaptee in constructor, implements target interface, delegates to adaptee with translated arguments and return types. PHP's lack of method overloading means type coercion and default values handle interface mismatches. The complexity is in the translation logic — mapping concepts between two models.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Object Adapter | Interface translation | Composition over inheritance, testable | Boilerplate method delegation |
| Class Adapter | Interface + implementation reuse | Less delegation code | Tight coupling, PHP single inheritance |
| Two-Way Adapter | Interoperability between two systems | Reduces number of adapter classes | More complex, harder to maintain |

---

# Architectural Decisions

- Prefer Adapter over modifying third-party code
- Use Adapter at system boundaries (HTTP clients, SDKs, file systems)
- Design Adapter interface first, then implement adapters for each vendor
- Do NOT use Adapter for internal code — refactor the internal interface instead
- Consider Adapter vs Anti-Corruption Layer: ACL is broader (includes translation of entire subsystem concepts)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Vendor independence when SDK changes | Translation overhead per method call | Minor performance impact |
| Consistent interface across providers | Duplication across adapters | Each adapter reimplements similar translation |
| Testable via interface mocking | Adapter must be kept in sync with vendor API | Maintenance burden when vendor releases new features |
| Runtime driver switching | Configuration complexity | Extra indirection for simple operations |

---

# Performance Considerations

- Adapter method call overhead: negligible (single delegation)
- Translation of complex types (array → Object, Object → DTO): measurable for bulk operations (100k+)
- Consider caching adapter instance (singleton in container) for stateless adapters
- Avoid creating new adapter instances per request for expensive SDK initialization

---

# Production Considerations

- Log adapter method calls with vendor name for debugging
- Handle vendor-specific exceptions in adapter, translate to application exceptions
- Implement circuit breaker around adapter calls to slow/unstable external services
- Test adapter against actual vendor API in integration tests; mock for unit tests
- Version adapter interface when underlying vendor API changes semantically

---

# Common Mistakes

- Adapter that leaks vendor-specific exceptions → controller catches Stripe\Error when it should catch PaymentFailed
- Adapter doing more than translation (validation, logging, caching) → mixes responsibilities
- Not adapting return types → caller still depends on vendor types
- Adapter interface modeled after one specific vendor → new vendor can't conform to interface
- Adapter in domain layer → couples domain to infrastructure concern

---

# Failure Modes

- **Vendor API change without adapter update**: vendor deprecates method, adapter still calls it → runtime error
- **Rate limit not translated**: vendor rate limits but adapter doesn't surface throttle → silent failures
- **Missing method on adaptee**: new vendor doesn't support all target interface methods → NotImplementedException chain
- **Type coercion failure**: adapter returns string but target expects int → TypeError

---

# Ecosystem Usage

- **Laravel Framework**: `Illuminate\Filesystem\FilesystemAdapter` — wraps Flysystem; `Illuminate\Cache\XXXStore` — wraps various cache backends; `Illuminate\Mail\Transport\XXXTransport` — wraps mail drivers
- **Laravel Socialite**: OAuth provider adapters for GitHub, Google, Facebook
- **Laravel HTTP Client**: guzzle adapter wrapping PSR-18 interface

---

# Related Knowledge Units

**Prerequisites**: Interface segregation, Dependency injection | **Related**: Facade (simplified interface vs incompatible interface), Bridge (abstraction vs implementation decoupling), Anti-Corruption Layer | **Advanced**: Contract testing for adapters, Circuit breaker with adapter

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

