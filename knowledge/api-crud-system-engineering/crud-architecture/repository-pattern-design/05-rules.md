# Repository Pattern Design — Rules

## Rule 1: Never Return QueryBuilders from Repository Methods
---
## Category
Security
---
## Rule
Always return models, collections, paginators, or DTOs from repository methods; never return Eloquent QueryBuilder instances.
---
## Reason
Returning QueryBuilders lets callers add arbitrary `->where()`, `->orderBy()`, and `->limit()` clauses that bypass tenant scoping, authorization filters, and caching logic built into the repository.
---
## Bad Example
```php
class EloquentUserRepository implements UserRepositoryInterface
{
    public function query(): Builder // ❌ Returns builder — scoping can be bypassed
    {
        return User::query();
    }
}
// Caller: $this->users->query()->where('is_admin', true)->get()
```
---
## Good Example
```php
class EloquentUserRepository implements UserRepositoryInterface
{
    public function search(UserSearchCriteria $criteria): LengthAwarePaginator
    {
        return User::query()
            ->where('tenant_id', tenant()->id) // Scoping always applied
            ->when($criteria->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->paginate($criteria->perPage);
    }
}
```
---
## Exceptions
No common exceptions. Repository methods must return concrete results.
---
## Consequences Of Violation
Broken tenant isolation, bypassed caching, repository abstraction collapse, security gaps.
</rule>

## Rule 2: Use Criteria Objects Instead of Too-Fine Repository Methods
---
## Category
Maintainability
---
## Rule
Never create separate repository methods for every query combination (`findByName`, `findByEmail`, `findByNameAndStatus`); use a criteria object parameter for complex queries.
---
## Reason
Too-fine methods explode combinatorially — 5 filter fields × 2 sort options = 10+ methods. A criteria object keeps the interface stable and grows with query requirements.
---
## Bad Example
```php
interface OrderRepositoryInterface
{
    public function findById(int $id): ?Order;
    public function findByStatus(string $status): Collection;
    public function findByDateRange(Carbon $from, Carbon $to): Collection;
    public function findByCustomerAndStatus(int $customerId, string $status): Collection;
    public function findByCustomerAndDateRange(int $customerId, Carbon $from, Carbon $to): Collection;
    // Method explosion — every new filter adds methods
}
```
---
## Good Example
```php
interface OrderRepositoryInterface
{
    public function find(int $id): ?Order;
    public function search(OrderSearchCriteria $criteria): LengthAwarePaginator;
}
```
---
## Exceptions
Simple unique lookups that are primary access patterns (findByEmail, findBySlug) may be dedicated methods.
---
## Consequences Of Violation
Repository interface with 20+ methods, confusing API, developers add new methods instead of reusing criteria.
</rule>

## Rule 3: Only Add Interfaces When Polymorphism Is Needed
---
## Category
Architecture
---
## Rule
Never create a repository interface for every entity by default; only introduce interfaces when there are multiple implementations, caching decorators, or test-specific stubs.
---
## Reason
Interface + implementation for every entity triples file count. When there is only one implementation, the interface provides no benefit — the concrete class can be type-hinted directly.
---
## Bad Example
```php
// Interface for a simple repository that will never have alternate implementations
interface CountryRepositoryInterface { /* ... */ }
class EloquentCountryRepository implements CountryRepositoryInterface
{
    public function all(): Collection { return Country::all(); }
}
```
---
## Good Example
```php
// Concrete class — no interface needed for single implementation
class CountryRepository
{
    public function all(): Collection { return Country::all(); }
}
```
---
## Exceptions
Enterprise codebases that mandate interfaces for all repositories for consistency may accept the ceremony, but the tradeoff must be acknowledged.
---
## Consequences Of Violation
Ceremony without benefit, increased file count, developers resent the boilerplate.
</rule>

## Rule 4: Keep Repositories Pure Data Access — No Business Logic
---
## Category
Architecture
---
## Rule
Never implement business rules, authorization checks, or event dispatching inside a repository.
---
## Reason
Business logic in repositories violates single responsibility and creates hidden coupling. Services that depend on the repository expect data access, not side effects.
---
## Bad Example
```php
class EloquentUserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
        if (User::where('email', $data['email'])->exists()) { // ❌ Business rule
            throw new \DomainException('Email already exists');
        }
        $user = User::create($data);
        event(new UserCreated($user)); // ❌ Event dispatch in repository
        return $user;
    }
}
```
---
## Good Example
```php
class EloquentUserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
        return User::create($data); // Pure data access
    }
}
```
---
## Exceptions
Multi-tenant scoping (always applying tenant_id filter) is infrastructure-level, not business logic, and belongs in repositories.
---
## Consequences Of Violation
Untestable business logic, side effects during data access, repositories that cannot be used in maintenance scripts.
</rule>

## Rule 5: Test Repository Implementations Against a Real Database
---
## Category
Testing
---
## Rule
Always test repository implementations against a real database (SQLite in-memory or test database), never with mocked Eloquent models.
---
## Reason
Mocking Eloquent models within repository tests tests the mock, not the query logic. Only a real database verifies that scoping, filtering, pagination, and eager loading work correctly.
---
## Bad Example
```php
public function test_find_by_email(): void
{
    $modelMock = Mockery::mock(User::class); // ❌ Mocks Eloquent — tests nothing real
    $modelMock->shouldReceive('where->first')->andReturn(new User());

    $result = $this->repository->findByEmail('test@test.com');
}
```
---
## Good Example
```php
public function test_find_by_email(): void
{
    User::factory()->create(['email' => 'test@test.com']);

    $result = $this->repository->findByEmail('test@test.com');

    $this->assertNotNull($result);
    $this->assertEquals('test@test.com', $result->email);
}
```
---
## Exceptions
Unit tests for services that use repositories should mock the repository interface, not test the repository itself.
---
## Consequences Of Violation
False-positive tests, production query bugs not caught by tests, scoping and pagination errors in production.
</rule>

## Rule 6: Mock Repository Interfaces in Service Tests
---
## Category
Testing
---
## Rule
Always mock repository interfaces in service-layer tests to isolate business logic from data access concerns.
---
## Reason
Repository mocks let service tests run in milliseconds without database setup, focus on business logic, and simulate edge cases (record not found, duplicate entry) that are hard to reproduce with a real database.
---
## Bad Example
```php
public function test_user_registration(): void
{
    $user = User::factory()->create(); // ❌ Real database — slow, tests persistence not logic
    $dto = new RegisterUserDto(/* ... */);
    $result = $this->userService->register($dto);
}
```
---
## Good Example
```php
public function test_user_registration_creates_user(): void
{
    $dto = new RegisterUserDto(name: 'John', email: 'john@test.com');

    $this->userRepository->expects($this->once())
        ->method('create')
        ->willReturn(new User(['name' => 'John']));

    $result = $this->userService->register($dto);
    $this->assertEquals('John', $result->name);
}
```
---
## Exceptions
Integration tests for critical flows may use real repositories, but should supplement, not replace, mocked service tests.
---
## Consequences Of Violation
Slow test suites, tests that break on schema changes, inability to test error scenarios easily.
</rule>
