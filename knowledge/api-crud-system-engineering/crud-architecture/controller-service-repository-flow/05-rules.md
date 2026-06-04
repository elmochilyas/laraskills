# Controller-Service-Repository Flow — Rules

## Rule 1: Controllers Must Never Bypass the Service Layer
---
## Category
Layer Isolation
---
## Rule
Never call Eloquent models, repositories, or the DB facade directly from a controller; always delegate through a service or action.
---
## Reason
Controllers that access data directly bypass business rules, authorization checks, caching, and query scoping. Every direct call is a security and consistency gap.
---
## Bad Example
```php
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = User::with('posts')->find($id); // ❌ Controller queries model directly
        return response()->json($user);
    }
}
```
---
## Good Example
```php
class UserController
{
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->find($id);
        return response()->json($user);
    }
}
```
---
## Exceptions
No common exceptions. Controllers must never touch data access.
---
## Consequences Of Violation
Bypassed business rules, inconsistent query scoping, untestable logic, architecture collapse.
</rule>

## Rule 2: Repository Methods Must Not Return QueryBuilders
---
## Category
Security
---
## Rule
Always return models, collections, or DTOs from repository methods; never return Eloquent QueryBuilder instances.
---
## Reason
Returning QueryBuilders lets callers add `->where()`, `->orderBy()`, and other modifiers that can bypass tenant scoping, authorization filters, and caching. It collapses the repository abstraction.
---
## Bad Example
```php
class EloquentUserRepository implements UserRepositoryInterface
{
    public function query(): Builder // ❌ Returns QueryBuilder
    {
        return User::query();
    }
}
// Consumer can add un-scoped filters: $this->users->query()->where('is_admin', true)->get()
```
---
## Good Example
```php
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
---
## Exceptions
No common exceptions. Repository methods must always return concrete results.
---
## Consequences Of Violation
Broken tenant isolation, repository abstraction collapse, callers bypass repository-level caching and scoping.
</rule>

## Rule 3: Services Must Never Call Eloquent Directly When Repositories Exist
---
## Category
Layer Isolation
---
## Rule
Never use Eloquent models or the DB facade directly in a service when a repository interface exists for that entity; always go through the repository.
---
## Reason
Direct Eloquent calls bypass the repository's query logic, caching, and scoping. If the repository exists, it is the exclusive gateway for data access.
---
## Bad Example
```php
class OrderService
{
    public function findOrder(int $id): Order
    {
        return Order::with('items')->find($id); // ❌ Bypasses repository
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private OrderRepositoryInterface $orders,
    ) {}

    public function findOrder(int $id): Order
    {
        return $this->orders->findWithItems($id);
    }
}
```
---
## Exceptions
Services may use Eloquent directly for entities that intentionally do not have a repository (simple lookups, non-core entities).
---
## Consequences Of Violation
Repository provides zero value, developers question why repository exists, inconsistent data access patterns.
</rule>

## Rule 4: Register Repository Interface Bindings in a Service Provider
---
## Category
Framework Usage
---
## Rule
Always register repository interface-to-implementation bindings in a dedicated service provider, not inline in controllers or services.
---
## Reason
Centralized binding in a service provider makes the dependency graph visible, testable, and replaceable. Scattered bindings are invisible during debugging and impossible to override for testing.
---
## Bad Example
```php
// Binding inline — not discoverable
class UserService
{
    public function __construct()
    {
        $this->users = app()->make(UserRepositoryInterface::class); // ❌ Hidden resolution
    }
}
```
---
## Good Example
```php
// AppServiceProvider or RepositoryServiceProvider
public function register(): void
{
    $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
    $this->app->bind(OrderRepositoryInterface::class, EloquentOrderRepository::class);
}
```
---
## Exceptions
Single-implementation repositories for non-core entities may use concrete type-hints without an interface, eliminating the need for binding.
---
## Consequences Of Violation
Undiscoverable dependencies, cannot swap implementations for testing, scattered resolution logic.
</rule>

## Rule 5: Repositories Must Not Contain Business Logic
---
## Category
Architecture
---
## Rule
Never implement business rules, authorization checks, event dispatching, or cross-entity orchestration inside a repository.
---
## Reason
Repositories are data access mediators. Business logic in repositories violates single responsibility, makes testing require database setup, and couples business rules to persistence concerns.
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
        event(new UserCreating($data)); // ❌ Event in repository
        return User::create($data);
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
// Business rules belong in the service layer
```
---
## Exceptions
Multi-tenant scoping queries (always filtering by tenant_id) are acceptable in repositories as infrastructure, not business logic.
---
## Consequences Of Violation
Untestable business logic, database-dependent unit tests, repository becomes a dumping ground for mixed concerns.
</rule>

## Rule 6: Add Repository Abstractions Only Where They Add Value
---
## Category
Architecture
---
## Rule
Do not create repository interfaces for every entity; only introduce repositories where query complexity, caching, multi-tenancy, or test seams justify the ceremony.
---
## Reason
Interface + implementation + binding per entity multiplies file count without benefit for simple CRUD. The ceremony tax is only worth paying when the repository provides centralized value.
---
## Bad Example
```php
// Every entity gets interface + implementation + binding, including lookup tables
interface CountryRepositoryInterface { /* ... */ }
class EloquentCountryRepository implements CountryRepositoryInterface { /* ... */ }
// For: Country::all() — zero added value
```
---
## Good Example
```php
// Simple entities use direct Eloquent
$countries = Country::all();

// Complex entities get repositories
interface OrderRepositoryInterface { /* complex queries, caching, scoping */ }
class EloquentOrderRepository implements OrderRepositoryInterface { /* ... */ }
```
---
## Exceptions
Teams that mandate repositories for all entities for consistency may accept the ceremony cost, but must acknowledge the tradeoff.
---
## Consequences Of Violation
Ceremony without benefit, developer resentment toward the architecture, slower iteration for no architectural gain.
</rule>

## Rule 7: Use Criteria Objects Instead of Too-Fine Repository Methods
---
## Category
Maintainability
---
## Rule
Avoid creating separate repository methods for each query variation (`findByName`, `findByEmail`, `findByStatus`); use a single criteria/query object parameter instead.
---
## Reason
Too-fine methods cause method explosion — 7 filter combinations × 3 sort orders = 21 methods. A criteria object encapsulates all query parameters and keeps the repository interface stable.
---
## Bad Example
```php
interface OrderRepositoryInterface
{
    public function findById(int $id): ?Order;
    public function findByStatus(string $status): Collection;
    public function findByDateRange(Carbon $from, Carbon $to): Collection;
    public function findByStatusAndDate(string $status, Carbon $from, Carbon $to): Collection;
    public function findByCustomer(int $customerId): Collection;
    public function findByCustomerAndStatus(int $customerId, string $status): Collection;
    // 12 more methods...
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
Simple unique lookups (findByEmail, findBySlug) are acceptable as dedicated methods when they are the primary access pattern.
---
## Consequences Of Violation
Repository interface with 20+ methods, callers unclear which method to use, method explosion with every new query combination.
</rule>
