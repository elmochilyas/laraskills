# Service vs Action Decision — Rules

## Rule 1: Default to Actions for New Operations
---
## Category
Architecture
---
## Rule
Always create an action class for every new discrete business operation; only promote to a service when 3+ related operations share the same dependencies.
---
## Reason
Starting with actions forces each operation to declare its own dependencies, keeping classes focused and testable. Premature service grouping bundles unrelated methods behind a single interface.
---
## Bad Example
```php
// Day 1: Service with 1 method — premature
class UserService
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function register(CreateUserDto $dto): User { /* ... */ }
    // The other 5 planned methods never get implemented
}
```
---
## Good Example
```php
// Day 1: Action — focused, testable, minimal
class RegisterUserAction
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
    ) {}

    public function execute(CreateUserDto $dto): User { /* ... */ }
}

// Month 6: Service promoted when 3+ actions share dependencies
class UserService
{
    public function __construct(
        private CreateUserAction $createUser,
        private UpdateUserAction $updateUser,
        private DeleteUserAction $deleteUser,
    ) {}
}
```
---
## Exceptions
Entities with clearly known 3+ related operations from the start may begin as a service, but this should be rare.
---
## Consequences Of Violation
Services with 1-2 methods that never grow, ceremony without value, developer uncertainty about where to place new operations.
</rule>

## Rule 2: Use the 3-Operation Threshold for Service Promotion
---
## Category
Architecture
---
## Rule
Never promote an action to a service until there are at least 3 operations that share the same dependencies.
---
## Reason
A service with 1-2 methods provides no benefit over individual actions — it adds an extra injection point in the controller without centralizing any shared logic. The overhead is justified only when there is shared logic to centralize.
---
## Bad Example
```php
class ProductService // ❌ 2 methods — no shared dependency benefit
{
    public function find(int $id): ?Product { return Product::find($id); }
    public function delete(int $id): void { Product::destroy($id); }
}
// Controller still injects 2 methods. No shared logic.
```
---
## Good Example
```php
class ProductService // ✅ 4 methods — shared query scoping and caching
{
    public function __construct(
        private ProductRepository $products,
        private CacheRepository $cache,
    ) {}

    public function find(int $id): ?Product { /* caching */ }
    public function findBySlug(string $slug): ?Product { /* caching */ }
    public function search(ProductSearchCriteria $criteria): LengthAwarePaginator { /* scoping */ }
    public function delete(int $id): void { /* cache invalidation */ }
}
```
---
## Exceptions
When injecting 5+ individual actions into a single controller, consolidating to a service may be justified for constructor cleanliness even with <3 operations.
---
## Consequences Of Violation
Services that don't earn their existence, developers question why services exist, mixed patterns without clear rationale.
</rule>

## Rule 3: Document the Team's Decision Framework
---
## Category
Maintainability
---
## Rule
Always write down and enforce the team's action vs service decision rules; never rely on unwritten conventions that differ between developers.
---
## Reason
Without written rules, some developers create actions while others create services for identical scenarios. The codebase becomes inconsistent, and new team members cannot determine the expected pattern.
---
## Bad Example
```php
// Developer A creates actions for everything
class CreateUserAction { /* ... */ }
class UpdateUserAction { /* ... */ }
class DeleteUserAction { /* ... */ }

// Developer B creates services for everything
class UserService { /* ... */ } // Same operations, different pattern

// No one can find anything
```
---
## Good Example
```php
// Written convention in ARCHITECTURE.md:
// 1. New operations → Actions
// 2. When 3+ actions share deps → Service
// 3. Services delegate to actions internally
// Code review enforces this

class RegisterUserAction { /* ... */ }
class UpdateProfileAction { /* ... */ }
class DeleteUserAction { /* ... */ }
// When 4th action emerges with same deps → extract UserService
```
---
## Exceptions
No common exceptions. The decision framework must be documented, even if it's a simple rule.
---
## Consequences Of Violation
Inconsistent codebase, developers confused about which pattern to use, wasted time in debates during code review.
</rule>

## Rule 4: Services Can Delegate to Actions Internally
---
## Category
Architecture
---
## Rule
When using services, always delegate individual operations to action classes internally; never inline the operation logic directly in the service method.
---
## Reason
Actions remain independently testable and callable. Inlining logic in service methods makes it impossible to call the operation without the service and loses the single-responsibility boundary.
---
## Bad Example
```php
class UserService
{
    public function register(RegisterUserDto $dto): User
    {
        // ❌ Logic inlined — cannot test or call without service
        $user = User::create($dto->toArray());
        event(new UserRegistered($user));
        return $user;
    }
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(
        private CreateUserAction $createUser,
    ) {}

    public function register(RegisterUserDto $dto): User
    {
        return $this->createUser->execute($dto); // ✅ Delegates to action
    }
}
// CreateUserAction remains independently testable and callable
```
---
## Exceptions
Very simple operations (toggle boolean, increment counter) that don't justify their own action class may be inlined in the service.
---
## Consequences Of Violation
Operations locked inside services, cannot call individual operations without the service, loses action testability.
</rule>

## Rule 5: Enforce the Decision in Code Review
---
## Category
Maintainability
---
## Rule
Always check during code review whether a new class follows the team's action vs service decision rules; flag violations before merge.
---
## Reason
Without enforcement, the architecture drifts. Developers under deadline pressure create whichever pattern is faster — usually dumping logic into an existing service — and the written rules become aspirational rather than enforced.
---
## Bad Example
```php
// Code review misses: 2-method service that should be actions
class NotificationService
{
    public function sendWelcome(User $user): void { /* ... */ }
    public function sendPasswordReset(User $user, string $token): void { /* ... */ }
}
// No shared dependencies, unrelated methods — should be 2 separate actions
```
---
## Good Example
```php
// Code review checklist:
// - Is this a new operation? → Should be an action
// - Does it share deps with 3+ other ops? → Consider service
// - Is this a 1-2 method service? → Flag for conversion to actions

// Result:
class SendWelcomeNotificationAction { /* ... */ }
class SendPasswordResetNotificationAction { /* ... */ }
```
---
## Exceptions
No common exceptions. Code review enforcement is what keeps architecture consistent.
---
## Consequences Of Violation
Unchecked architecture drift, inconsistent codebase, new team members cannot determine the real pattern, eventual refactoring cost.
</rule>
