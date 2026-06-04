# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Service Layer (Fowler) in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Service Layer organization — per entity vs per use case
* Decision 2: Service Layer thickness — thin (delegating) vs thick (logic-heavy)
* Decision 3: Service Layer HTTP isolation — framework-free vs mixed concerns

---

# Architecture-Level Decision Trees

---

## Decision: Service Layer Organization — Per Entity vs Per Use Case

---

## Decision Context

Choose how to organize service classes — one service per entity (OrderService) or one per use case (CreateOrderService).

---

## Decision Criteria

* performance considerations: both have negligible performance difference
* architectural considerations: per-use-case aligns with SRP and CQRS; per-entity is more conventional in Laravel
* security considerations: per-use-case allows granular auth; per-entity needs method-level authorization
* maintainability considerations: per-use-case prevents service bloat; per-entity is easy to discover

---

## Decision Tree

Does the entity have more than 7 public operations (create, update, cancel, refund, etc.)?
↓
YES → Consider splitting — 7+ methods suggests the service has too many responsibilities
    ↓
    Do different operations have different dependencies?
    YES → Split by use case (each service only injects what it needs)
    ↓
    Does this improve testability (fewer mocks per test)?
    YES → Per-use-case services are correct
    NO → Keep per-entity but split into command/query if concerns differ
    NO → Per-entity service is acceptable (cohesive group of related operations)
NO → Does the service mix commands and queries extensively?
    YES → Split into CommandService and QueryService (even within one entity)
    ↓
    Do writes and reads have different performance needs?
    YES → CQRS split: separate service for commands, separate for queries
    NO → Keep together but split method groups with comments/PHPDoc
    NO → Per-entity service is fine (2-7 methods, all related)

---

## Rationale

Per-entity services (OrderService, CustomerService) are conventional in Laravel and work well for entities with 2-7 operations. When an entity service exceeds 7 methods or has clearly different dependency requirements for different operations, split into per-use-case services. This improves testability and follows SRP.

---

## Recommended Default

**Default:** One service per entity (OrderService) for 2-7 related operations. Per-use-case services when methods exceed 7 or have diverging dependencies.

**Reason:** Per-entity services are easy to discover and understand. Per-use-case services prevent service bloat and improve testability at scale.

---

## Risks Of Wrong Choice

Per-entity with 15+ methods: god service, SRP violation, hard to test, conflicting dependencies. Per-use-case for everything: file proliferation, developers can't find the right service, navigation overhead.

---

## Related Rules

- Rule 1: Service Layer defines an application boundary with a clean API
- Rule 2: Keep services focused — split when they grow beyond 7 methods

---

## Related Skills

- Organize Service Classes
- Implement CQRS Service Split

---

## Decision: Service Layer Thickness — Thin (Delegating) vs Thick (Logic-Heavy)

---

## Decision Context

Choose how much business logic belongs in the Service Layer vs in domain objects.

---

## Decision Criteria

* performance considerations: thick services are slightly faster (no delegation); thin services add method call overhead
* architectural considerations: thin services keep logic in domain objects (anemic domain model risk); thick services may duplicate logic
* security considerations: thick services can centralize auth; thin services distribute auth to domain objects
* maintainability considerations: thin services are consistent with DDD; thick services risk becoming god classes

---

## Decision Tree

Does the domain have rich domain objects (entities with methods beyond getters/setters)?
↓
YES → Thin Service Layer (service delegates to domain objects, handles orchestration only)
    ↓
    Do domain objects contain most business rules and validations?
    YES → Service is correctly thin (just orchestrates: load, delegate, persist)
    NO → Domain objects are anemic — move logic from service to domain objects
NO → Does the application use Transaction Script pattern (procedural, no rich domain)?
    YES → Thick Service Layer (service contains the business logic directly)
    ↓
    Is the service method over 50 lines?
    YES → Extract logic into private methods or helper classes
    NO → Thick service is appropriate for Transaction Script pattern
