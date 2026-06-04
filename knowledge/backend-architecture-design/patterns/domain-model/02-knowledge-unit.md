# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Domain Model (Fowler) in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Domain Model organizes business logic as an object model that incorporates both data and behavior, following the principles of Domain-Driven Design. Unlike Transaction Script's procedural approach, Domain Model builds a rich network of objects that model the actual business domain. In Laravel, this pattern conflicts with Eloquent's ActiveRecord nature — Eloquent models inherently mix persistence and domain logic. The debate is central to Laravel architecture: use Eloquent as domain model (simpler but violates SRP) or separate domain models from Eloquent models (cleaner but more complex).

---

# Core Concepts

- Rich domain objects: entities with behavior, not just getters/setters
- Value objects: immutable, self-validating, behavior-rich
- Aggregates: consistency boundaries with a root entity
- Domain services: stateless operations that don't naturally fit entities
- Domain events: side effects as first-class domain concepts
- Persistence ignorance: domain model doesn't know about DB

---

# Mental Models

- **Business Simulation**: Domain model simulates the business in software
- **Ubiquitous Language**: Object names and methods reflect business terminology
- **Behavioral Richness**: Object knows its own rules, not external services
- **Persistence Ignorance**: Domain model exists independently of storage concerns

---

# Internal Mechanics

Domain Model objects have state (properties) and behavior (methods). Validation happens in setters/constructors, not in external validators. Relations between domain objects are object references, not foreign keys. In Laravel, implementing a true Domain Model requires separating Eloquent models (persistence) from domain entities (business logic), typically using Repository to bridge them.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Rich Entity | Object with identity + behavior | Natural object-oriented design | Conflicts with Eloquent ActiveRecord |
| Value Object | Immutable, self-validating | Type safety, encapsulation | More classes, construction verbosity |
| Aggregate Root | Consistency boundary | Ensures invariants within boundary | Transaction scope confusion |
| Domain Service | Stateless domain operations | Handles cross-entity logic | Can become procedural bag |

---

# Architectural Decisions

- Use Domain Model for: complex business logic with interconnected rules
- Use for: domains where business rules change frequently
- Use for: applications requiring audit trails and business event logging
- Use with: Hexagonal/Clean Architecture to isolate domain from infrastructure
- Avoid for: simple CRUD — Transaction Script is simpler and sufficient
- Eloquent strategy: either accept Eloquent as domain model (convenience over purity) or separate layers (purity over convenience)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Business rules in one place (DRY) | More initial design effort | Upfront modeling required |
| Behavioral richness prevents anemic models | Learning curve for team | DDD unfamiliar to many Laravel devs |
| Persistence ignorance enables flexibility | Mapping layer between domain and DB | Repository + Factory + Assembler |
| Ubiquitous language improves communication | Requires domain expert involvement | Not always available |
| Testable without infrastructure | More complex test setup | Factory/builders for domain objects |

---

# Performance Considerations

- Domain Model: more objects → more memory per request
- Object hydration from DB: mapping relational rows to object graphs is non-trivial
- Lazy loading vs eager loading decisions critical for performance
- Aggregate boundaries affect transaction size and locking
- Value object construction: overhead of immutability (new objects on each modification)

---

# Production Considerations

- Training investment: team must learn DDD tactical patterns
- Code organization: clear separation between domain and infrastructure
- Repository implementation: mapping between domain and ORM
- Testing strategy: test domain logic without DB, test repository separately
- Serialization concerns: domain objects crossing boundaries (DTOs needed)

---

# Common Mistakes

- Anemic Domain Model: getters/setters only, logic in services → Transaction Script in disguise
- Eloquent model as domain model AND persistence model → SRP violation, testing difficulty
- Domain model depending on framework → violates dependency rule
- Overly complex aggregate boundaries → performance issues, transaction conflicts
- No ubiquitous language → code doesn't reflect business concepts

---

# Failure Modes

- **Anemic domain model**: domain objects are just data bags; all logic in services → procedural design with OO overhead
- **Persistence coupling**: domain code calls DB directly → cannot unit test
- **Transaction confusion**: aggregate boundary too wide → many conflicts; too narrow → inconsistent data
- **Rich domain but no persistence mapping**: great domain model but cannot save to DB effectively

---

# Ecosystem Usage

- **Laravel Doctrine**: Doctrine ORM as alternative to Eloquent, supports true Domain Model
- **Spatie/Laravel-Data**: value objects and DTOs for domain models
- **Spatie/Laravel-EventSourcing**: event-sourced aggregate roots
- **Laravel Hexagonal**: community patterns for Hexagonal Architecture + Domain Model
- **Eloquent as Domain Model**: pragmatic Laravel approach accepts Eloquent as imperfect domain model

---

# Related Knowledge Units

**Prerequisites**: OOP, DDD tactical patterns | **Related**: Transaction Script (simpler alternative), Service Layer (domain boundary), Repository (domain persistence), Hexagonal Architecture (domain isolation) | **Advanced**: Event-sourced domain model, Advanced aggregate design, Domain model refactoring from script

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

