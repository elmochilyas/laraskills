# Anti-Patterns: Eloquent as Adapter

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Eloquent as Adapter |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Mapping Explosion | Performance | High |
| 2 | Eloquent Feature Lock-In | Architecture | High |
| 3 | N+1 Adapter | Performance | Critical |
| 4 | Identity Drift | Reliability | Critical |
| 5 | Incomplete Decoupling (Hybrid Model) | Architecture | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Returning Eloquent Models From Repository Methods | eloquent-as-adapter, ports-and-adapters | Critical |
| Domain Namespace Importing Illuminate Classes | eloquent-as-adapter, framework-decoupling | High |
| Using Carbon in Domain Models | eloquent-as-adapter, framework-decoupling | Medium |
| Mixing Read/Write Models in Same Namespace | eloquent-as-adapter, read-model-separation | Medium |
| No In-Memory Test Adapter for Port | eloquent-as-adapter, ports-and-adapters | High |

---

## Anti-Pattern 1: Mapping Explosion

### Category
Performance — Code Bloat

### Description
Every domain model requires a custom mapping function between the Eloquent record and the domain object. With 50+ domain models, this results in hundreds of lines of repetitive mapping code that must be maintained, tested, and updated whenever either representation changes.

### Why It Happens
Each domain model has unique fields, leading developers to write one-off `toDomain()` and `fromDomain()` methods. There is no shared mapping convention or library to automate the transformation.

### Warning Signs
- Each repository has 10-30 lines of hand-written `toDomain()` / `fromDomain()` code
- Adding a field to a domain model requires updating 3 files (model, mapper, tests)
- Reviewers frequently catch mapping bugs (missing fields, wrong type conversions)
- Mapper tests are repetitive and brittle

### Why Harmful
Mapping becomes the primary cost of the adapter pattern. The overhead of maintaining mappers for every model discourages domain model evolution (adding fields requires mapper updates). Mapping bugs cause subtle data corruption where a field silently maps to the wrong target. The team questions whether the adapter pattern is worth the cost.

### Real-World Consequences
A team with 40 domain models spends 30% of each sprint maintaining mapper code. A new `Invoice.currency` field requires updating `EloquentInvoiceRepository.toDomain()`, `EloquentInvoiceRepository.fromDomain()`, the domain model constructor, the migration, and 3 test files. After the sixth such change in one sprint, the team abandons the adapter pattern.

### Preferred Alternative
Use a consistent mapping convention: implement `toArray()` / `fromArray()` on domain models, or use a mapper library (e.g., AutoMapper+). Domain models implement a common interface (`Arrayable`, `Hydratable`) that standardizes mapping.

### Refactoring Strategy
1. Add `toArray(): array` and `static fromArray(array $data): self` methods to all domain models
2. Implement a shared `Mapper` trait or base class that standardizes field mapping
3. Use a naming convention: Eloquent `snake_case` columns map to domain `camelCase` properties
4. Add integration tests that validate mapping round-trips (Eloquent → Domain → Eloquent)
5. For complex conversions (value objects, embedded types), register field-level converters

### Detection Checklist
- [ ] Each repository has custom `toDomain()` / `fromDomain()` methods
- [ ] Adding a field requires updating mapper code in multiple places
- [ ] Mapping tests are brittle and exceed 50 lines per repository
- [ ] No shared mapping convention or base class exists

### Related Rules/Skills/Decision Trees
- **Rule 2**: Always map Eloquent models to domain objects at the repository boundary (`05-rules.md`)
- **Rule 5**: Use the same ID reference when mapping (`05-rules.md`)
- **Skill 1**: Create a Domain Model and Eloquent Adapter (`06-skills.md`)

---

## Anti-Pattern 2: Eloquent Feature Lock-In

### Category
Architecture — Leaky Abstraction

### Description
The repository adapter uses Eloquent-specific features (global scopes, soft deletes, `withCount`, `lazy loading`, `Carbon` type conversions) that make it impossible to swap the storage backend without rewriting the adapter. The abstraction leaks Eloquent concepts into the domain contract through method signatures or return types.

### Why It Happens
Developers build the adapter using familiar Eloquent features without considering whether the abstraction is truly backend-agnostic. Time pressure encourages using "what works" rather than implementing a generic persistence interface.

### Warning Signs
- Repository methods accept `Builder` instances or Eloquent Collection types
- Port interface methods are named with SQL concepts: `findWhere`, `orderBy`, `search`
- Adapter relies on Eloquent-specific behaviors like lazy loading or global scopes
- Swapping to an in-memory adapter requires significant adapter code changes
- Port interface returns `Collection` instead of `array<int, DomainModel>`

### Why Harmful
The port abstraction provides no real decoupling — changing from MySQL to PostgreSQL would require adapter changes, but switching from Eloquent to a different ORM (or a file-based store) requires rewriting the entire adapter. The architecture's promise of persistence ignorance is broken.

