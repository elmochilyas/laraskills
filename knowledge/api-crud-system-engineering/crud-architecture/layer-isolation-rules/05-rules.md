# Layer Isolation Rules — Rules

## Rule 1: Controllers Must Never Call Eloquent or Repositories Directly
---
## Category
Layer Isolation
---
## Rule
Never call Eloquent models (`Model::find()`, `Model::where()`), the DB facade, or repositories directly from a controller; always delegate to a service or action.
---
## Reason
Direct data access from controllers bypasses business rules, authorization, caching, and query scoping. It couples HTTP concerns to persistence, making the logic untestable outside the HTTP stack.
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
        $user = $this->findUserAction->execute($id);
        return response()->json($user);
    }
}
```
---
## Exceptions
No common exceptions. Controllers must never access data directly.
---
## Consequences Of Violation
Architecture collapse, bypassed authorization and scoping, untestable HTTP-coupled logic.
</rule>

## Rule 2: Services Must Not Call Raw SQL or External APIs
---
## Category
Layer Isolation
---
## Rule
Never execute raw SQL queries (`DB::raw()`, `DB::statement()`) or call external APIs directly in a service; always abstract through a repository or dedicated client class.
---
## Reason
Raw SQL in services mixes persistence details with business logic. External API calls in services makes testing require network access and couples the service to external systems.
---
## Bad Example
```php
class OrderService
{
    public function getRevenue(): float
    {
        return DB::select("SELECT SUM(total) FROM orders WHERE status = 'paid'")[0]->sum; // ❌ Raw SQL
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

    public function getRevenue(): float
    {
        return $this->orders->getTotalRevenue();
    }
}
```
---
## Exceptions
Reporting or migration services that run complex analytical queries may use raw SQL when query builders are insufficient, but must wrap it in a repository method.
---
## Consequences Of Violation
Business logic coupled to raw SQL, untestable without real database, no abstraction to swap storage.
</rule>

## Rule 3: Repositories Must Never Call Services or Dispatch Events
---
## Category
Layer Isolation
---
## Rule
Never import services, dispatch events, or apply business rules inside a repository; repositories only access data through Eloquent or the DB facade.
---
## Reason
Repositories calling services creates a circular dependency (service → repository → service) and violates the dependency direction rule. Dependencies must flow downward.
---
## Bad Example
```php
class EloquentUserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
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
// Events dispatched by the service layer after repository returns
```
---
## Exceptions
No common exceptions. Repositories are data access only.
---
## Consequences Of Violation
Circular dependencies, events fired even when repository is called from maintenance scripts, testing requires event faking.
</rule>

## Rule 4: No Circular Service Dependencies
---
## Category
Architecture
---
## Rule
Never let Service A depend on Service B if Service B depends on Service A; extract shared logic to a lower layer (repository, action, or third service).
---
## Reason
Circular dependencies create an unresolvable dependency graph. The container cannot instantiate both services, and even with workarounds, the coupling makes refactoring impossible.
---
## Bad Example
```php
class UserService
{
    public function __construct(
        private NotificationService $notifications, // UserService → NotificationService
    ) {}
}

class NotificationService
{
    public function __construct(
        private UserService $users, // ❌ NotificationService → UserService (circular)
    ) {}
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(
        private NotificationService $notifications,
    ) {}
}

class NotificationService
{
    public function __construct(
        private UserRepository $users, // ✅ Depends on repository, not service
    ) {}
}
```
---
## Exceptions
No common exceptions. Circular service dependencies are always a design error.
---
## Consequences Of Violation
Container resolution failure at runtime, impossible to refactor either service, fragile bidirectional coupling.
</rule>

## Rule 5: Enforce Layer Rules with Static Analysis
---
## Category
Maintainability
---
## Rule
Always configure PHPStan or Larastan custom rules to detect and block layer violations in CI; do not rely solely on code review.
---
## Reason
Human review misses violations, especially under deadline pressure. Automated enforcement catches every violation every time, keeping the architecture clean without relying on reviewer vigilance.
---
## Bad Example
```php
// No static analysis — violations discovered in production
class UserController
{
    public function index(): JsonResponse
    {
        return response()->json(User::all()); // ❌ Passes code review, breaks in production
    }
}
```
---
## Good Example
```neon
# phpstan.neon
parameters:
    layerViolations:
        - from: App\Http\Controllers\*
          to: App\Models\*
          message: "Controllers must not directly use Eloquent models"
```
---
## Exceptions
Prototypes and MVPs may skip static analysis enforcement during early development, but must introduce it before production deployment.
---
## Consequences Of Violation
Architecture collapse over time, inconsistent enforcement, new team members cannot determine the real architecture.
</rule>

## Rule 6: A Service Method Should Call the Repository Once Per Logical Operation
---
## Category
Performance
---
## Rule
Never make multiple repository calls to satisfy a single logical query; add the necessary method to the repository instead.
---
## Reason
Multiple repository calls mean multiple database queries for what should be one operation. It indicates the repository API is not expressive enough for the service's needs.
---
## Bad Example
```php
class OrderService
{
    public function getPendingOrdersByCustomer(int $customerId): Collection
    {
        $customer = $this->customers->find($customerId); // Query 1
        return $this->orders->findByCustomer($customer->id); // Query 2
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function getPendingOrdersByCustomer(int $customerId): Collection
    {
        return $this->orders->findPendingByCustomer($customerId); // ✅ Single repository call
    }
}
```
---
## Exceptions
Aggregation or reporting queries that genuinely combine data from multiple entities may require multiple repository calls coordinated by the service.
---
## Consequences Of Violation
N+1 query problems at the service level, unnecessary database round-trips, repository API that doesn't serve service needs.
</rule>
