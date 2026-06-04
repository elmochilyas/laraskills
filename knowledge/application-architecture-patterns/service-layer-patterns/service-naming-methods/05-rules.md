## Use Business Language For Method Names
---
## Maintainability
---
## Rule
Use business language for service method names. If the business says "register a user," name the method `register()`. If they say "cancel order," name it `cancelOrder()`. Avoid CRUD technical names.
---
## Reason
Business-language method names communicate intent to developers, product managers, and future maintainers. Technical names like `insert()` or `updateStatus()` hide the business purpose.
---
## Bad Example
```php
class UserService
{
    public function insert(array $data): User { /* ... */ }
    public function updateStatus(int $id, string $status): void { /* ... */ }
    public function delete(int $id): void { /* ... */ }
    public function getAll(): Collection { /* ... */ }
}
```
---
## Good Example
```php
class UserService
{
    public function register(array $data): User { /* ... */ }
    public function suspend(User $user): void { /* ... */ }
    public function cancelSubscription(User $user): void { /* ... */ }
    public function findActiveUsers(): Collection { /* ... */ }
}
```
---
## Exceptions
Admin/CRUD services where operations genuinely are create/update/delete without business meaning.
---
## Consequences Of Violation
Hidden business intent, requires reading method bodies to understand purpose, onboarding friction.

## Maintain One Level Of Abstraction
---
## Maintainability
---
## Rule
Service methods must maintain one consistent level of abstraction. Do not mix high-level orchestration calls with low-level data access operations in the same method.
---
## Reason
Mixed abstraction levels make the method hard to read and signal that the service is doing work it should delegate. A service method should read like a high-level workflow.
---
## Bad Example
```php
class UserService
{
    public function register(array $data): User
    {
        $user = new User();
        $user->name = $data['name'];                 // Low-level detail
        $user->email = $data['email'];               // Low-level detail
        $user->password = Hash::make($data['password']); // Low-level detail
        $user->save();                               // Low-level detail
        $this->mailer->sendWelcome($user);           // High-level orchestration
        $this->analytics->track('user_registered');  // High-level orchestration
        return $user;
    }
}
```
---
## Good Example
```php
class UserService
{
    public function register(array $data): User
    {
        $user = $this->createUserAction->execute($data);  // One level
        $this->sendWelcomeAction->execute($user);         // One level
        return $user;
    }
}
```
---
## Exceptions
Trivial services where the "low-level" operation is the entire business logic and delegation adds unnecessary overhead.
---
## Consequences Of Violation
Hard-to-read methods, services doing too much, difficult to change implementation details.

## Avoid Generic Suffixes
---
## Maintainability
---
## Rule
Avoid generic suffixes like `Manager`, `Helper`, `Utils`, or `Handler` for service classes. Use `{Domain}Service` naming exclusively.
---
## Reason
Generic suffixes don't communicate architectural role. `UserManager` could mean anything. `UserService` communicates that the class is a service-layer component operating on the User domain.
---
## Bad Example
```php
app/Services/UserManager.php
app/Services/OrderHelper.php
app/Services/PaymentUtils.php
app/Services/AuthHandler.php
```
---
## Good Example
```php
app/Services/UserService.php
app/Services/OrderService.php
app/Services/PaymentService.php
app/Services/AuthService.php
```
---
## Exceptions
No common exceptions. `Service` suffix should be the standard for service layer classes.
---
## Consequences Of Violation
Unclear architectural role, inconsistent naming across codebase, confusion about where to find business logic.

## Keep Methods Under 20-30 Per Service
---
## Maintainability
---
## Rule
Keep the number of methods on a single service under 20-30. If a service exceeds this, split it by domain or extract actions.
---
## Reason
A service with 30+ methods is doing too much. Each addition makes the class harder to understand, test, and maintain. The method count is a leading indicator of violating the Single Responsibility Principle.
---
## Bad Example
```php
class UserService
{
    public function register(): void {}
    public function updateProfile(): void {}
    public function changePassword(): void {}
    public function uploadAvatar(): void {}
    public function deleteAccount(): void {}
    public function suspendUser(): void {}
    public function activateUser(): void {}
    public function processPayment(): void {}
    public function generateInvoice(): void {}
    public function sendNewsletter(): void {}
    // 20+ more methods covering billing, notifications, reporting
    // 35 total methods — clearly doing too much
}
```
---
## Good Example
```php
class UserService { /* 8 user-related methods only */ }
class BillingService { /* 5 billing-related methods */ }
class NotificationService { /* 4 notification methods */ }
```
---
## Exceptions
No common exceptions. 20-30 methods is the ceiling; aim lower.
---
## Consequences Of Violation
God service class, untestable module, difficulty finding methods, merge conflicts, developer resistance to changes.

## Use Domain Prefix Naming Convention
---
## Code Organization
---
## Rule
Name service classes using the `{Domain}Service` convention. Use entity-based names for primary services and domain-based names for cross-entity services.
---
## Reason
Consistent naming makes services discoverable and communicates scope. Entity-based (`UserService`) says "I operate on User." Domain-based (`BillingService`) says "I span multiple entities in Billing."
---
## Bad Example
```php
app/Services/ServiceUser.php      // Non-standard naming
app/Services/RegisterService.php  // Action-based, not entity-based
app/Services/ManagerOrder.php     // Mixed conventions
```
---
## Good Example
```php
// Entity-based services
app/Services/UserService.php
app/Services/OrderService.php
app/Services/ProductService.php

// Domain-based services (span multiple entities)
app/Services/BillingService.php
app/Services/AuthService.php
app/Services/NotificationService.php
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent naming, difficulty finding services, confusion about class responsibilities.

## Methods Must Not Return HTTP Responses
---
## Architecture
---
## Rule
Service methods must never return HTTP response objects (`JsonResponse`, `Response`). Return data only — models, DTOs, collections, or primitives.
---
## Reason
HTTP responses couple business logic to the delivery mechanism, preventing reuse from CLI, queue, or API resource contexts.
---
## Bad Example
```php
class UserService
{
    public function register(array $data): JsonResponse
    {
        $user = User::create($data);
        return response()->json([
            'user' => $user,
            'message' => 'Registration successful',
        ], 201);
    }
}
```
---
## Good Example
```php
class UserService
{
    public function register(array $data): User
    {
        return User::create($data);
    }
}

// Controller formats the response
return response()->json($user, 201);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Service coupled to HTTP, unreusable from CLI/queue, testing requires HTTP simulation, violates separation of concerns.

## Use Consistent Method Prefix Conventions
---
## Code Organization
---
## Rule
Use consistent method prefixes for different types of operations: `create`/`update`/`delete` for CRUD, `process`/`handle`/`execute` for workflows, `find`/`search`/`get` for queries.
---
## Reason
Prefix conventions make method purpose clear at a glance. Developers can predict what a method does based on its prefix without reading the body.
---
## Bad Example
```php
class OrderService
{
    public function newOrder(array $data): Order {}        // Non-standard prefix
    public function changeOrderStatus(Order $o, string $s): void {}  // Hides intent
    public function fetchAllPending(): Collection {}       // Inconsistent with other query methods
}
```
---
## Good Example
```php
class OrderService
{
    public function createOrder(array $data): Order {}
    public function updateOrderStatus(Order $order, string $status): void {}
    public function cancelOrder(Order $order): void {}
    public function processRefund(Order $order): void {}
    public function findPendingOrders(): Collection {}
    public function getOrderTotal(Order $order): Money {}
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unpredictable method naming, need to read method bodies to understand purpose, inconsistent team conventions.
