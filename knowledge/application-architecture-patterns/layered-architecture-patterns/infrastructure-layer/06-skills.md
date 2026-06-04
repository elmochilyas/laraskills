# Skill: Implement Infrastructure Adapters with Eloquent and External Services
## Purpose
Implement the Infrastructure layer — the designated zone for Laravel-specific code — containing Eloquent repository implementations with explicit domain-entity mapping, external API adapters, mail/queue implementations, and integration tests — while keeping Domain and Application layers framework-independent.
## When To Use
- Clean Architecture or Hexagonal Architecture with explicit port/adapter separation
- Applications requiring swappable infrastructure (database drivers, email providers, payment gateways)
- Any layered architecture where framework coupling must be contained and isolated
## When NOT To Use
- Three-layer architecture where Eloquent models serve as both data access and business objects
- Applications where infrastructure swapping is not anticipated
- When over-abstraction would create interfaces for every class with only one implementation
## Prerequisites
- Port interfaces defined in Domain layer (Repository, EventBus, Mailer interfaces)
- LAP-04 Dependency Rule — Infrastructure may depend on Domain/Application, but inner layers may not import Infrastructure
- Eloquent models created in Infrastructure namespace, not in `app/Models`
- Integration test environment with test database
## Inputs
- Domain entities to persist (or Eloquent models to convert to Domain entities)
- Port interface contracts (method signatures, return types)
- External API specifications (endpoints, authentication, rate limits)
## Workflow
1. Create Eloquent model in Infrastructure namespace (`App\Infrastructure\Persistence\EloquentInvoiceModel`) extending `Model` — with relationships, casts, scopes only (no business logic)
2. Create mapper class in Infrastructure: `toDomain(InvoiceModel $model): Invoice` and `toEloquent(Invoice $invoice): array` — explicit field-by-field mapping, no lazy loading
3. Implement repository interface from Domain: `class EloquentInvoiceRepository implements InvoiceRepository` — eager-load all needed relationships before calling mapper
4. Map both directions in repository: `find()` loads model → calls mapper to Domain; `save()` calls mapper to array → `updateOrCreate`
5. Create adapter classes for external services: implement port interface, wrap third-party SDK/API calls
6. Write integration tests: `RefreshDatabase` for repository tests, mock external API responses, test full roundtrip (domain → save → find → domain)
7. Register implementations in ServiceProvider: `$this->app->bind(InvoiceRepository::class, EloquentInvoiceRepository::class)`
8. Verify architecture tests: no Infrastructure imports in Domain or Application namespaces
## Validation Checklist
- [ ] Eloquent models in Infrastructure, never in Domain or Application
- [ ] Repository methods return Domain types (not Eloquent models or `Collection`)
- [ ] Explicit mapper between Domain entity and Eloquent model
- [ ] Eager loading before mapping (no lazy loading triggered in mapper)
- [ ] Zero business logic in Eloquent models or repository implementations
- [ ] External API adapters implement port interfaces from Domain/Application
- [ ] Integration tests cover all Infrastructure code paths (real database, real API mocks)
- [ ] Architecture tests prevent Infrastructure imports from Domain/Application
- [ ] ServiceProvider binds port interfaces to Infrastructure implementations
- [ ] Interface abstractions added only when multiple implementations exist (or testing requires them)
## Common Failures
- **Business logic in Infrastructure:** Business rules in Eloquent model methods. Fix: move business logic to Domain entities.
- **Leaky abstractions:** Repository returns `Collection` or `LengthAwarePaginator`. Fix: return Domain `InvoiceCollection` or Application DTO `PaginatedResult`.
- **Eloquent in Domain:** Eloquent model in Domain namespace extending `Model`. Fix: move to Infrastructure, create explicit mapper.
- **N+1 from lazy loading in mapper:** Mapper triggers `$model->items` which fires new query. Fix: eager-load all relationships before calling mapper.
- **Over-abstraction:** Interface for every Infrastructure class even with single implementation. Fix: add interfaces when variation exists.
## Decision Points
- **Explicit mapper vs partial independence:** Complex domain → explicit mapper (full framework independence). Simple CRUD → accept Eloquent coupling (Laravel DDD).
- **Repository granularity:** One repository per aggregate root. Query-only repositories for read models may be defined in Application layer.
- **Interface necessity:** Repository with two implementations (Eloquent + InMemory for testing) = interface justified. Repository with only one implementation = consider if interface adds value.
## Performance Considerations
- Infrastructure is the primary performance concern — N+1 queries, missing indexes, slow API calls
- Eloquent optimization (eager loading, chunking, cursor) happens entirely in Infrastructure
- Mapping overhead is measurable but rarely significant for typical request volumes
- Profile infrastructure code separately from Domain/Application code to identify bottlenecks
## Security Considerations
- SQL injection prevention in Infrastructure (parameterized queries, Eloquent ORM)
- External API credential management in Infrastructure (env variables, encrypted storage)
- Encrypt sensitive data at rest in Infrastructure (subscriber URLs, API tokens)
- Input validation at Infrastructure boundary for external data sources (API responses, webhook payloads)
## Related Rules (from 05-rules.md)
- Map Domain Entities to Eloquent Explicitly
- No Business Logic in Infrastructure
- Return Domain Types, Not Eloquent Types
- Write Integration Tests for Infrastructure
- Only Layer Importing Laravel Freely
- Avoid Over-Abstracting Infrastructure
- Prefer Aggressive Eager Loading in Repositories
## Related Skills
- Domain Layer Modeling (LAP-05)
- Domain-Entity Mapping (LAP-10)
- Application Layer Orchestration (LAP-06)
- Framework Independence Decisions (LAP-09)
## Success Criteria
- All Eloquent models live exclusively in Infrastructure namespace
- Repository methods return Domain types only (no `Collection`, no `LengthAwarePaginator`)
- Mapper tests verify roundtrip: domain → model → domain (all fields preserved)
- Zero business logic in any Infrastructure class (verified by architecture tests)
- Integration tests catch SQL/API errors before production deployment
