# ECC Standardized Knowledge — Controller-Service-Repository Flow

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Controller-Service-Repository Flow |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

The Controller-Service-Repository flow is the most layered architecture pattern in the Laravel ecosystem — a full abstraction stack where controllers delegate to services, services delegate to repositories, and repositories encapsulate data access logic. Controllers never touch models directly. Services never run raw queries. All data access is mediated through repository interfaces. This pattern is chosen for complex enterprise applications where data access requires multi-tenancy scoping, caching layers, query optimization centralization, or the potential to swap data sources.

## Core Concepts

- **Full Abstraction Stack**: Controller (HTTP) → Service (business logic) → Repository Interface (contract) → Repository Implementation (Eloquent/DB) → Database
- **Repository as Data Access Mediator**: Encapsulates all query logic — filtering, sorting, pagination, eager loading, and caching. The service calls repository methods, never Eloquent directly.
- **Interface per Repository**: Every repository gets an interface, enabling swapping implementations, test mocking, and decoration (caching, logging).
- **Service + Repository = Business + Data**: Service handles business rules and orchestration; repository handles data access. Separated by an interface contract.
- **Interface Binding**: Repositories are bound as interfaces in a service provider. The container resolves the binding and injects the concrete implementation.

## When To Use

- Multi-tenancy that requires automatic query scoping across all data access
- Data access that needs centralized caching (decorator pattern at repository level)
- Applications where the team plans to swap databases (Eloquent → MongoDB)
- Complex query logic that warrants isolation from business logic
- Enterprise applications >100k LOC with strict data access governance

## When NOT To Use

- Simple CRUD applications — the ceremony (interface + implementation + binding per entity) is not justified
- When there is no realistic path to swapping data sources
- Small teams where the overhead slows iteration velocity
- For lookup tables, join tables, or entities with no business logic
- When the team is not disciplined enough to prevent repository leakage

## Best Practices

- Every repository gets an interface, even with a single implementation — it enables decoration and test mocking
- Repository methods should return plain models or DTOs, not QueryBuilders
- Use criteria/query objects instead of too-fine methods (`findByName`, `findByEmail`) to avoid method explosion
- Test repository implementations against a real database (SQLite in-memory)
- Mock repository interfaces for service tests
- Only add the full stack where it provides measurable benefit — not for every entity

## Architecture Guidelines

- Repositories contain: query logic, filtering/sorting/pagination, eager loading, caching, raw database operations
- Repositories do NOT contain: business rules, validation, event dispatching, cross-entity orchestration
- Service layer handles business rules; repository handles data access
- Interface binding in service provider: `$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)`
- Consider read/write repository separation (CQRS-light) for applications with different query and command optimization needs

## Performance Considerations

- Repository layer adds ~0.001ms per data operation (method call overhead)
- Interface resolution adds ~0.005ms container lookup cost per resolution
- Compared to database query time (1-50ms), the overhead is irrelevant
- Caching at the repository level can dramatically reduce database load
- Decorator-based caching (CachedUserRepository wrapping real repository) adds no measurable overhead

## Security Considerations

- Repository-level query scoping is critical for multi-tenant data isolation — never let raw Eloquenmt bypass this
- Returning QueryBuilders from repositories allows callers to add un-scoped queries, breaking tenant isolation
- Repository caching must respect authorization — never cache data that should be user-scoped without proper cache key namespacing
- Write repositories should not expose soft-deleted records unless explicitly intended

## Common Mistakes

- **Repository Interface Without Multiple Implementations**: Adding an interface for every repository even with one implementation. Solution: Only add the interface when there are multiple implementations, caching decorators, or test-specific implementations needed.
- **Service Using Eloquent Directly**: A shortcut that breaks the abstraction and bypasses repository caching/scoping. Solution: If the repository doesn't have the method, add it to the repository.
- **Repository Returning Query Builder**: Lets callers add `->where()` and `->orderBy()` that bypass repository scoping. Solution: Add criteria methods to the repository.
- **Repository Method Explosion**: Too-fine methods create dozens of methods. Solution: Use criteria/query objects.

## Anti-Patterns

- **Ceremony Without Benefit**: Every entity gets interface + repository + binding + service even for simple lookup tables. Developers resent the boilerplate.
- **Repository Leakage**: Repository returns QueryBuilders or raw DB results; services call `->where()` on the builder. The abstraction has collapsed.
- **Anemic Service with Complete Repository**: Service just calls repository methods with no business logic. The service layer adds ceremony without value.
- **Leaking Eloquent Through Repository**: Repository methods accept or return Eloquent-specific types (Builder, Collection with query methods), coupling callers to Eloquent.

## Examples

### Full CRUD Repository Interface
```php
interface ProductRepositoryInterface
{
    public function find(int $id): ?Product;
    public function findAll(array $criteria = []): Collection;
    public function paginate(array $criteria = [], int $perPage = 15): LengthAwarePaginator;
    public function create(array $data): Product;
    public function update(Product $product, array $data): Product;
    public function delete(Product $product): void;
}
```

### Repository with Caching Decorator
```php
class CachedUserRepository implements UserRepositoryInterface
{
    public function __construct(
        private UserRepositoryInterface $inner,
        private CacheRepository $cache,
    ) {}

    public function find(int $id): ?User
    {
        return $this->cache->remember("user.{$id}", 3600, function () use ($id) {
            return $this->inner->find($id);
        });
    }
}
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Controller-DTO-Service Flow | The simpler flow this extends | Prerequisite |
| Repository Pattern Design | Repository patterns and conventions | Prerequisite |
| Service Class Design | Service patterns in the full abstraction | Prerequisite |
| Repository vs Eloquent Decision | When to use this full stack | Related |
| Layer Isolation Rules | Rules preventing layer skipping | Related |
| Criteria/Query Object Pattern | Advanced query encapsulation | Follow-up |
| Caching Strategies at Repository Level | Decorator-based caching | Follow-up |

## AI Agent Notes

- This is the most structurally complete architecture pattern in Laravel — its value is proportional to application complexity
- For simple apps, the ceremony is a net negative. For complex enterprise apps with multi-tenancy, the ceremony is an investment that pays returns
- The pattern is controversial — enterprise developers support it for data isolation; the community criticizes it for ceremony
- When generating code for this pattern: interface → implementation → service provider binding → service → controller wiring
- Only introduce this full stack for core domain entities, not for join tables or lookup entities

## Verification

- [ ] Controllers never call Eloquent models directly
- [ ] Services never run raw queries or call Eloquent directly
- [ ] All data access is mediated through repository interfaces
- [ ] Repository methods do not return QueryBuilders
- [ ] Repository interfaces exist for every repository
- [ ] Interface bindings are registered in a service provider
- [ ] Each layer has a single, clear responsibility
- [ ] Ceremony is justified by application complexity