NO → Evaluate: should this application have rich domain objects?
    YES → Move toward rich domain: shift logic from services to entities/value objects
    NO → Thick service with Transaction Script pattern is acceptable

---

## Rationale

Service Layer thickness depends on the domain logic pattern. With a Domain Model (rich domain objects), the service is thin — just orchestrating domain interactions. With Transaction Script (procedural), the service is thick — containing all business logic. The critical distinction is being intentional about the pattern, not accidentally mixing both.

---

## Recommended Default

**Default:** Thin Service Layer that delegates to domain objects. Thick services only with Transaction Script pattern and explicit intention.

**Reason:** Thin services keep business logic in the domain where it belongs, enabling reuse across services. Thick services risk duplicating logic and creating anemic domain models.

---

## Risks Of Wrong Choice

Thick service with rich domain objects: anemic domain model, logic scattered, duplicated across services. Thin service with Transaction Script: unnecessary delegation, logic extracted to non-existent domain objects.

---

## Related Rules

- Rule 3: Service Layer handles orchestration — not business rules
- Rule 4: Keep business logic in domain objects, not in services

---

## Related Skills

- Design Thin Service Layer
- Refactor Thick Service to Domain Layer

---

## Decision: Service Layer HTTP Isolation — Framework-Free vs Mixed Concerns

---

## Decision Context

Choose whether Service Layer classes should be framework-agnostic or may reference HTTP concerns.

---

## Decision Criteria

* performance considerations: HTTP isolation adds no performance overhead
* architectural considerations: framework-free services are reusable across transports; HTTP-coupled services are not
* security considerations: framework-free services prevent auth bypass via non-HTTP entry points
* maintainability considerations: framework-free services are testable without HTTP bootstrapping

---

## Decision Tree

Does the service method receive Request objects as parameters or return Response objects?
↓
YES → HTTP coupling — refactor
    ↓
    Can the input be replaced with a DTO or primitive parameters?
    YES → Replace Request with DTO: service receives `$dto->name` instead of `$request->input('name')`
    ↓
    Can the output be replaced with a domain result or DTO?
    YES → Replace Response with DTO: service returns result, controller formats response
    NO → Consider if the service is genuinely transport-specific (rarely the case)
    NO → Refactor: extract HTTP-specific concerns to controller, keep service pure
NO → Does the service use facades that couple to HTTP (Auth, Session, Request)?
    YES → Replace facades with injected interfaces/dependencies
    ↓
    Can the dependency be injected via constructor?
    YES → Constructor injection (e.g., `AuthManager` instead of `Auth` facade)
    NO → Method injection with interface (e.g., `process(LoggerInterface $logger)`)
NO → Does the service use `app()`, `config()`, or other Laravel globals?
    YES → Inject the specific value/object instead (config values, resolved instances)
    NO → Service is properly isolated from HTTP concerns

---

## Rationale

Service Layer classes should be framework-agnostic — no Request objects, no Response objects, no HTTP facades. This ensures services are reusable across transports (HTTP, CLI, queue) and testable without bootstrapping the framework. Controllers handle HTTP concerns; services handle business logic.

---

## Recommended Default

**Default:** Service methods accept primitives or DTOs, return results or DTOs. Controllers translate HTTP Request → DTO → Service → Response.

**Reason:** Transport-agnostic services are reusable across HTTP, CLI, and queue. Testing requires zero HTTP bootstrapping. Changes to the transport layer don't affect business logic.

---

## Risks Of Wrong Choice

HTTP-coupled services: untestable without HTTP, cannot reuse for CLI/queue, controller and service must change together. Overly abstracted DTOs for simple cases: unnecessary structures for a single parameter.

---

## Related Rules

- Rule 5: Service Layer must be framework-agnostic — no Request, Response, or HTTP facades
- Rule 6: Services should be reusable across transports (HTTP, CLI, queue)

---

## Related Skills

- Decouple Services from HTTP
- Design DTOs for Service Boundaries
- Test Services Without Framework
