# Repository Pattern Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Repository Pattern Design
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

The repository pattern is a data access abstraction that mediates between the business logic layer and the persistence layer. In Laravel, a repository encapsulates Eloquent queries behind an interface or class, providing a centralized location for query logic, eager loading, filtering, sorting, pagination, and caching. The pattern's primary value is isolating business logic from persistence concerns.

The engineering significance is that repositories create a test seam and a change point for data access. When query complexity grows, it's contained in the repository. When multi-tenancy scoping is needed, it's added in the repository. When caching is required, it's applied in the repository. The cost is ceremony — an interface, a class, and a service provider binding per entity — that is only justified when data access logic is non-trivial.

---

## Core Concepts

### Repository Interface

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

### Repository Implementation

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

### Interface Binding

```php
// In service provider
$this->app->bind(
    UserRepositoryInterface::class,
    EloquentUserRepository::class,
);
```

The service declares the interface in its constructor; the container resolves the binding.

---

## Mental Models

### The Data Embassy

The repository is an embassy in a foreign country (the database). The service communicates with the database through the embassy — never directly. If the embassy moves (database changes), the service doesn't need to move.

### The Query Library

A repository is a library of named queries. Instead of writing `User::where('status', 'active')->orderBy('name')->...` in every service method, the repository provides `findActive()` or `search(criteria)`. The query is written once and reused.

---

## Internal Mechanics

### Repository Method Types

| Type | Examples | Description |
|------|----------|-------------|
| Basic CRUD | `find`, `create`, `update`, `delete` | Standard entity operations |
| Query methods | `findByEmail`, `findActive`, `search` | Named queries for common access patterns |
| Aggregation | `count`, `sum`, `exists` | Data aggregation without hydrating models |
| Bulk operations | `insertMany`, `updateWhere` | Batch operations for performance |

### Criteria/Query Object Pattern

For complex queries, encapsulate search parameters in a criteria object:

```php
class UserSearchCriteria
{
    public function __construct(
        public readonly ?string $search = null,
        public readonly ?string $role = null,
        public readonly ?string $status = null,
        public readonly ?string $sortBy = 'created_at',
        public readonly string $sortDirection = 'desc',
        public readonly int $perPage = 15,
    ) {}
}
```

---

## Patterns

### Read/Write Repository Separation (CQRS-light)

```php
interface UserReadRepository
{
    public function find(int $id): ?User;
    public function search(UserSearchCriteria $criteria): LengthAwarePaginator;
}

interface UserWriteRepository
{
    public function create(array $data): User;
    public function update(User $user, array $data): User;
    public function delete(User $user): void;
}
```

Separate interfaces for read and write operations, allowing independent optimization.

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

### Repository with Multi-Tenant Scoping

```php
class TenantScopedUserRepository implements UserRepositoryInterface
{
    public function __construct(
        private UserRepositoryInterface $inner,
        private TenantContext $tenant,
    ) {}

    public function search(UserSearchCriteria $criteria): LengthAwarePaginator
    {
        $criteria = new UserSearchCriteria(
            tenantId: $this->tenant->id(),
            ...$criteria->toArray(),
        );
        return $this->inner->search($criteria);
    }
}
```

---

## Architectural Decisions

### What Belongs in the Repository

The repository contains: query logic, filtering/sorting/pagination, eager loading, caching, and raw database operations. It does NOT contain business rules, validation, event dispatching, or cross-entity orchestration.

### What Does NOT Belong

- Business rules (email uniqueness checks → service)
- Event dispatching (UserRegistered → action/service)
- Authorization checks (can delete? → controller/gate)
- Cross-entity queries (users + orders → separate repositories)

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized query logic — one place to change queries | Interface + implementation + binding per entity | 3 files per entity vs 0 |
| Test seam — mock repositories in service tests | Mocking requires interface setup | More test boilerplate |
| Decoratable — add caching, logging, scoping | Repository decoration infrastructure | Worth it for multi-tenant or high-traffic apps |
| Data source swap possible | Most teams never swap databases | Real value is query centralization, not swap-readiness |