### Real-World Consequences
A team builds an `InvoiceRepository` adapter that uses Eloquent global scopes for tenant isolation, `withCount` for eager-loading aggregates, and `SoftDeletes` for soft deletion. When they need to implement an in-memory test adapter, they must reimplement global scope logic, aggregate counting, and soft delete filtering in memory — essentially rewriting half of Eloquent. The test adapter is so complex that they abandon it, losing the primary benefit of the architecture.

### Preferred Alternative
Implement the adapter using only generic SQL/database operations: `DB::table()`, raw queries, or a database-agnostic query builder. Keep Eloquent-specific features (global scopes, lazy loading, Carbon) inside the adapter and map to domain types before returning.

### Refactoring Strategy
1. Identify all Eloquent-specific method calls in the adapter (`withCount`, `lazy`, `globalScopes`, `SoftDeletes`)
2. Replace each with explicit query logic: implement tenant filtering manually, calculate aggregates via explicit joins, handle soft deletes with explicit `whereNull('deleted_at')`
3. Ensure port interface uses only domain types and primitives — no Eloquent types
4. Update the in-memory test adapter to match the new generic implementation
5. Run contract tests against both adapters to verify behavioral consistency

### Detection Checklist
- [ ] Adapter uses `SoftDeletes`, `withCount`, or global scopes
- [ ] Port interface accepts or returns Eloquent-specific types
- [ ] In-memory adapter does not exist or is significantly different from production adapter
- [ ] Contract tests fail when run against a non-Eloquent backend

### Related Rules/Skills/Decision Trees
- **Rule 2**: Always map at the repository boundary (`05-rules.md`)
- **Rule 4**: Keep domain namespaces free of `use Illuminate\*` imports (`05-rules.md`)
- **Skill 2**: Implement a Repository with Eloquent Mapping (`06-skills.md`)

---

## Anti-Pattern 3: N+1 Adapter

### Category
Performance — Query Explosion

### Description
The repository returns domain models without their related data, forcing callers to loop through results and re-query the repository for each item. Because domain models are plain PHP objects with no lazy-loading capability, every relation access triggers an explicit repository call.

### Why It Happens
The repository is written to return a domain model from a single Eloquent query without eager-loading relations. The developer assumes callers will only access scalar properties, but the caller needs related data for display. Since domain models can't lazy-load, the caller must re-query per item.

### Warning Signs
- Repository `findById()` does not call `with()` for relations
- Callers call `repository->findById()` inside a loop
- Query count in production is `1 (list) + N (per-item queries)`
- Callers manually join or preload data before calling the repository
- Domain models have `null` relation fields when returned from repository

### Why Harmful
The repository abstraction causes the N+1 problem it was supposed to solve. Without eager-loading inside the repository, callers must either accept the performance hit or bypass the repository to use Eloquent's eager-loading directly. Either way, the abstraction is working against performance rather than for it.

### Real-World Consequences
An `OrderRepository::findAll()` returns `Order` domain objects without their `items` and `payments` relations. A dashboard controller displays order summary cards showing item count and payment status. For 100 orders, the application executes 1 query for orders + 100 queries for items + 100 queries for payments = 201 queries per page load. The page takes 12 seconds to render.

### Preferred Alternative
Eager-load all required relations inside the repository method before mapping to domain objects. Accept an optional `$with` parameter for caller-specific eager loading with sensible defaults.

### Refactoring Strategy
1. Identify all relations accessed on domain models after repository queries
2. Add `Model::with('relation1', 'relation2')` to the repository query before mapping
3. If different callers need different relation sets, add an optional `array $with = []` parameter
4. Ensure the mapping function (`toDomain()`) receives the loaded relations
5. Add tests that verify eager loading happens and lazy loading is not triggered

### Detection Checklist
- [ ] Repository queries lack `with()` calls for accessed relations
- [ ] Callers loop through results and call the repository again per item
- [ ] Production query count shows N+1 pattern on repository queries
- [ ] Domain models have null collection fields

### Related Rules/Skills/Decision Trees
- **Rule 3**: Eager-load all required relations in the repository before mapping (`05-rules.md`)
- **Rule 6**: Accept `$with` parameters in repository methods (`05-rules.md`)
- **Skill 2**: Implement a Repository with Eloquent Mapping (`06-skills.md`)

---

## Anti-Pattern 4: Identity Drift

### Category
Reliability — Data Inconsistency

### Description
The domain model and the Eloquent record use different identity values for the same entity. The domain model generates a new UUID or auto-increment value independently from the database record, causing the two representations to diverge. This breaks foreign-key relationships, data correlation, and cross-aggregate operations.

### Why It Happens
The `toDomain()` method generates a new identity (`Uuid::v4()`) instead of using the database record's ID. This happens when the domain model constructor requires an ID and the developer uses a generator as a placeholder. The `fromDomain()` method may also fail to preserve the database ID when mapping back.

### Warning Signs
- Domain model constructor generates a random ID when none is provided
- `toDomain()` calls `Uuid::v4()` or similar ID generators
- Repository `store()` always inserts a new record instead of updating
- Foreign key constraints fail in cross-aggregate operations
- Integration tests show duplicate entities after save-and-retrieve round-trips

