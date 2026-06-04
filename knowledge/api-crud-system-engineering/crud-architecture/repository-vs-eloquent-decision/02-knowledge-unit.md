# Repository vs Eloquent Decision

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Repository vs Eloquent Decision
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

The repository vs direct Eloquent decision is one of the most debated topics in Laravel architecture. Direct Eloquent is the default — models are queried directly in services or actions without a repository abstraction. The repository pattern introduces an interface and implementation class to mediate between business logic and data access. The debate is not about right vs wrong but about ceremony vs centralized query control.

The engineering tradeoff is direct: Eloquent is productive, zero-ceremony, and leverages the framework's full query builder power. Repositories centralize query logic, provide a test seam, enable decoration (caching, scoping), and theoretically allow data source swapping. The decision depends on application complexity, team size, and long-term maintenance requirements.

---

## Core Concepts

### Direct Eloquent

```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return User::create($dto->toArray());
    }
}
```

Simple, productive, no abstraction. The action is directly coupled to Eloquent.

### Repository Pattern

```php
interface UserRepositoryInterface { /* ... */ }

class EloquentUserRepository implements UserRepositoryInterface { /* ... */ }

class CreateUserAction
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {}

    public function execute(CreateUserDto $dto): User
    {
        return $this->users->create($dto->toArray());
    }
}
```

Abstraction layer between action and Eloquent. More ceremony but more control.

---

## Decision Framework

### Use Direct Eloquent When

- Simple CRUD with minimal query logic (find, create, update, delete)
- Small to medium application (<50 models)
- Single data source (no plan to change)
- No multi-tenancy or cross-cutting query scoping
- Team prioritizes development speed over data access abstraction
- Queries are simple enough to understand at call site

### Use Repository When

- Complex query logic that should be centralized
- Multi-tenancy requires automatic query scoping
- Caching at the data access layer is required
- Multiple applications access the same data source
- Team is large enough to benefit from clear data access contracts
- The application has >50 models with varying query complexity

### Hybrid Approach

```php
// 90% of entities: direct Eloquent
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return User::create($dto->toArray());
    }
}

// 10% of entities: repository (only where needed)
class OrderService
{
    public function __construct(
        private OrderRepositoryInterface $orders,  // Complex query logic warrants abstraction
    ) {}
}
```

The pragmatic middle — use repositories only where they add value.

---

## Mental Models

### The Default Path

Direct Eloquent is the default path. The repository is a detour you take only when the default path has specific problems: scattered queries, caching needs, multi-tenancy complexity.

### The Extraction Decision

Don't ask "should I use a repository?" Ask "do I have a problem that a repository solves?" If you don't have scattered queries, caching needs, or multi-tenancy, you don't have the problem.

---

## Internal Mechanics

### Eloquent ActiveRecord vs Repository Abstraction

Eloquent follows the ActiveRecord pattern — a model instance directly represents a database row and provides both data and data-access methods in a single class. `User::find($id)` calls the static `find` method on the `Model` class, which constructs a query builder, executes the query, and hydrates a model instance — all within the Eloquent ORM. This tight coupling makes development fast but means every call site is directly coupled to Eloquent's query builder API.

### Query Construction Flow

With direct Eloquent: `User::where('active', true)->orderBy('name')->get()` constructs a query via Eloquent's query builder, which compiles to SQL and executes against the database. The entire flow is inside the Eloquent ORM.

With a repository: `$this->users->findActive()` calls a repository method that internally constructs the same query. The difference is that the query logic lives in one place (the repository) instead of being scattered across every service or action that needs active users.

### Resolution Differences

Direct Eloquent resolves via facades or static calls — no container resolution needed. Repository injection requires the container to resolve an interface to a concrete implementation via a service provider binding. This adds one indirection layer during resolution but enables swapping implementations for testing (mock repository) or decoration (caching repository).

---

## Patterns

### Extraction When Needed

```php
// Phase 1: Direct Eloquent (default)
class UserService
{
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }
}

// Phase 2: Extract to repository when query complexity grows
class UserService
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {}

    public function findByEmail(string $email): ?User
    {
        return $this->users->findByEmail($email);
    }
}
```

Extract the repository when the query logic becomes non-trivial or needs centralization. Don't extract prematurely.

### Repository Only for Complex Entities

```php
// Simple entities — direct Eloquent
class TagService
{
    public function create(string $name): Tag
    {
        return Tag::create(['name' => $name]);
    }
}

// Complex entities — repository
class OrderService
{
    public function __construct(
        private OrderRepositoryInterface $orders,  // Complex queries, caching, scoping
    ) {}
}
```

---

## Architectural Decisions

### The Ceremony Threshold