---

## Performance Considerations

Repository method call adds ~0.001ms overhead. Interface resolution adds ~0.005ms. Compared to database queries (1-50ms), overhead is irrelevant. Repository-level caching can dramatically reduce database load.

---

## Production Considerations

### Don't Leak Eloquent

Repository methods must NOT return QueryBuilders. Returning `$this->model->query()` defeats the abstraction — callers can add arbitrary query constraints that bypass repository scoping.

### Method Granularity

Too-fine methods (`findByName`, `findByEmail`, `findByStatus`) create method explosion. Use criteria objects for parameterized queries.

### Testing Repositories

Test repositories against a real database (SQLite in-memory). Mock repository interfaces in service tests:

```php
// Repository test (integration)
public function test_find_by_email_returns_user()
{
    User::factory()->create(['email' => 'test@test.com']);
    $repo = new EloquentUserRepository();
    $user = $repo->findByEmail('test@test.com');
    $this->assertNotNull($user);
}

// Service test (unit — mock repository)
$repo = $this->createMock(UserRepositoryInterface::class);
$repo->method('findByEmail')->willReturn($user);
```

---

## Common Mistakes

### Interface Without Multiple Implementations
Why it happens: "Program to an interface" applied dogmatically. Why it's harmful: Every repository gets an interface even with one implementation, adding ceremony without benefit. Better approach: Only add the interface when you have multiple implementations, caching decorators, or test-specific implementations needed.

### Repository Returning QueryBuilder
Why it happens: Providing maximum flexibility to the caller. Why it's harmful: Callers add ->where() and ->orderBy() that bypass repository scoping. Better approach: Add criteria methods to the repository instead of exposing the query builder.

### Repository Performing Business Logic
Why it happens: Adding email uniqueness checks or authorization in the repository because it "accesses the data." Why it's harmful: Business logic is scattered across layers. Better approach: Keep repositories pure data access. Business rules belong in services/actions.

---

## Failure Modes

### Ceremony Without Benefit
Every entity has an interface, repository, and binding even for simple lookup tables with no query logic. Developers resent the boilerplate.

### Repository Leakage
Services call Eloquent methods directly on repository results (e.g., `$repo->find($id)->where(...)`) or the repository returns query builders. The abstraction has collapsed — changes to the data source require changes in the service.

---

## Ecosystem Usage

### Enterprise Laravel Applications
Common in applications >100k LOC, multi-tenant SaaS, and regulated industries (finance, healthcare) where data access auditability is required.

### Monica CRM
Monica uses repository-like query encapsulation for complex contact and relationship queries.

---

## Related Knowledge Units

### Prerequisites
- Service Class Design — Services that consume repositories
- Eloquent Fundamentals — The implementation layer of repositories

### Related Topics
- Repository vs Eloquent Decision — When to use this pattern
- Layer Isolation Rules — Rules preventing repository bypass
- Controller-Service-Repository Flow — The full abstraction stack

### Advanced Follow-up Topics
- Criteria/Query Object Pattern — Query encapsulation
- Repository Decorators (Caching, Scoping, Logging) — Advanced decoration

---

## Research Notes

### Source Analysis
- Enterprise Laravel codebases: ~40% of applications >100k LOC use repositories
- The pattern is controversial — supported for data isolation, criticized for ceremony
- Monica CRM: Repository-like query encapsulation at scale

### Key Insight
The repository pattern's primary value is not data source swap-readiness (which rarely happens) but query logic centralization. A centralized repository means a developer can find every query for an entity in one file. This is invaluable for maintenance but must be weighed against the ceremony cost.

### Version-Specific Notes
- Laravel 11+ made service providers optional for auto-discovered bindings — repository binding still requires explicit provider registration
- Repository pattern is framework-agnostic
