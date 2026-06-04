# Active Record Domain Layer

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
The Active Record pattern, embodied by Eloquent, binds data access logic directly into domain entities. In a domain-modeling context, embracing Active Record means treating Eloquent models as the domain layer itself rather than as persistence-only objects. This KU examines the implications, tradeoffs, and patterns for building a rich domain layer where Eloquent models carry both persistence and behavioral responsibilities.

## Core Concepts
- **Active Record:** Each model instance wraps a database row and exposes both persistence methods (`save()`, `delete()`) and domain behavior.
- **Domain Entity:** An object defined by identity and continuity across state changes. In Active Record, Eloquent models serve as these entities.
- **Data Mapper Alternative:** A separate persistence layer (e.g., Doctrine) where entities are plain PHP objects with zero persistence knowledge.
- **Anemic Domain Model:** Models reduced to public getters/setters with business logic leaking into controllers or services.
- **Rich Domain Model:** Models encapsulating both state and behavior, enforcing invariants through method APIs.

## Mental Models
- **"The Model IS the Domain":** There is no separate domain object. Your `User` Eloquent model IS the `User` entity in your domain. Methods like `activate()` or `changeEmail()` live directly on the model.
- **"Smart Model, Thin Controller":** Controllers parse HTTP input, call model behavior methods, and respond. Business rules are not duplicated outside the model.
- **"Transaction Script vs Domain Model":** Active Record tends toward transaction scripts when models are anemic. Rich domain methods push back toward a true domain model.

## Internal Mechanics
Eloquent's `Model` base class uses the Active Record pattern via:
- `__call` and `__get`/`__set` magic methods bridging attribute access to database columns
- A static `query()` method returning a `Builder` instance for query scoping
- Lifecycle hooks (`boot`, `trait boot*`) enabling model event registrations and global scopes
- Internal `performInsert`, `performUpdate` in `Illuminate\Database\Eloquent\Model`

When a method like `$user->markAsPaid()` is called, execution flows into model code, which may modify attributes and call `save()` on the same object, keeping domain logic and persistence in one place.

## Patterns
- **Behavior Methods:** `publish()`, `archive()`, `cancel()` on models rather than service classes
- **Self-Validation:** Validate domain invariants inside behavior methods before mutating state
- **Computed Accessors:** Derived properties as domain concepts (`isActive()`, `hasPendingOrders()`)
- **Encapsulated Collections:** `HasMany` relationships accessed through behavior methods that hide raw collection manipulation

## Architectural Decisions
- Decide whether models will contain business rules or remain thin wrappers around persistence
- Determine validation boundaries: model-level, form request-level, or both
- Choose how to handle cross-model operations (should logic live in a service or one of the models?)
- Establish testing strategy: unit tests for model behavior vs integration tests with the database

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Rapid development, less boilerplate | Domain logic couples to persistence schema | Schema changes may cascade into domain behavior |
| Intuitive for Laravel developers | Harder to swap storage backend | Projects rarely change databases; cost is theoretical |
| Single class to understand for an entity | Fat models if discipline is lost | Enforce max-line or Single Responsibility checks |
| Easy mocking via `Mockery` | Testing often requires DB setup | Use `RefreshDatabase` or in-memory SQLite for speed |

## Performance Considerations
- Rich domain methods may issue multiple queries if relationships are touched. Use lazy eager-loading or deferred computation.
- Avoid N+1 queries inside behavior methods that iterate relationships without loading them first.
- Model callbacks (`saving`, `saved`) can cascade unexpectedly; use transaction-aware patterns.

## Production Considerations
- Monitor model method complexity; extract value objects or domain services when a method spans multiple unrelated concerns.
- Use `$guarded` or `$fillable` to prevent mass-assignment vulnerabilities through domain methods that call `fill()`.
- Log domain-level operations at the model method level for audit trails.
- Ensure model events (e.g., `saved`) do not trigger other HTTP requests or external side effects synchronously if latency is a concern.

## Common Mistakes
- Mixing presentation concerns (JSON formatting, HTML escaping) into domain methods
- Exposing setters for every column, breaking encapsulation
- Putting cross-aggregate logic in a single model rather than a domain service
- Skipping unit tests on behavior methods because "integration tests cover it"

## Failure Modes
- **Fat Model Syndrome:** Single models grow beyond maintainability. Mitigate by extracting traits or dedicated classes.
- **Persistence-Aware Domain Bugs:** A `save()` call inside business logic may fail halfway; use transactions at the controller/service level.
- **Silent Attribute Writes:** Calling `$model->update([...])` from external code bypasses domain methods and invariants. Enforce domain methods as the only mutation path.

## Ecosystem Usage
- Laravel's own first-party packages (Spark, Cashier) use Active Record models as domain entities
- Notable OSS: `spatie/laravel-model-states`, `laravel-actions` (alternative), `lorisleiva/laravel-actions`
- Community trend toward "thick models" in early-stage apps, migrating to services as complexity grows

## Related Knowledge Units

### Prerequisites
- Eloquent Model Configuration & Conventions — model structure, table naming, timestamps
- Database Migrations & Schema Design — creating tables, columns, and indexes
- Eloquent CRUD Operations — create, read, update, delete with Eloquent

### Related Topics
- domain-methods-on-models
- aggregate-boundaries
- aggregate-roots

### Advanced Follow-up Topics
- domain-repositories
- domain-services

## Research Notes
- Fowler's *Patterns of Enterprise Application Architecture* (PoEAA) defines Active Record vs Data Mapper
- Evans's *Domain-Driven Design* assumes Data Mapper; Active Record DDD requires adaptation
- Laravel community discussions on "Fat Models vs Service Classes" continue to evolve
- Real-world Rails apps (Rails being Active Record-native) show the pattern scales to moderate complexity before services are needed