The decision is a cost-benefit analysis:

```
Benefit = query complexity * number of call sites * decoration needs
Cost = interface file + implementation file + binding + mocking overhead
```

When benefit > cost, use a repository. When cost > benefit, use direct Eloquent.

### Team Size Impact

Small teams (1-5 developers) benefit less from repositories because the communication overhead that repositories solve doesn't exist. Large teams (10+ developers) benefit more from clear data access contracts.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized query logic — one place to change | Interface + implementation + binding per entity | 3 files per repository entity |
| Test seam — mock repositories | Mocking requires interface setup | Simpler service tests, more boilerplate |
| Decoration — add caching, scoping without changing services | Repository decoration infrastructure needed | Worth it for multi-tenant apps |
| Data source swap possible | Most teams never swap | Real value is query centralization, not swap-readiness |
| Direct Eloquent: zero ceremony, full framework power | Direct Eloquent: queries scattered across codebase | Acceptable for small codebases |

---

## Performance Considerations

Direct Eloquent is slightly faster (no interface resolution, no method delegation). The difference (~0.01ms per query) is irrelevant. Repository-level caching can dramatically outperform direct Eloquent for read-heavy workloads.

---

## Production Considerations

### Migration Cost

Moving from direct Eloquent to repositories is straightforward:
1. Create the repository interface
2. Create the Eloquent implementation
3. Create the binding
4. Replace `Model::query()` calls with `$this->repository->method()`

Each entity takes ~30 minutes. Start with the most complex entities.

### Code Review Signal

If a repository has the same methods as `Model` with no additional query logic, it's a red flag. The repository should add value (centralized mutli-tenancy, caching, complex filtering) — not just mirror Eloquent's API.

---

## Common Mistakes

### Premature Repository Abstraction
Why it happens: Creating repositories for every entity because "the architecture requires it." Why it's harmful: Adds ceremony without benefit for simple CRUD entities. The team wastes time maintaining interfaces and bindings for entities that never need them. Better approach: Start with direct Eloquent. Extract repositories only when query complexity or cross-cutting concerns justify them.

### Repository Interface Without Multiple Implementations
Why it happens: Dogmatic "program to an interface" applied to repositories with a single implementation. Why it's harmful: The interface adds ceremony without enabling polymorphism. Better approach: Use concrete classes for single-implementation repositories. Add interfaces when you have caching decorators, test doubles, or data source alternatives.

### Never Using Repositories When Needed
Why it happens: Dogmatic "repositories are bad" stance. Why it's harmful: Query logic is scattered across 20+ call sites, making changes risky. Multi-tenancy scoping is forgotten in half the queries. Better approach: Use repositories pragmatically where they solve real problems.

---

## Failure Modes

### Java-itis
Every entity has a repository interface and implementation, but 90% of repositories just mirror Eloquent's CRUD API. The codebase has 3x the files with no architectural benefit. Developers resent the ceremony.

### Scattered Queries Hell
No repositories. Complex query logic with custom filters and joins is duplicated across 10+ call sites. A change to the query requires finding and updating every duplication. No centralization, no consistency.

---

## Ecosystem Usage

### Laravel Core
Laravel itself does not use repositories. The framework authors prefer direct Eloquent in Jetstream, Fortify, Cashier, and Horizon.

### Enterprise Laravel
~40% of enterprise Laravel applications (>100k LOC) use repositories for complex entities. The pattern is common in finance, healthcare, and multi-tenant SaaS.

---

## Related Knowledge Units

### Prerequisites
- Repository Pattern Design — What repositories are
- Eloquent Fundamentals — What direct Eloquent provides

### Related Topics
- Layer Isolation Rules — Rules preventing direct Eloquent from services
- When to Skip Layers — Pragmatic exceptions to the full abstraction

### Advanced Follow-up Topics
- Criteria/Query Object Pattern — Advanced query encapsulation
- Multi-Tenancy Scoping in Repositories — Tenant-aware queries

---

## Research Notes

### Source Analysis
- Laravel core: Direct Eloquent preferred by framework authors
- Enterprise codebases: Repository pattern in ~40% of >100k LOC applications
- Community: Hybrid approach is the emerging consensus (2024-2026)

### Key Insight
The repository vs Eloquent debate is over-polarized. The correct answer is "it depends" — use direct Eloquent for simple entities, repositories for entities where query complexity, caching, or cross-cutting scoping justifies the abstraction. The hybrid approach is the production-proven consensus.

### Version-Specific Notes
- Repository pattern is framework-agnostic; same considerations across Laravel 8-13
- Eloquent's scoped() method (Laravel 8+) reduces some benefits of repository scoping by providing global query macros
