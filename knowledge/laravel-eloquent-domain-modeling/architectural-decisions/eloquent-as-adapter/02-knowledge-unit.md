# Eloquent as Adapter

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
In a hexagonal architecture, Eloquent models serve as infrastructure-layer adapters implementing domain-defined repository interfaces. The domain defines a "Contract Repository" port; the Eloquent model (or a dedicated class wrapping Eloquent) implements it. This treats Eloquent as a persistence adapter rather than the domain model itself — decoupling the business logic from the ORM. The domain model becomes a plain PHP class, and Eloquent becomes a mapping layer between the database and that domain model.

## Core Concepts
- **Eloquent as Infrastructure:** Eloquent models are not domain models — they are database access objects.
- **Domain Model (Plain PHP):** The real domain model is a plain PHP class that knows nothing about Active Record, save(), or database tables.
- **Mapping Layer:** The adapter converts between Eloquent models (DB rows) and domain models (business objects).
- **Persistence Ignorance:** The domain model has no save() method, no ::find(), no database coupling.
- **Repository Implemented with Eloquent:** The Laravel-idiomatic way to implement a domain repository is using Eloquent internally.

## Mental Models
- **The Translator:** Eloquent is the translator between two languages: Database (SQL) and Domain (PHP objects). The domain speaks only in domain objects; Eloquent translates to/from tables.
- **The Courier:** The domain writes a letter (domain model), hands it to the courier (Eloquent adapter), and the courier delivers it to the database. The domain never touches the mail truck.
- **The Glove Compartment:** The domain is the driver's hands (pure logic). Eloquent is the driving glove — it interfaces between hands and the steering wheel (database). The hands still control the direction, but the glove handles the grip.

## Internal Mechanics
1. Domain defines an interface (port) with domain-friendly method signatures.
2. A repository class is created in the Infrastructure layer.
3. Inside the repository, Eloquent models are used to query the database.
4. Results from Eloquent are mapped to domain models (plain PHP objects).
5. Domain models returned from the repository are pure — they have no database coupling.
6. When persisting, domain models are mapped back to Eloquent models for save operations.

## Patterns
- **Eloquent Repository Adapter:** Standard repository implementation using Eloquent internally.
- **Eloquent-to-Domain Mapping:** Manual conversion from Eloquent model ? domain model (or using a mapper/transformer).
- **Domain-to-Eloquent Mapping:** Reverse conversion for persistence with save().
- **Aggregate Root Adapter:** A single repository adapter handles an aggregate root and its entities.
- **Eloquent + Custom Casts as Mapping:** Using Eloquent's custom casts to convert between DB format and value objects.

## Architectural Decisions
- Use Eloquent as an adapter when you want the domain to be persistence-ignorant.
- Use when you want to keep Eloquent's convenience (relationships, eager-loading, pagination) while still having a clean domain.
- Use when you anticipate switching storage (file-based, event store, NoSQL).
- Use when the domain model has complex rules that would be polluted by Active Record concerns.
- Skip when the domain model and database structure are nearly identical — the mapping overhead isn't justified.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain is fully decoupled from ORM | Manual mapping between Eloquent and domain models | Accept when domain is complex enough to justify |
| Domain can be tested without database | Eloquent features (lazy loading, accessors) unavailable in domain | Must eager-load in the repository layer |
| Storage can be swapped | Duplicate type definitions (domain + Eloquent) | Use DTOs/lambdas to reduce duplication |
| Domain isn't polluted by Active Record concerns | Additional mapping layer reduces development speed | Best for complex domains, not CRUD |
| Repository implementation benefits from Eloquent | You lose Eloquent's convenience in the domain layer | Worth the tradeoff for persistence-ignorant domains |

## Performance Considerations
- Mapping between Eloquent and domain models adds CPU overhead per entity. For large result sets (>1000 rows), batch mapping should be optimized.
- Eloquent's lazy-loading should be done inside the repository before returning domain models.
- Pagination must be handled in the repository layer, as domain models don't know about pagination.
- Hydration overhead is typically negligible (<1ms per 100 entities).

## Production Considerations
- **Mapping Consistency:** Ensure all repository methods apply the same mapping consistently.
- **Lazy Loading Prevention:** Never return an Eloquent model from a repository — always map to domain models.
- **Partial Updates:** When updating only specific fields, convert the domain change to an Eloquent partial update.
- **Caching:** Cache mapped domain models, not raw Eloquent instances, to avoid serialization issues.

## Common Mistakes
- Mixing Eloquent and domain models in the same array/collection — always map at the boundary.
- Eloquent models leaking out of repository methods — strict return types prevent this.
- Domain models having save() methods — removes the persistence ignorance benefit.
- Over-mapping for simple CRUD — mapping four fields from Eloquent to domain is overhead without benefit.
- Repositories that don't use Eloquent features (eager-loading, withCount, chunk) — you chose Eloquent as adapter, use its strengths.

## Failure Modes
- **Mapping Explosion:** 50+ domain classes each needing a mapping function. Mitigate: use a consistent mapping pattern (array serialization, mappers, or a mapping library).
- **Eloquent Feature Lock-In:** Repository uses Eloquent-specific features (global scopes, soft deletes) that make swapping impossible. Mitigate: keep the adapter implementation generic; don't depend on Eloquent-specific behaviors.
- **N+1 Adapter:** Repository returns domain model without its related data, causing the caller to loop and re-query. Mitigate: always eager-load in the repository; accept $with parameters.
- **Identity Drift:** Domain model ID and Eloquent ID get out of sync. Mitigate: always map back and forth using the same ID reference.

## Ecosystem Usage
- **Laravel official packages:** Internally, Eloquent acts as an adapter behind Contracts interfaces (e.g., Illuminate\Contracts\Auth\Authenticatable).
- **spatie/domain-oriented-laravel:** Uses Eloquent as infrastructure adapter with separate domain models.
- **DDD in Laravel community:** Standard pattern is Infrastructure\Persistence\Eloquent{Entity}Repository implementing Domain\Contracts\{Entity}Repository.
- **Event sourcing (spatie/laravel-event-sourcing):** Eloquent as adapter for storing event streams; domain models are reconstructed from events.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [Ports and Adapters](../ports-and-adapters/02-knowledge-unit.md) — The architecture pattern this pattern implements.
- [When Repositories Help](../when-repositories-help/02-knowledge-unit.md) — Repository pattern that Eloquent adapters implement.
- [Framework Decoupling](../framework-decoupling/02-knowledge-unit.md) — How Eloquent-as-adapter contributes to framework independence.
- [Read Model Separation](../read-model-separation/02-knowledge-unit.md) — Read models can also use Eloquent as adapter.
- [Write Model Separation](../write-model-separation/02-knowledge-unit.md) — Write models behind an Eloquent adapter.

### Advanced Follow-up Topics

## Research Notes
- **Eric Evans (DDD):** Repository pattern keeps domain model unaware of persistence.
- **Freek Van der Herten (spatie):** "Eloquent is great as an implementation detail behind an interface."
- **Matthias Noback:** Advocates for treating Eloquent as an infrastructure adapter, not a domain model.
- **PHP Architect community (2022-2025):** Growing consensus that treating Eloquent as adapter — not domain — is the correct approach for complex Laravel applications.
- **Laracon US 2023:** Multiple speakers discussed separating Eloquent from domain logic for maintainability at scale.