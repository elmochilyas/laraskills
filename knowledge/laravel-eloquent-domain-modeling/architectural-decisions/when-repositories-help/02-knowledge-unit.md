# When Repositories Help

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Architectural Decisions
- **Last Updated:** 2026-06-02

## Executive Summary
Repositories abstract data storage behind a collection-like interface. They add value when the application connects to multiple data sources, has complex persistence logic that doesn't map to Eloquent's conventions, or needs to swap storage strategies. In a Laravel context, repositories are a tactical choice — use them when Active Record's direct database coupling becomes a liability, not as a default architectural layer.

## Core Concepts
- **Repository Pattern:** A mediator between domain and data mapping layers, acting like an in-memory collection of domain objects.
- **Persistence Ignorance:** Domain code doesn't know about MySQL, Redis, or external APIs — only the repository interface.
- **Collection Interface:** Repositories mimic collections with ind, indAll, store, delete semantics.
- **Multiple Backends:** Same interface backed by MySQL, Redis, external API, or in-memory.
- **Aggregate Root Persistence:** Repositories typically only manage aggregate roots, not every entity.

## Mental Models
- **The Library Catalog:** You don't walk into the stacks (database). You ask the catalog (repository) for the book (entity), and it retrieves it from wherever it's stored.
- **The Swiss Bank Vault:** The client asks for their box (aggregate). The vault (repository) retrieves it from whatever physical location. The client doesn't care if it's in a safe, a drawer, or a safety deposit box.
- **The Collection Box:** A repository is a collection you can add to and remove from, but the actual storage might be a shelf, a filing cabinet, or a digital system — the collection interface stays the same.

## Internal Mechanics
1. Define an interface in the domain layer (e.g., ContractRepository).
2. Implement the interface with an Eloquent-backed concrete class.
3. Inject the interface into action/use-case classes.
4. The concrete repository translates domain method calls into Eloquent queries.
5. For testing, swap the Eloquent implementation with an in-memory array implementation or mock.

## Patterns
- **Interface-Backed Repository:** Domain defines interface; infrastructure implements.
- **Eloquent Repository:** Standard implementation using Eloquent models internally.
- **Cached Repository:** Decorator pattern — in-memory cache + Eloquent fallback.
- **External API Repository:** Implementation wraps HTTP calls behind the collection interface.
- **Composite Repository:** Combines results from multiple backends (e.g., local DB + remote API).

## Architectural Decisions
- Use a repository when you have multiple data sources for the same aggregate.
- Use a repository when the storage logic is complex (custom serialization, event stream storage).
- Use a repository when you need to unit-test domain logic without database setup.
- Use a repository when you expect to change storage backend.
- Use a repository when the persistence strategy doesn't fit Eloquent conventions (e.g., event sourcing).

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouples domain from ORM/database | Extra interfaces and implementations increase code volume | Worth it only when storage varies |
| Simplifies testing with in-memory replacement | Can become a leaky abstraction if Eloquent-specific features leak through interface | Keep interface generic; avoid where() style methods |
| Single place for complex query logic | Repositories can become god classes with too many methods | One repository per aggregate root, keep focused |
| Swap storage without touching domain | Adds indirection that obscures what queries actually run | Profile with Laravel Debugbar |
| Explicit persistence contract documented by interface | Teams often add repositories by default without justification | Question every repository: "What alternative storage would this enable?" |

## Performance Considerations
- Repository method calls add a single PHP method invocation — negligible.
- Lazy-loading prevention: Repositories should eager-load required relations explicitly.
- Pagination: Repository indAll should accept pagination parameters, not return all rows.
- Caching: Consider a caching decorator that wraps the Eloquent repository without changing its interface.

## Production Considerations
- **Testing:** The in-memory repository implementation eliminates database setup for unit tests.
- **Eager Loading:** Repository methods that return models should accept an $with parameter for relations.
- **Monitoring:** Add logging/timing decorators around repository calls for observability.
- **Transaction Management:** Repositories should not manage transactions — that's the action/use-case layer.
- **Soft Deletes:** Expose indWithTrashed and indOnlyTrashed in the repository interface if the domain cares about soft-deleted entities.

## Common Mistakes
- Creating a repository for every model, including simple lookup tables.
- Exposing Eloquent-specific methods (scopes, whereRaw) on the repository interface.
- Making the repository interface too granular (individual methods for every query combination).
- Using repositories for read-only queries that never change storage — use query objects instead.
- Implementing save() on the repository when the model already has save() — this just wraps one call with another.

## Failure Modes
- **Leaky Abstraction:** The repository interface mirrors Eloquent's API exactly, making the abstraction pointless. Mitigate: Design the interface around domain concepts, not SQL operations.
- **Repository Per Entity Proliferation:** 50 repository interfaces for 50 database tables. Mitigate: Only create repositories for aggregate roots that genuinely need storage abstraction.
- **N+1 via Repository:** Repository returns a collection, then lazy-loads relations one-by-one. Mitigate: document required relations in the method signature or use a spec pattern.
- **Transaction Antipattern:** Repository manages its own transaction, causing nested transaction issues. Mitigate: always let the caller manage the transaction boundary.

## Ecosystem Usage
- **Laravel Spark:** Not used prominently — Spark prefers direct Eloquent usage + action classes.
- **Laravel Cashier:** Not used — Stripe/Paddle SDKs called directly in actions.
- **DDD-Laravel projects:** Community pattern: App\Contracts\Repositories\{Entity}Repository.php and App\Repositories\Eloquent{Entity}Repository.php.
- **Event Sourcing packages (spatie/laravel-event-sourcing):** Repositories for aggregate root persistence on event streams.
- **lucadegasperi/oauth2-server-laravel:** Uses repositories for access token, client, and session storage abstraction.
## Related Knowledge Units

### Prerequisites
- [Model Design](../model-design/02-knowledge-unit.md)
- [Domain Modeling Patterns](../domain-modeling-patterns/02-knowledge-unit.md)

### Related Topics
- [When Repositories Hurt](../when-repositories-hurt/02-knowledge-unit.md) — Direct counterpart; when NOT to use repositories.
- [Query Object Alternative](../query-object-alternative/02-knowledge-unit.md) — Better pattern for read-heavy queries.
- [Ports and Adapters](../ports-and-adapters/02-knowledge-unit.md) — Repositories are the adapter layer in hexagonal architecture.
- [Eloquent as Adapter](../eloquent-as-adapter/02-knowledge-unit.md) — Eloquent as the infrastructure adapter behind repository interfaces.

### Advanced Follow-up Topics

## Research Notes
- **Eric Evans (DDD Blue Book):** Repositories are a fundamental DDD building block for aggregate root persistence.
- **Martin Fowler (PoEAA):** Repository pattern mediates between domain and data mapping.
- **Taylor Otwell:** Does not advocate for repositories in Laravel; prefers direct Eloquent usage + factories for testing.
- **Freek Van der Herten (spatie):** Uses repositories selectively — only when multiple data sources exist.
- **Architecture discussions (2022-2025):** Growing consensus that repositories are not a default Laravel layer but a tactical choice.