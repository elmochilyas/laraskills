# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Service Layer (Fowler) in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Service Layer defines an application boundary with a clean API for the presentation layer, encapsulating business logic, transactions, and security checks. It is the most commonly implemented enterprise pattern in Laravel — "Service classes" separate controllers (HTTP concerns) from business operations. The pattern prevents controller fat and domain leakage into presentation, providing a reusable, testable, and organized application boundary.

---

# Core Concepts

- Application boundary: clear separation between presentation and domain
- Service methods: coarse-grained operations that controllers call
- Transaction management: services typically manage transaction boundaries
- Security/authorization: services check permissions before operations
- Two styles: Domain Facade (thin service over Domain Model) vs Operation Script (service has business logic)

---

# Mental Models

- **Bank Teller**: Customer (controller) asks teller (service) to perform operations
- **API Surface**: Service methods form the application's API contract
- **Transaction Coordinator**: Service orchestrates multiple domain objects in one transaction
- **Use Case Interactor**: Each service method maps to a use case

---

# Internal Mechanics

Service class receives dependencies via constructor injection. Method receives primitive/request data, validates, executes business logic, manages transaction, returns result DTO or response data. Service does NOT know about HTTP — it receives parameters, returns values. Controller converts HTTP request to parameters, calls service, converts result to HTTP response.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Domain Facade Service | Thin layer over Domain Model | Minimal business logic in service | Services just delegate |
| Operation Script Service | Service contains business logic | All logic in one place for a use case | Duplication when multiple services need same logic |
| CRUD Service | Standard operations per entity | Consistent pattern across entities | May be over-abstracted |
| Action Class | Single-method service | SRP, easy to name | Many classes |

---

# Architectural Decisions

- Use Service Layer: always in Laravel apps beyond hello-world
- Use for: all operations that involve business rules, multiple steps, or side effects
- Use for: encapsulating transaction boundaries
- Use for: authorization checks before business operations
- Service layer vs Action class: service for related operations, action for single-purpose
- Avoid service layer when: controller directly calls repository (simple CRUD)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clean controller→service separation | Additional classes and interfaces | More files to maintain |
| Reusable across controllers, CLI, queues | Service may accumulate unrelated methods | God service, SRP violations |
| Testable without HTTP context | More test setup | Each service needs dependencies injected |
| Transaction boundary management | Transaction too wide or too narrow | Consistency issues |

---

# Performance Considerations

- Service method call: negligible overhead
- Transaction scope: service manages begin/commit — affects locking duration
- Service as facade over domain: no additional cost
- Service as script: same cost as Transaction Script

---

# Production Considerations

- Log service entry/exit with parameters (remove PII)
- Monitor service execution times per method
- Test services independently from controllers
- Document service method preconditions (authentication, authorization)
- Consider service-specific exception types

---

# Common Mistakes

- Fat service with 20+ methods → god object, SRP violation
- Service that knows about HTTP (request, session, auth facade) → couples domain to web
- Service returning HTTP response objects → cannot reuse for CLI/queue
- Anemic service: just calls repository with no logic → unnecessary layer
- Service with mixed concerns: reporting + CRUD + email in same class

---

# Failure Modes

- **Transaction too large**: service holds transaction open during slow external calls → lock contention
- **Missing authorization**: service performs operation before checking permissions → security gap
- **Service leak**: controller bypasses service and calls repository → business rules skipped
- **Inconsistent transactional behavior**: some service methods transactional, others not → data anomalies

---

# Ecosystem Usage

- **Laravel Services**: de facto standard for organizing business logic
- **Laravel Actions (lorisleiva/laravel-actions)**: alternative service layer implementation
- **Spatie/laravel-queueable-action**: queueable actions as service layer
- **Laravel controllers**: thin controllers delegating to service layer

---

# Related Knowledge Units

**Prerequisites**: Dependency injection, Controller patterns | **Related**: Transaction Script (service as organizer), Domain Model (service as facade), Action Domain classes, CQRS Service layer | **Advanced**: Service granularity decisions, Service composition, Service vs Use Case interactors

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

