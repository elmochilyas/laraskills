# ECC Standardized Knowledge — Repository Pattern Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Repository Pattern Design |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

The repository pattern is a data access abstraction that mediates between the business logic layer and the persistence layer. In Laravel, a repository encapsulates Eloquent queries behind an interface or class, providing a centralized location for query logic, eager loading, filtering, sorting, pagination, and caching. The pattern's primary value is isolating business logic from persistence concerns — creating a test seam and a change point for data access. The cost is ceremony: an interface, a class, and a service provider binding per entity.

## Core Concepts

- **Repository Interface**: Defines the contract for data access — basic CRUD, query methods, aggregation, and bulk operations. The service depends on the interface, not the implementation.
- **Repository Implementation**: Encapsulates Eloquent query logic behind the interface. Methods return models or DTOs, never QueryBuilders.
- **Interface Binding**: Repositories are bound via service provider: `$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class)`.
- **Criteria/Query Objects**: For complex queries, encapsulate search parameters in a typed criteria object instead of creating too-fine methods.
- **Read/Write Separation (CQRS-light)**: Separate interfaces for read and write operations allows independent optimization of queries and commands.

## When To Use

- Complex query logic that should be centralized and reused
- Multi-tenancy requiring automatic query scoping across all data access
- Caching at the data access layer (decorator pattern)
- Applications where test seams at the data access boundary are valuable
- Enterprise applications >100k LOC with strict data access governance

## When NOT To Use

- Simple CRUD entities with trivial query logic (find, create, update, delete only)
- Lookup tables and join tables with no query complexity
- Small applications where ceremony outweighs benefits
- When the repository would just mirror Eloquent's API without adding value

## Best Practices

- Do NOT return QueryBuilders from repository methods — return models or DTOs
- Use criteria/query objects instead of too-fine methods (`findByName`, `findByEmail`) to avoid method explosion
- Keep repositories focused on data access — no business rules, no event dispatching, no cross-entity orchestration
- Test repository implementations against a real database (SQLite in-memory)
- Mock repository interfaces in service tests
- Only add interfaces when there are multiple implementations, caching decorators, or test-specific implementations needed

## Architecture Guidelines

- Repositories contain: query logic, filtering/sorting/pagination, eager loading, caching, raw database operations
- Repositories do NOT contain: business rules, validation, event dispatching, cross-entity orchestration
- Repository-level caching uses the decorator pattern — wrap the real repository with a caching layer
- Multi-tenant scoping is applied at the repository level using a decorator or base repository
- Consider CQRS-light separation (read vs write interfaces) for applications with different query and command optimization needs

## Performance Considerations

- Repository method call adds ~0.001ms overhead; interface resolution adds ~0.005ms
- Compared to database queries (1-50ms), overhead is irrelevant
- Repository-level caching can dramatically reduce database load for read-heavy workloads
- Decorator pattern adds no measurable overhead beyond the inner repository call

## Security Considerations

- Repository returning QueryBuilders allows callers to add un-scoped queries, breaking tenant isolation — never expose QueryBuilders
- Repository caching must respect data authorization — scope cache keys by user/tenant to prevent cross-user data leaks
- Write repositories should not expose soft-deleted records unless explicitly intended
- Multi-tenant scoping at the repository level ensures tenant isolation is always applied

## Common Mistakes

- **Interface Without Multiple Implementations**: Adding an interface for every repository even with a single implementation. Solution: Only add the interface when polymorphism is needed.
- **Repository Returning QueryBuilder**: Providing maximum flexibility but bypassing repository scoping. Solution: Add criteria methods instead.
- **Repository Performing Business Logic**: Adding email uniqueness checks or authorization. Solution: Keep repositories pure data access; business rules belong in services/actions.
- **Repository Method Explosion**: Too-fine methods for every query variation. Solution: Use criteria/query objects.

## Anti-Patterns

- **Ceremony Without Benefit**: Interface + implementation + binding for every entity even for simple lookup tables. Developers resent the boilerplate.
- **Repository Leakage**: Services call Eloquent methods directly on repository results or the repository returns QueryBuilders. The abstraction has collapsed.
- **Anemic Repository**: Repository that just mirrors `Model::create()`, `Model::find()` etc. with no additional query logic, caching, or scoping.

## Examples

### Repository with Criteria Object
```php
interface UserRepositoryInterface
{
    public function find(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function create(array $data): User;
    public function update(User $user, array $data): User;
    public function delete(User $user): void;
    public function search(UserSearchCriteria $criteria): LengthAwarePaginator;
}

class EloquentUserRepository implements UserRepositoryInterface
{
    public function search(UserSearchCriteria $criteria): LengthAwarePaginator
    {
        return User::query()
            ->when($criteria->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->paginate($criteria->perPage);
    }
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
| Eloquent Fundamentals | The implementation layer of repositories | Prerequisite |
| Service Class Design | Services that consume repositories | Prerequisite |
| Repository vs Eloquent Decision | When to use this pattern | Related |
| Layer Isolation Rules | Rules preventing repository bypass | Related |
| Controller-Service-Repository Flow | The full abstraction stack | Related |
| Criteria/Query Object Pattern | Advanced query encapsulation | Follow-up |
| Repository Decorators | Caching, scoping, logging | Follow-up |

## AI Agent Notes

- The repository pattern's primary value is query logic centralization, not data source swap-readiness (which rarely happens)
- A centralized repository means developers can find every query for an entity in one file
- Default to no interface for single-implementation repositories; add interfaces for decoration or polymorphism
- When generating repositories, start with the interface only if multiple implementations are anticipated
- Never generate repository methods that return QueryBuilders — always return models, collections, or DTOs

## Verification

- [ ] Repository methods do not return QueryBuilders
- [ ] Repository does not contain business rules or event dispatching
- [ ] Repository interface exists when multiple implementations are needed
- [ ] Binding is registered in a service provider
- [ ] Criteria objects are used instead of too-fine query methods
- [ ] Repository is tested against a real database
- [ ] Service tests mock the repository interface
- [ ] No Eloquent leakage from repository methods