### Why Harmful
The system loses the ability to correlate domain objects with their database records. Updates become inserts (creating duplicates), foreign keys between aggregates break, and the system accumulates orphaned records. Recovery requires manual database cleanup and data deduplication.

### Real-World Consequences
An `OrderRepository` maps `toDomain()` with a new UUID. When the domain object is modified and passed back to `store()`, the repository calls `EloquentOrder::create()` instead of `EloquentOrder::updateOrCreate()` because the existing record's ID is not available. Each save creates a duplicate order. The system accumulates 50 phantom orders before the customer notices duplicate charges on their credit card.

### Preferred Alternative
Always use the same ID value in both representations. Pass the database ID through the mapper unchanged. When creating new entities, let the database generate the ID and propagate it back to the domain model.

### Refactoring Strategy
1. Modify `toDomain()` to pass `$eloquent->id` directly to the domain model constructor
2. Modify `fromDomain()` to include the domain model's ID in the Eloquent attributes
3. Change `store()` to use `updateOrCreate()` or `findOrFail()->update()` instead of always using `create()`
4. Add an integration test that saves a domain model, retrieves it, and asserts the IDs match
5. For new entities, save first, retrieve the generated ID, and assign it to the domain model

### Detection Checklist
- [ ] `toDomain()` generates a new ID value instead of using the Eloquent ID
- [ ] Repository `store()` always calls `create()` — never `update()`
- [ ] Integration test save-and-retrieve returns different ID values
- [ ] Foreign key errors in cross-aggregate operations

### Related Rules/Skills/Decision Trees
- **Rule 5**: Use the same ID reference when mapping (`05-rules.md`)
- **Skill 1**: Create a Domain Model and Eloquent Adapter (`06-skills.md`)
- **Decision Tree 1**: Active Record vs Eloquent as Adapter (`07-decision-trees.md`)

---

## Anti-Pattern 5: Incomplete Decoupling (Hybrid Model)

### Category
Architecture — Half-Measure

### Description
The domain namespace partially imports Eloquent or Laravel types, or the domain model extends Eloquent's Model class while also having separate repository interfaces. Some methods return domain types while others return Eloquent Collections. The architecture is neither fully decoupled nor simply using Active Record — it exists in a confusing middle ground.

### Why It Happens
The team starts implementing the adapter pattern but does not complete the migration. Time pressure, legacy code, or inconsistent code review allows framework imports to leak into the domain layer. New team members add imports without understanding the architectural boundary.

### Warning Signs
- Domain models both extend `Model` and implement a domain interface
- `Domain/` namespace has some files with `use Illuminate\*` and some without
- Repository methods sometimes return domain models and sometimes return Eloquent models
- Domain services use both injected ports and `app()` calls
- PHPStan rules for domain purity are not configured or have a large baseline

### Why Harmful
The architecture's benefits are lost while its costs remain. Developers pay the mapping overhead and interface maintenance but cannot rely on the domain being persistence-ignorant (some models still have hidden `save()` calls). Tests still require database setup (because some models extend Eloquent). The hybrid state is worse than either pure approach: it has the complexity of decoupling without the benefits.

### Real-World Consequences
A team has 30 domain models in `Domain/Invoicing/` where 20 are plain PHP classes and 10 still extend Eloquent Model. Testing requires `RefreshDatabase` for tests involving the hybrid models but not for the pure ones. Developers cannot tell at a glance whether a given model can be unit-tested or requires a database. PHPStan baseline has 50+ suppressed violations for domain layer imports, making CI enforcement useless.

### Preferred Alternative
Choose one approach per bounded context: either full Active Record (Eloquent models as domain) or full Adapter pattern (plain PHP domain models). Complete the migration fully before declaring it done.

### Refactoring Strategy
1. Run PHPStan with domain purity rules and generate a violation report
2. Categorize each violation: `Carbon` → `DateTimeImmutable`, `Collection` → `array`, `Model` extension → plain PHP class
3. Prioritize the violations that break domain testability (Model extension, Facade usage)
4. Refactor each violation systematically, starting with the most-coupled models
5. Once zero violations exist, enforce the purity rules in CI with no baseline

### Detection Checklist
- [ ] Domain models extend both `Model` and implement domain interfaces
- [ ] `Domain/` namespace has mixed `use Illuminate\*` imports
- [ ] Tests for domain logic require both `RefreshDatabase` and pure PHPUnit
- [ ] PHPStan baseline for domain layer has >10 suppressed violations
- [ ] Repository methods have inconsistent return types (some domain, some Eloquent)

### Related Rules/Skills/Decision Trees
- **Rule 1**: Never extend Model from domain model classes (`05-rules.md`)
- **Rule 4**: Keep domain namespaces free of `use Illuminate\*` imports (`05-rules.md`)
- **Rule 8**: Use `DateTimeImmutable` and value objects (`05-rules.md`)
- **Skill 3**: Enforce Domain Purity with PHPStan (`06-skills.md`)
