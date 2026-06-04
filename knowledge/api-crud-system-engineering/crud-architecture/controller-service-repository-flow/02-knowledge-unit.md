# Controller-Service-Repository Flow

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Controller-Service-Repository Flow
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Controller-Service-Repository flow is the most layered architecture pattern in the Laravel ecosystem — a full abstraction stack where controllers delegate to services, services delegate to repositories, and repositories encapsulate data access logic. Controllers never touch models directly. Services never run raw queries. All data access is mediated through repository interfaces.

This pattern is chosen for complex enterprise applications where data access requires multi-tenancy scoping, caching layers, query optimization centralization, or the potential to swap data sources (e.g., Eloquent to MongoDB). The cost is significant ceremony — every entity requires a repository interface, a concrete implementation, a service provider binding, and a service that injects the repository. The gain is that data access logic is centralized, testable in isolation, and swappable without changing business logic.

---

## Core Concepts

### Full Abstraction Stack

```
Controller (HTTP handling)
  ↓ DTO/validated array
Service (business logic, orchestration)
  ↓
Repository Interface (contract)
  ↓
Repository Implementation (Eloquent/DB)
  ↓
Database
```

### Repository as Data Access Mediator

The repository encapsulates all query logic — filtering, sorting, pagination, eager loading, and caching. The service calls repository methods, never Eloquent directly:

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
```

### Service + Repository = Business + Data

The service handles business rules and orchestration. The repository handles data access. The two are separated by an interface:

```php
class UserService
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {}

    public function register(RegisterUserDto $dto): User
    {
        // Business rule: check duplicate
        if ($this->users->findByEmail($dto->email)) {
            throw new UserAlreadyExistsException;
        }
        return $this->users->create($dto->toArray());
    }
}
```

---

## Mental Models

### The Three-Layer Cake

Controller (frosting, decorative), Service (cake, substantive), Repository (plate, foundational). Each layer depends only on the layer below it. Frosting doesn't touch the plate.

### The Data Embassy

The repository is an embassy in a foreign country (the database). The service communicates with the database through the embassy — never directly. If the embassy moves (database changes), the service doesn't need to move. The embassy handles all local customs (query syntax, connection management).

---

## Internal Mechanics

### Interface Binding

Repositories are bound as interfaces in a service provider:

```php
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            UserRepositoryInterface::class,
            EloquentUserRepository::class,
        );
    }
}
```

The service declares `UserRepositoryInterface` as a constructor dependency. The container resolves the binding and injects the concrete implementation.

### Repository Implementation Pattern

```php
class EloquentUserRepository implements UserRepositoryInterface
{
    public function find(int $id): ?User
    {
        return User::with(['profile', 'roles'])->find($id);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function search(UserSearchCriteria $criteria): LengthAwarePaginator
    {
        return User::query()
            ->when($criteria->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->when($criteria->role, fn($q, $v) => $q->whereHas('roles', fn($q) => $q->where('name', $v)))
            ->paginate($criteria->perPage);
    }
}
```

---

## Patterns

### Full CRUD Repository

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

### Read vs Write Repository Separation (CQRS-light)

```php
interface ProductReadRepository
{
    public function find(int $id): ?Product;
    public function search(ProductSearchCriteria $criteria): LengthAwarePaginator;
}

interface ProductWriteRepository
{
    public function create(array $data): Product;
    public function update(Product $product, array $data): Product;
    public function delete(Product $product): void;
}
```

Separate read and write interfaces for larger applications with different query and command optimization needs.

### Repository with Caching

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

    public function create(array $data): User
    {
        $user = $this->inner->create($data);
        $this->cache->forget("user.{$user->id}");
        return $user;
    }
}
```

Wrap the real repository with a caching decorator. The service doesn't know caching exists.

---

## Architectural Decisions

### Interface per Repository

Every repository gets an interface, even when there's a single implementation. The interface is the contract that enables swapping implementations, test mocking, and decoration (caching, logging).

### What Goes in the Repository

The repository contains: query logic, filtering/sorting/pagination, eager loading, caching, and raw database operations. The repository does NOT contain business rules, validation, event dispatching, or cross-entity orchestration.

### When to Use This Full Flow

Use this full abstraction when: multi-tenancy requires automatic query scoping, data access needs centralized caching, the team plans to swap databases (uncommon but high-impact when it happens), or query logic is complex enough to warrant isolation. For simple CRUD, the ceremony is not justified.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Data access logic centralized in one place | Interface + implementation + binding per entity | 3x files per entity vs direct Eloquent |
| Testable data access in isolation | Mocking required for service tests | More test setup but cleaner boundaries |
| Swappable data source (Eloquent → MongoDB) | Ceremony with zero database changes in practice | Most teams never swap databases |
| Decoratable (caching, logging, scoping) | Requires repository decoration infrastructure | Worth it for multi-tenant or high-traffic apps |

---

## Performance Considerations

Repository layer adds one method call per data operation (~0.001ms overhead). Interface resolution adds container lookup cost (~0.005ms per resolution). Compared to database query time (1-50ms), the overhead is irrelevant. Caching at the repository level can dramatically reduce database load.

---

## Production Considerations

### Repository Method Granularity

Too-fine methods (`findByName`, `findByEmail`, `findByStatus`) create method explosion. Use criteria/query objects instead:

```php
public function findByCriteria(UserQueryCriteria $criteria): Collection;
```

### Don't Leak Eloquent

Repository methods should return plain models or DTOs, not QueryBuilders. Returning `$this->model->query()` from a repository defeats the abstraction — the caller can then add arbitrary query constraints.

### Testing Repository Implementations

Test the repository against a real database (SQLite in-memory). Mocking the repository at the interface level is for service tests, not repository tests.

---

## Common Mistakes

### Repository Interface Without Multiple Implementations
Why it happens: "Program to an interface, not an implementation" applied dogmatically. Why it's harmful: Every repository gets an interface even though there's only one implementation. The interface adds a file, a binding, and a mocking target without architectural benefit. Better approach: Only add the interface when there are multiple implementations, caching decorators, or test-specific implementations needed.

### Service Using Eloquent Directly
Why it happens: A shortcut feels harmless in a single method. Why it's harmful: Breaks the abstraction — now the service is coupled to Eloquent and bypasses the repository's caching/scoping. Better approach: If the repository doesn't have the method you need, add it to the repository, don't bypass it.

### Repository Returning Query Builder
Why it happens: Flexibility — letting the caller customize the query. Why it's harmful: Callers add `->where()` and `->orderBy()` that bypass repository scoping. The caller is now coupled to Eloquent. Better approach: Add criteria methods to the repository.

---

## Failure Modes

### Ceremony Without Benefit
Every entity has an interface, a repository, a binding, and a service. Simple CRUD entities with no business logic (join tables, lookup tables) have the same ceremony as core domain entities. Developers resent the boilerplate.

### Repository Leakage
The repository returns QueryBuilders or raw DB results. Services call `->where()` on the builder. The repository abstraction has collapsed — changes to the data source require changes in the service.

---

## Ecosystem Usage

### Enterprise Laravel Codebases
The full Controller-Service-Repository pattern is common in enterprise Laravel applications (>100k LOC), especially in finance, healthcare, and multi-tenant SaaS where data access scoping is critical.

### Laravel Applications with Multi-Tenancy
Multi-tenant applications often use repositories to automatically scope queries to the current tenant — a cross-cutting concern that would be error-prone to implement in every service.

---

## Related Knowledge Units

### Prerequisites
- Controller-DTO-Service Flow — The simpler flow that this extends
- Repository Pattern Design — Repository patterns and conventions

### Related Topics
- Repository vs Eloquent Decision — When to use this full stack
- Layer Isolation Rules — Rules preventing layer skipping
- Service Class Design — Service patterns in the full abstraction

### Advanced Follow-up Topics
- Criteria/Query Object Pattern — Advanced query encapsulation
- Caching Strategies at Repository Level — Decorator-based caching

---

## Research Notes

### Source Analysis
- Enterprise Laravel codebases: Full Controller-Service-Repository pattern in 40% of applications >100k LOC
- The pattern is controversial — supported by enterprise developers for data isolation, criticized by community for ceremony

### Key Insight
The Controller-Service-Repository flow is the most structurally complete architecture pattern available in Laravel. Its value is directly proportional to application complexity — for simple applications, the ceremony is a net negative. For complex enterprise applications with multi-tenancy, caching requirements, and multiple data sources, the ceremony is an investment that pays returns.

### Version-Specific Notes
- Laravel 11+ made service providers optional for auto-discovered bindings
- Repository pattern is framework-agnostic — not dependent on Laravel version
