# ECC Anti-Patterns — Domain-Driven Design Tactical Patterns in Laravel

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | Domain-Driven Design Tactical Patterns in Laravel |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. Anemic Domain Model
2. Giant Aggregate
3. Framework-Coupled Domain
4. Repository Per Table
5. Event Flood
6. Value Object with Identity

---

## Repository-Wide Anti-Patterns

- Anemic Domain Model
- Eloquent in Domain
- DDD for CRUD
- Repository proliferation

---

## Anti-Pattern 1: Anemic Domain Model

### Category
Architecture | Domain Modeling

### Description
Domain objects (Entities, Value Objects) with only getters and setters — no business behavior, no invariant enforcement. All business logic lives in Service classes. The Domain layer is a data bag, not a behavior-rich model.

### Why It Happens
ORM-first thinking: models are data containers mapped to database tables. Services are the default location for logic in three-layer architecture. DDD requires a mindset shift to behavior-rich objects.

### Warning Signs
- Entities with public getters/setters for every property
- Value Objects with no constructor validation
- Service classes contain 100% of business logic
- Domain objects are serializable data bags
- Adding a new business rule means adding a method to a Service, not an Entity

### Preferred Alternative
Move business behavior INTO Domain objects. Entities enforce state transitions. Value Objects validate on construction. Services orchestrate across multiple Aggregates but delegate domain logic to the objects.

### Refactoring Strategy
1. Identify business rules currently implemented in Services
2. Move rules that operate on a single Entity's data into the Entity
3. Move rules that validate data composition into Value Objects
4. Move cross-Aggregate orchestration to Application Services
5. Remove public setters; enforce state transitions through behavior methods

### Related Rules
- Rule: Aggregate Root Enforces Invariants (LAP-06/05-rules.md)
- Rule: Value Objects Are Readonly and Immutable (LAP-06/05-rules.md)

---

## Anti-Pattern 2: Giant Aggregate

### Category
Architecture | Domain Modeling

### Description
A single Aggregate encompassing most or all of the domain model. The `Order` Aggregate includes `Items`, `Payments`, `Shipments`, `Returns`, `Discounts`, `Notes` — everything related to orders in one consistency boundary.

### Why It Happens
Foreign key relationships in the database suggest everything is connected. Developers model the database schema, not the consistency boundary. The path of least resistance is to put all related tables under one Aggregate.

### Warning Signs
- Repository loads dozens of related tables
- Transaction spans 10+ database tables
- Aggregate Root class has 20+ methods
- Concurrent updates to different parts of the same Aggregate fail
- Developers complain about "the Order Aggregate being slow"

### Preferred Alternative
Split into multiple small Aggregates. Each Aggregate has a clear consistency boundary. References between Aggregates are by identity, not object reference. Use eventual consistency for cross-Aggregate operations.

### Refactoring Strategy
1. Identify consistency invariants: which rules MUST be atomic?
2. Group entities by invariant boundary
3. Create separate Aggregate Roots for each group
4. Replace object references with identity references between Aggregates
5. Implement eventual consistency for cross-Aggregate operations

### Related Rules
- Rule: Keep Aggregates Small (LAP-06/05-rules.md)
- Rule: One Repository Per Aggregate Root (LAP-06/05-rules.md)

---

## Anti-Pattern 3: Framework-Coupled Domain

### Category
Architecture | Domain Modeling

### Description
Domain classes that import Laravel facades, helpers, or Eloquent. The Domain layer depends on the framework, making business logic untestable without Laravel bootstrap and impossible to extract to a separate package.

### Why It Happens
Convenience. Using `Log::info()`, `Str::slug()`, or `collect()` in Domain classes is faster than injecting abstractions. The coupling seems harmless until the Domain needs to be tested or extracted.

### Warning Signs
- `use Illuminate\Support\Facades\*` in Domain files
- `use Illuminate\Support\Str` or `Arr` in Domain files
- `use Illuminate\Database\Eloquent\Model` in Domain files
- Domain tests require `Illuminate\Foundation\Testing\RefreshDatabase`
- Domain classes cannot be instantiated without Laravel application

### Preferred Alternative
Inject all dependencies through port interfaces. The Domain layer defines the interface; Infrastructure provides the implementation. Domain classes are pure PHP with only standard library imports.

### Refactoring Strategy
1. Replace each framework dependency with a port interface
2. Move the interface to the Domain layer
3. Create an Infrastructure implementation
4. Bind the implementation in a Service Provider
5. Remove all `use Illuminate` statements from Domain files

### Related Rules
- Rule: Domain Classes Have No Framework Dependencies (LAP-06/05-rules.md)

---

## Anti-Pattern 4: Repository Per Table

### Category
Architecture | Persistence

### Description
Creating Repository interfaces for every database table, regardless of whether the table represents an Aggregate Root. `LineItemRepository`, `AddressRepository`, `NoteRepository` all exist even though LineItem, Address, and Note are not Aggregate Roots.

### Why It Happens
Database-first design: every table needs a corresponding Repository. Developers are familiar with the Repository pattern from simple CRUD and apply it uniformly.

### Warning Signs
- 20+ Repository interfaces for 5 Aggregate Roots
- Repository methods that are never called (because the entity is always accessed through its Aggregate Root)
- Services that inject 6+ Repository dependencies
- Repository interfaces that mirror CRUD for every entity

### Preferred Alternative
One Repository interface per Aggregate Root. Non-Root entities are loaded and persisted through the Root's Repository. The Repository manages the Aggregate boundary, not individual tables.

### Refactoring Strategy
1. Identify which Repositories correspond to Aggregate Roots
2. Remove Repository interfaces for non-Root entities
3. Add methods to the Root Repository for loading the full Aggregate
4. Update persistence to save the entire Aggregate as a unit

### Related Rules
- Rule: One Repository Per Aggregate Root (LAP-06/05-rules.md)

---

## Anti-Pattern 5: Value Object with Identity

### Category
Architecture | Domain Modeling

### Description
Implementing a domain concept as Value Object when identity tracking is needed. The class is marked `readonly` and uses value equality, but the business requires tracking individual instances over time.

### Why It Happens
Misunderstanding Entity vs Value Object distinction. The concept feels like a descriptive characteristic, but business requirements (audit, history, separate lifecycle) demand identity.

### Warning Signs
- A `readonly` class that needs database-level identity
- Value Objects that are individually updated in the database
- Business requirements to track changes to individual Value Object instances
- `equals()` on the class does not correctly identify the right instance

### Preferred Alternative
If identity matters, use Entity. Value Objects are interchangeable by value. If the business distinguishes between two instances with the same values, it should be an Entity.

### Refactoring Strategy
1. Remove `readonly` from the class (if identity requires mutation)
2. Add an identity field
3. Implement `equals()` comparing by identity
4. Update persistence to track individual instances

### Related Rules
- Rule: Implement Entities with Identity (LAP-06/05-rules.md)
- Rule: Value Objects Are Readonly and Immutable (LAP-06/05-rules.md)
