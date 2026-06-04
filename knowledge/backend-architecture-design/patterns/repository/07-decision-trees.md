# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Repository (Fowler) in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Repository vs direct Eloquent usage
* Decision 2: Repository interface design — generic vs specific
* Decision 3: Repository return type — domain entity vs Eloquent model

---

# Architecture-Level Decision Trees

---

## Decision: Repository vs Direct Eloquent Usage

---

## Decision Context

Choose whether to abstract persistence behind a Repository interface or use Eloquent models directly.

---

## Decision Criteria

* performance considerations: Repository adds mapping/delgation overhead; Eloquent direct is faster
* architectural considerations: Repository decouples domain from persistence; Eloquent direct couples them
* security considerations: Repository can enforce data access rules; Eloquent direct bypasses them
* maintainability considerations: Repository adds files but enables testing; Eloquent direct is simpler

---

## Decision Tree

Does the domain need to be persistence-ignorant (framework-agnostic domain layer)?
↓
YES → Repository pattern (domain defines interface, infrastructure implements)
    ↓
    Are there multiple persistence backends (MySQL + Redis + API)?
    YES → Repository with multiple implementations (the pattern pays off immediately)
    NO → Repository for DIP compliance and testability (domain layer doesn't import Eloquent)
NO → Is there a need to abstract complex queries for testing?
    YES → Repository (abstract query logic behind testable interface)
    NO → Direct Eloquent is sufficient
↓
How complex are the queries?
SIMPLE (find, create, update, delete) → Direct Eloquent or simple repository
COMPLEX (reporting, aggregation, custom joins) → Repository (abstracts query complexity)
    ↓
    Is the application expected to switch databases or ORMs?
    YES → Repository (abstraction for eventual migration)
    NO → Direct Eloquent (no migration planned)

---

## Rationale

Repository pattern is controversial in Laravel because Eloquent already provides similar abstraction. The decision hinges on whether you need persistence ignorance in your domain layer. If the domain layer must not import Eloquent (hexagonal architecture), Repository is required. For conventional Laravel apps where Eloquent is the domain model, Repository adds unnecessary indirection.

---

## Recommended Default

**Default:** Direct Eloquent for standard Laravel apps where Eloquent models ARE the domain. Repository pattern for hexagonal architecture, multi-backend, or when domain layer must be framework-agnostic.

**Reason:** Eloquent already provides collection-style access. Repository adds indirection without benefit unless you need persistence ignorance, multiple backends, or stricter domain/infrastructure separation.

---

## Risks Of Wrong Choice

Repository for every model: unnecessary indirection, Eloquent method mirroring (no abstraction benefit). Direct Eloquent with hexagonal architecture: domain layer imports framework, DIP violation. Repository returning Eloquent models: no real abstraction, still coupled to Eloquent.

---

## Related Rules

- Rule 1: Use Repository when domain layer must be persistence-ignorant
- Rule 4: Repository is not needed when Eloquent IS the domain model

---

## Related Skills

- Implement Repository Pattern
- Decide Repository vs Eloquent

---

## Decision: Repository Interface Design — Generic vs Specific

---

## Decision Context

Choose whether Repository interfaces are generic (CRUD for any entity) or specific (per-entity with tailored methods).

---

## Decision Criteria

* performance considerations: both have negligible difference
* architectural considerations: specific interfaces follow ISP; generic interfaces couple all clients to all methods
* security considerations: specific interfaces limit client access to necessary methods only
* maintainability considerations: generic interfaces reduce file count; specific interfaces are clearer

---

## Decision Tree

Do different entities need different query methods?
↓
YES → Specific interfaces per entity (e.g., `OrderRepositoryInterface` with `findByStatus()`, `UserRepositoryInterface` with `findByEmail()`)
    ↓
    Is there common CRUD shared across all entities?
    YES → Base interface with common methods, extended by specific interfaces
    ↓
    `OrderRepositoryInterface extends RepositoryInterface`
    Each entity adds its specific query methods
    NO → Fully specific interfaces (no shared base)
NO → Do all entities use identical CRUD with no custom queries?
    YES → Generic interface (one `RepositoryInterface<T>` if PHP 8.1+ with generics support)
    ↓
    Is the generic interface stable (not expected to change)?
    YES → Generic interface is acceptable
    NO → Specific interfaces absorb change better

---

## Rationale

Specific per-entity repository interfaces follow the Interface Segregation Principle — each client depends only on the methods it needs. A base CRUD interface is acceptable for shared operations, but each entity should extend it with domain-specific query methods. Generic interfaces alone are rarely sufficient in practice.

---

## Recommended Default

**Default:** Per-entity specific interfaces extending a base CRUD interface. `OrderRepositoryInterface extends RepositoryInterface` with `findByStatus()` and other domain-specific methods.

**Reason:** Specific interfaces follow ISP, are stable (don't change when other entities change), and clearly communicate each entity's query capabilities.

---

## Risks Of Wrong Choice

Interfaces too generic: clients depend on methods they don't use, ISP violation. Interfaces too specific: one interface per query method, interface explosion. No interfaces: concrete coupling, cannot mock in tests.

---

## Related Rules

- Rule 2: Repository interfaces should be specific to the entity and its query needs
- Rule 3: Avoid generic repository interfaces — they violate ISP

---

## Related Skills

- Design Repository Interfaces
- Apply ISP to Repository Pattern

---

## Decision: Repository Return Type — Domain Entity vs Eloquent Model

---

## Decision Context

Choose what Repository methods return — plain PHP domain objects (DTO/Entity) or Eloquent models.

---

## Decision Criteria

* performance considerations: returning Eloquent models is zero-cost; mapping to domain entities adds hydration overhead
* architectural considerations: domain entities decouple from Eloquent; Eloquent models couple callers to ORM
* security considerations: domain entities limit data exposure; Eloquent models expose all attributes and relations
* maintainability considerations: domain entities require mapping layer; Eloquent models need no mapping

---

## Decision Tree

Does the caller (service/domain layer) need to be framework-agnostic?
↓
YES → Repository returns domain entities (plain PHP objects, not Eloquent models)
    ↓
    Are there many fields to map between DB and domain entity?
    MANY (15+ fields) → Use auto-mapping (DTO library or array → constructor)
    FEW (<15 fields) → Manual mapping in Repository implementation
    NO → Repository returns Eloquent models (caller is okay with framework coupling)
↓
Is the caller a controller or application service that already depends on Laravel?
YES → Returning Eloquent models is acceptable (no additional coupling)
NO → Is the caller a domain service that should be framework-agnostic?
    YES → Return domain entities (Repository maps Eloquent → domain entity internally)
    ↓
    Does the mapping cost affect performance?
    YES → Consider if the caller truly needs framework agnosticism (benchmark first)
    NO → Domain entities are the right choice
    NO → Return Eloquent models (the caller already depends on Laravel)

---

## Rationale

If the Repository exists to keep the domain layer framework-agnostic, it must return domain entities — not Eloquent models. Returning Eloquent models defeats the abstraction because callers still depend on the ORM. If framework agnosticism isn't a goal, returning Eloquent models is simpler.

---

## Recommended Default

**Default:** Return domain entities from Repository when the domain layer must be framework-agnostic. Return Eloquent models when Repository is used for simpler abstraction (multi-backend, complex queries) and callers already depend on Laravel.

**Reason:** Returning Eloquent models defeats persistence ignorance. If you're using Repository for DIP compliance, return domain entities. If you're using Repository for other reasons (multi-backend, complex queries), Eloquent models are acceptable.

---

## Risks Of Wrong Choice

Repository returning Eloquent models to domain layer: domain layer imports Eloquent, DIP violation persists. Repository returning domain entities to controller: unnecessary mapping, controller receives objects it doesn't benefit from. Mapping every field manually: high maintenance cost.

---

## Related Rules

- Rule 5: If Repository is for DIP compliance, it must return domain entities — not Eloquent models

---

## Related Skills

- Map Database to Domain Entities
- Design Framework-Agnostic Repository
