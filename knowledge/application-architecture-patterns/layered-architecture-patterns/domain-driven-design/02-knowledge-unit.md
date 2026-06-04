# Domain-Driven Design Tactical Patterns in Laravel

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-06-domain-driven-design
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Domain-Driven Design (DDD) tactical patterns — Entities, Value Objects, Aggregates, Domain Events, and Repositories — provide a structural toolkit for modeling complex business domains in code. In Laravel, these patterns sit atop Clean/Hexagonal Architecture layering: the Domain layer contains pure business objects with no framework dependencies, while Laravel's infrastructure serves the Domain through port-adapter interfaces. This separation enables business logic to be tested without database or HTTP bootstrapping and allows the domain model to evolve independently of infrastructure concerns.

---

## Core Concepts
- **Entity**: An object with a distinct identity persisting over time and through changes to its properties; two entities with the same attribute values but different IDs are different
- **Value Object**: An immutable object defined by its attribute values, not identity; two value objects with the same values are interchangeable
- **Aggregate**: A cluster of Entities and Value Objects treated as a single unit for data changes; one Entity is the Aggregate Root enforcing all business invariants
- **Domain Event**: A record of a significant business occurrence in past tense, immutable data, dispatched inside Aggregate methods
- **Repository**: A persistence abstraction defined as an interface in Domain, implemented in Infrastructure, returning Domain objects (never Eloquent models)
- **Ubiquitous Language**: A shared vocabulary between domain experts and developers used directly in code, tests, and documentation

---

## Mental Models
1. **Screaming Architecture**: The codebase should "scream" the domain it models — a visitor should understand what the application does by reading class names (Invoice, Order, Shipment) rather than technical concepts (Controller, Model, Service).
2. **The Onion/Dependency Inversion**: Domain is the core with zero outward dependencies. Application depends on Domain. Infrastructure depends on Application. The dependency rule points inward — nothing in an inner circle knows about something in an outer circle.
3. **Testable Through Ports**: Domain objects are pure PHP with no framework dependencies — they can be unit tested in microseconds without Laravel bootstrapping. The Repository interface allows swapping Eloquent for in-memory implementations in tests.

---

## Internal Mechanics
An Aggregate Root, such as `Invoice`, holds an internal array of recorded events. When a domain method like `markAsPaid()` is called, the method validates invariants, mutates state, and appends a domain event (e.g., `InvoicePaid`) to the event array. After the aggregate is persisted through the Repository, the application layer calls `releaseEvents()` to collect and dispatch all domain events. Infrastructure listeners then handle side effects (emails, search indexing, audit logs). The aggregate never directly calls infrastructure — it records facts, and the application layer orchestrates the response to those facts.

---

## Patterns
### Aggregate Root Pattern
- **Purpose**: Protect consistency boundaries and enforce invariants through a single entry point
- **Mechanism**: All state changes go through the Root's public methods; internal entities are never exposed for direct modification
- **Benefits**: Invariants are enforceable and testable in one place
- **Tradeoffs**: Small aggregates reduce contention but increase number of repositories

### Repository Abstraction Pattern
- **Purpose**: Decouple domain logic from persistence technology
- **Mechanism**: Interface in Domain, Eloquent implementation in Infrastructure, injected via Service Provider
- **Benefits**: Domain is testable without database, persistence can be swapped
- **Tradeoffs**: Mapping overhead between Domain objects and Eloquent models

---

## Architectural Decisions
- **Choose DDD tactical patterns when**: Business logic is complex with many interacting rules, domain experts are available, codebase has a long expected lifespan, or multiple delivery mechanisms share business logic
- **Choose simpler Active Record when**: Simple CRUD with minimal business rules, prototyping, or the team is not trained in DDD concepts
- **Key decision**: Keep Aggregates small (5-7 entities max) and enforce invariants through the Root only

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Business logic testable without Laravel bootstrap | Mapping between Domain objects and Eloquent models adds overhead | Overhead is typically <5ms per request for real aggregates |
| Ubiquitous Language aligns code with business | Requires domain expert collaboration and ongoing refinement | Without expert input, language drifts and loses precision |
| Domain evolves independently of infrastructure | More classes and interfaces than Active Record approach | Team must be committed to maintaining the pattern |
| Side effects decoupled via Domain Events | Eventual consistency adds complexity to reasoning about state | Queue non-critical listeners to manage consistency tradeoffs |

---

## Performance Considerations
Mapping between Domain objects and Eloquent models adds overhead — profile real aggregates, not micro-benchmarks (typically <5ms per request). Aggregate size directly affects database transaction contention: smaller Aggregates reduce locking and improve throughput. Domain Events dispatched synchronously add latency proportional to listener execution — queue non-critical listeners. Value Object allocation cost is negligible for typical request volumes (<0.1ms per hundred objects).

---

## Production Considerations
Domain layer must have zero Laravel framework dependencies — no facades, helpers, Eloquent, or contracts. Repository implementations in Infrastructure handle Eloquent mapping. Service Providers in Infrastructure register port-adapter bindings. Monitor transaction contention for large Aggregates in production. Ensure Domain Events have idempotent listeners for reliable processing.

---

## Common Mistakes
1. **Anemic Domain Model**: Domain objects with only getters/setters, all logic in services. Business logic must live in the Domain objects, not in services.
2. **Giant Aggregates**: Modeling the entire database as a single Aggregate creates performance problems and cognitive overhead. Split into small, focused Aggregates.
3. **Eloquent in Domain**: Using Eloquent models as Domain objects couples Domain to Laravel. Create pure Domain classes and map in Infrastructure.
4. **Commands disguised as events**: `PayInvoice` is a command (intention); `InvoicePaid` is an event (fact). Events are past tense.
5. **Repository per table**: Creating Repository interfaces for every database table even when not an Aggregate Root.

---

## Failure Modes
- **Framework-coupled domain**: Domain classes depending on Eloquent or facades become untestable without Laravel bootstrap
- **Event flood**: Dispatching Domain Events for every minor property change causes listener overload and debugging difficulty
- **Transaction boundary misalignment**: Aggregate boundaries that do not match transaction boundaries cause consistency issues
- **Ubiquitous language drift**: Without ongoing domain expert collaboration, the language becomes divorced from business reality

---

## Ecosystem Usage
Laravel's Eloquent ORM is the primary persistence mechanism that Repository implementations wrap. Packages like `spatie/laravel-data` and `spatie/laravel-event-sourcing` provide DTO and event sourcing support. The `laravel-common` package includes base repository patterns. Many enterprise Laravel projects use DDD tactical patterns within Clean Architecture or modular monolith structures.

---

## Related Knowledge Units
### Prerequisites
- LAP-02 Clean Architecture
- LAP-03 Hexagonal Architecture
- LAP-04 Dependency Rule

### Related Topics
- LAP-07 Value Objects
- LAP-08 Domain Events
- LAP-10 Domain-Entity Mapping

### Advanced Follow-up Topics
- Event Sourcing and CQRS
- MMD-15 Event Sourcing/CQRS
- DBC-01 Context Identification

---

## Research Notes
The most important DDD rule for data integrity: Value Objects are readonly and validate on construction. Domain Events are past tense facts, not commands. Always generate Repository interfaces in the Domain layer and implementations in Infrastructure. When generating code for a complex domain, start with Ubiquitous Language documentation before writing any code.
