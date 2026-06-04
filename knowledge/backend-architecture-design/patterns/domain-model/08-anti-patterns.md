# Domain Model — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Domain Model (Fowler) in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Anemic Domain Model | Critical |
| 2 | Eloquent Model as Domain AND Persistence Model | High |
| 3 | Domain Model Depending on Framework | Critical |
| 4 | Overly Complex Aggregate Boundaries | High |
| 5 | No Ubiquitous Language | Medium |

---

## 1. Anemic Domain Model

### Category
Architecture

### Description
Domain objects with only getters and setters but no behavior, with all business logic in service classes — this is Transaction Script in disguise.

### Why It Happens
Developers create domain model classes but put business logic in services out of habit, fear of "fat models," or lack of DDD understanding.

### Warning Signs
- Domain objects are property bags (getters/setters only)
- All business logic in service classes
- Controllers referencing domain object properties
- Domain objects don't enforce invariants

### Why Harmful
The entire benefit of Domain Model (encapsulated business logic, maintainable rules) is lost. The code remains procedural with unnecessary object overhead.

### Consequences
- Business logic scattered across services
- Duplicated validation in multiple places
- Invariants not enforced at model level
- Services become god classes

### Alternative
Move business logic into domain objects. Encapsulate invariants. Use value objects for concepts. Services coordinate, domain objects execute.

### Refactoring Strategy
1. Identify business rules in services
2. Move rules to domain objects as methods
3. Make properties private (no getters/setters for internal state)
4. Enforce invariants in constructors and mutators
5. Use value objects for domain concepts

### Detection Checklist
- [ ] Check domain objects for behavior
- [ ] Audit service classes for domain logic
- [ ] Verify invariant enforcement

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Domain Model, Service Layer

---

## 2. Eloquent Model as Domain AND Persistence Model

### Category
Architecture

### Description
Using the same Eloquent model class as both the domain model (business logic) and the persistence model (database access), violating SRP.

### Why It Happens
Laravel's convention encourages this. Eloquent models are the natural place for scopes, accessors, and relationships, which are mixed with domain rules.

### Warning Signs
- Domain rules mixed with Eloquent scopes and relationships
- Testing requires database for business logic tests
- Model class growing large with mixed responsibilities
- Framework upgrades breaking domain logic through Eloquent changes

### Why Harmful
Testing domain logic requires database setup. Framework coupling prevents domain layer portability. The model violates SRP with persistence + domain concerns.

### Consequences
- Slow tests (database setup for domain logic)
- Framework upgrades risk breaking business rules
- Domain logic cannot be reused outside Laravel
- Hard to reason about model responsibilities

### Alternative
Separate: Eloquent model handles persistence; domain model handles business logic. Map between them via repository or Doctrine.

### Refactoring Strategy
1. Create domain model classes (plain PHP, no Eloquent)
2. Keep Eloquent models in infrastructure layer
3. Add repository to map between them
4. Move business logic from Eloquent to domain models
5. Test domain models without database

### Detection Checklist
- [ ] Check Eloquent models for business logic
- [ ] Verify domain models are framework-agnostic
- [ ] Test business logic without database

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic, Enforce Boundaries via Automation
- Skills: Domain Model, Repository

---

## 3. Domain Model Depending on Framework

### Category
Architecture

### Description
Domain layer classes that extend framework base classes (e.g., extending Eloquent Model or using framework facades/helpers), breaking the dependency rule.

### Why It Happens
Convenience: using framework features in domain objects is the path of least resistance.

### Warning Signs
- Domain objects extending framework classes
- `use Illuminate\Support\Facades\*` in domain layer
- Framework helpers (`app()`, `config()`, `event()`) in domain objects
- Domain objects using framework base class features

### Why Harmful
The dependency rule states dependencies must point inward. Framework-dependent domain cannot be tested, ported, or evolved independently.

### Consequences
- Domain logic coupled to framework
- Framework upgrades force domain changes
- Domain cannot be reused outside Laravel
- Testing requires framework bootstrap

### Alternative
Domain objects should be plain PHP objects. Depend on interfaces defined in the domain, implemented in infrastructure.

### Refactoring Strategy
1. Remove all framework dependencies from domain
2. Replace with interfaces defined in domain
3. Inject dependencies through constructor
4. Implement interfaces in infrastructure layer
5. Verify domain layer has zero framework imports

### Detection Checklist
- [ ] Scan domain for framework imports
- [ ] Check domain objects for framework base class extension
- [ ] Test domain without framework

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Domain Model, Hexagonal Architecture

---

## 4. Overly Complex Aggregate Boundaries

### Category
Performance

### Description
Designing aggregates that include too many entities, causing large transaction scopes, lock contention, and performance degradation.

### Why It Happens
Including everything that could be related "just in case." Teams prioritize conceptual purity over practical performance.

### Warning Signs
- Aggregate includes unrelated entities
- Frequent lock conflicts on aggregate root
- Large transactions spanning many tables
- Performance issues traced to aggregate size

### Why Harmful
Large aggregates create contention points. Every modification to any part of the aggregate requires loading and saving the entire graph.

### Consequences
- Lock contention and deadlocks
- Slow aggregate load and save operations
- Reduced concurrency
- Performance bottlenecks

### Alternative
Design aggregates as small as possible while maintaining consistency. Reference other aggregates by ID, not by object reference. Use eventual consistency across aggregates.

### Refactoring Strategy
1. Identify over-large aggregates
2. Split into smaller aggregates with ID references
3. Move to eventual consistency for cross-aggregate operations
4. Benchmark performance improvement

### Detection Checklist
- [ ] Review aggregate boundary sizes
- [ ] Measure aggregate load/save times
- [ ] Check lock contention rate

### Related Rules/Skills/Trees
- Skills: Domain Model, Aggregate Design
- Decision Trees: Aggregate Boundary Design

---

## 5. No Ubiquitous Language

### Category
Process

### Description
Code and documentation use technical implementation terms instead of business domain language, making the code inaccessible to domain experts.

### Why It Happens
Technical teams naturally name things in implementation terms. Bridging to business language requires active effort and domain expert involvement.

### Warning Signs
- Class/method names in implementation terms (e.g., `OrderProcessor`, not `OrderFulfillment`)
- Business rules hidden behind generic names
- Domain experts don't understand the code
- Gap between business requirements and implementation

### Why Harmful
Without ubiquitous language, code drift from business requirements is inevitable. Communication between developers and domain experts is impaired.

### Consequences
- Requirements translation errors
- Business rules misimplemented
- Domain expert communication breakdown
- Accumulating technical debt

### Alternative
Use business terminology for classes, methods, and variables. Involve domain experts in naming. Document business rules with domain language.

### Refactoring Strategy
1. Audit code for implementation terminology
2. Rename to match business language
3. Involve domain experts in naming review
4. Update documentation to match
5. Establish glossary

### Detection Checklist
- [ ] Check naming against business terminology
- [ ] Verify domain expert comprehension
- [ ] Review glossary alignment

### Related Rules/Skills/Trees
- Rules: Document Architecture Decisions
- Skills: Domain Model, DDD Strategic Design
