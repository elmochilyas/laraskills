# Domain Entity to Eloquent Model Mapping

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-10-domain-eloquent-mapping
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
In layered architecture with DDD tactical patterns, Domain Entities are pure PHP objects with business behavior, while Eloquent Models are database-aware persistence objects. Mapping between these two representations is the primary responsibility of Repository implementations in the Infrastructure layer. This mapping is bidirectional: the hydrator reads from Eloquent Model to construct Domain Entities, and the extractor reads from Domain Entities to populate Eloquent Models. The key principle is that mapping code lives in Infrastructure, never in Domain or in Eloquent models.

---

## Core Concepts
- **Hydrator (Model → Domain)**: Code that reads from Eloquent Model(s) and constructs Domain Entity/Aggregate instances, handling nested relationships, Value Object reconstruction, and recursion through complex Aggregate structures
- **Extractor (Domain → Model)**: Code that reads from Domain Entity/Aggregate and populates Eloquent Model(s), handling Value Object flattening, nested entity persistence, and diff-based updates
- **Mapping Direction**: Bidirectional with separate code paths — the read path and write path are independent concerns
- **Persistence Diff**: Strategy for detecting what changed in a Domain Aggregate and applying only those changes to the database — full replacement or field-level diff tracking
- **Round-Trip Testing**: A Domain Aggregate mapped to Model, then back to Domain, and compared to the original — validates mapping correctness and completeness

---

## Mental Models
1. **Translator Between Two Languages**: The mapper is like a translator between two people speaking different languages. The Domain Entity speaks business language (Invoice, Money, Status). The Eloquent Model speaks database language (invoices table, total_cents, status varchar). The translator must be fluent in both without mixing the languages.
2. **Bridge, Not Blender**: The mapper bridges two worlds but should not blend them. If the mapper uses Domain business methods during extraction, or if the Domain somehow knows about Eloquent, the bridge becomes a blender — and the separation of concerns is destroyed.

---

## Internal Mechanics
The Repository implementation receives a Domain Aggregate, calls `toModel()` on the mapper to convert it to an Eloquent Model (or set of models for nested entities), persists via Eloquent's `save()` method, and handles any persistence diff logic for partial updates. On the read path, the Repository loads an Eloquent Model with eager-loaded relationships, calls `toDomain()` to reconstruct the Aggregate complete with Value Objects and nested entities, and returns the Domain object. The mapper handles Value Object conversion explicitly — each Value Object type has its own mapping logic for flattening to database columns and reconstructing from database columns.

---

## Patterns
### Dedicated Mapper Class Pattern
- **Purpose**: Keep mapping logic in explicit, testable classes separate from Repository implementation
- **Mechanism**: `EloquentInvoiceMapper` class with `toDomain()` and `toModel()` methods
- **Benefits**: Mapping is testable in isolation, reusable across Repository methods, clearly separated from persistence logic
- **Tradeoffs**: More classes than inline mapping; mapper must be updated when Domain or schema changes

### Round-Trip Test Pattern
- **Purpose**: Validate mapping fidelity by creating a Domain Aggregate, mapping to Model, and mapping back
- **Mechanism**: Test creates Domain aggregate → maps to Model → maps back to Domain → asserts equality
- **Benefits**: Catches missing properties, incorrect Value Object reconstruction, and mapping gaps
- **Tradeoffs**: Requires complete equals() implementation on Domain objects; brittlish with complex nested structures

---

## Architectural Decisions
- **Choose explicit mapping when**: Domain model differs significantly from database schema, Value Objects have complex structure, or Aggregate consistency boundaries must be enforced through Repository abstraction
- **Choose Eloquent casts when**: Simple Value Objects with direct column mapping and no complex nesting
- **Key decision**: Keep mapping in Infrastructure, not in Domain or in Eloquent models — Domain Entities should not have `toArray()` methods mirroring database columns

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain remains pure PHP with no ORM coupling | Mapping overhead varies with Aggregate size | Typically <5ms per request for complex Aggregates |
| Round-trip tests catch mapping errors | Requires maintaining mapper and equality methods | Essential for data integrity in complex domains |
| Explicit mapping handles complex Value Objects | More Infrastructure code than Active Record approach | Value for projects where Domain differs from schema |
| Separate hydrator/extractor paths evolve independently | Code duplication between read/write paths | Paths naturally diverge as Domain and schema evolve |

---

## Performance Considerations
Mapping overhead varies with Aggregate size — profile real aggregates, not micro-benchmarks (typical overhead <5ms per request for complex Aggregates). Lazy loading in the hydrator causes N+1 queries — eager-load all known relationships when hydrating a full Aggregate. For batch operations, map in bulk and persist in a single transaction. Diff-based persistence reduces write operations for partial updates but adds comparison overhead — profile to determine which strategy is faster for your Aggregate.

---

## Production Considerations
Mapper logic must not invoke Domain behavior during mapping — mapping is structural, not behavioral. Avoid circular mapping by using identity-only references or depth limits for self-referencing entities. Handle identity mismatch (Domain UUID vs database auto-increment) by maintaining both if needed. Ensure round-trip tests are part of CI to prevent mapping regressions.

---

## Common Mistakes
1. **Domain dependencies in mapping code**: Mapper logic that invokes Domain behavior during mapping — mapping should be purely structural, copying data without executing business rules.
2. **Eloquent in Domain**: Repository interface returning Eloquent collection types — callers should never see Eloquent types from Repository methods.
3. **Circular mapping**: Related entities mapping back to their parent creates infinite loops — break cycles with identity-only references or depth limits.
4. **Over-mapping**: Mapping every single field even when the Aggregate subset is never consumed — map only what the application actually uses.
5. **Missing round-trip tests**: Without round-trip tests, mapping errors go unnoticed until production data reveals inconsistencies.

---

## Failure Modes
- **Identity mismatch**: Domain UUID and database auto-increment ID diverge — maintain both mappings in the mapper
- **Stale mapping**: Database schema changes without corresponding mapper updates cause runtime errors
- **Lazy loading N+1**: Hydrator triggers lazy-loaded relationships one query at a time — eager-load all needed relationships
- **Circular reference on serialization**: Self-referencing entities cause infinite loops during JSON response generation

---

## Ecosystem Usage
Laravel's Eloquent ORM is the most common persistence mechanism that Repository implementations wrap. The `spatie/laravel-data` package provides automated mapping between DTOs and data sources. Custom Eloquent casts provide a lighter-weight alternative to explicit mapping for simple Value Objects. Many enterprise Laravel projects use explicit mapper classes alongside Repository pattern to maintain Domain-Infrastructure separation.

---

## Related Knowledge Units
### Prerequisites
- LAP-06 DDD Tactical Patterns
- LAP-04 Dependency Rule
- LAP-02 Clean Architecture

### Related Topics
- LAP-07 Value Objects
- LAP-03 Hexagonal Architecture
- LAP-08 Domain Events

### Advanced Follow-up Topics
- LAP-11 Transaction Boundaries
- Event Sourcing (no mapping needed)
- CQRS read model separation

---

## Research Notes
Generate Mapper classes in Infrastructure as dedicated classes separate from Repository implementations. Map bidirectionally with separate `toDomain()`/`toModel()` methods. Always generate round-trip tests that validate mapping fidelity. For Value Objects, generate explicit conversion methods in the mapper. Default to eager loading in hydrators to prevent N+1 queries.
