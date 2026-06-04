# Service vs Action Decision — Engineering Rules

---

## Rule 1: Use Services and Actions Complementarily

Services and actions are complementary patterns, not competing alternatives. Production codebases must use both, choosing each based on the operation's characteristics.

---

## Category

Architecture

---

## Rule

The service layer must use both service classes (multi-method, grouped by entity/capability) and action classes (single-method, single responsibility). Exclusive use of either pattern is prohibited. The decision of which to use must be based on the operation's characteristics, not team preference.

---

## Reason

Services-only leads to god services with 40+ methods and poor test isolation. Actions-only leads to file proliferation with no organizational structure. Production-mature codebases use both: services for orchestration and grouping, actions for complex or reusable individual operations.

---

## Bad Example

```php
// Services-only — UserService with 45 methods
class UserService
{
    public function register(RegisterUserData $data): User {}
    public function verifyEmail(User $user): void {}
    public function updatePassword(User $user, string $password): void {}
    public function resetPassword(ResetPasswordData $data): void {}
    // ... 41 more methods
}
```

---

## Good Example

```php
// Services for grouping, actions for complex operations
class UserService
{
    public function register(RegisterUserData $data): User
    {
        return $this->registerUserAction->handle($data);
    }

    public function suspend(User $user): void
    {
        $user->update(['suspended_at' => now()]);
    }
}

class RegisterUserAction
{
    public function handle(RegisterUserData $data): User
    {
        // Complex registration logic with isolated testing
    }
}
```

---

## Exceptions

Very small applications (under 10 service methods) may use services exclusively until the complexity justifies extraction.

---

## Consequences Of Violation

Maintenance risks: services become god classes; actions become unmanageable in flat directories. Testing risks: services are hard to test with 40+ methods. Scalability risks: neither extreme scales to large codebases.

---

## Rule 2: Default to Services, Extract to Actions

When in doubt, use a service. Extract an operation to an action only when it meets specific extraction criteria.

---

## Category

Design

---

## Rule

The default pattern for organizing business operations must be service classes. Extraction to an action class is warranted only when at least one criterion is met: the operation is complex (30+ lines), reused across multiple entry points, needs isolated test class, or has clear ownership boundaries for merge isolation.

---

## Reason

Defaulting to actions creates excessive files and no organizational structure. Services provide a natural grouping by entity or capability. Premature extraction adds indirection without benefit. Extract only when the operation demonstrates a concrete need.

---

## Bad Example

```php
// Every operation as an action — excessive files
class CreateUserAction {}
class UpdateUserAction {}
class DeleteUserAction {}
class FindUserAction {}
class SuspendUserAction {}
class ActivateUserAction {}
class VerifyEmailAction {}
class ResetPasswordAction {}
// ... 30+ action files with no organization
```

---

## Good Example

```php
// Default: grouped in service
class UserService
{
    public function suspend(User $user): void { /* simple */ }
    public function activate(User $user): void { /* simple */ }
    public function find(int $id): ?User { /* simple */ }

    // Extracted to action: complex, reused, needs isolated testing
    public function register(RegisterUserData $data): User
    {
        return $this->registerUserAction->handle($data);
    }
}
```

---

## Exceptions

If the team explicitly adopts an action-first convention (e.g., all operations are actions, organized in directory-per-entity), that is acceptable if consistently applied.

---

## Consequences Of Violation

Efficiency risks: premature extraction adds files without value. Navigational risks: excessive action files in flat directories are hard to browse. Testing risks: too many test files for simple operations.

---

## Rule 3: Services May Call Actions; Actions Must Not Call Services

The dependency direction between services and actions must be unidirectional: services compose actions. Actions must never inject or call services.

---

## Category

Architecture

---

## Rule

Service classes may depend on and call action classes as part of orchestration workflows. Action classes must never depend on or call service classes. This dependency direction must be enforced in code review and static analysis.

---

## Reason

Actions calling services inverts the intended layering and risks circular dependencies (Service A calls Action B, Action B calls Service A). Services are orchestrators; actions are executed units. Actions should not know about orchestrators.

---

## Bad Example

```php
class ReserveInventoryAction
{
    public function __construct(
        private NotificationService $notifications, // Action calling service
    ) {}

    public function handle(array $items): void
    {
        // ... reserve ...
        $this->notifications->sendLowStockAlert($items);
    }
}
```

---

## Good Example

```php
class OrderService // Service orchestrates
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $this->reserveInventory->handle($data->items);
            $payment = $this->processPayment->handle($data->payment);
            return $this->createOrder->handle($data, $payment);
        });
    }
}

class ReserveInventoryAction // Action executes, no services
{
    public function handle(array $items): void
    {
        // Pure execution logic
    }
}
```

---

## Exceptions

No common exceptions. Actions must never call services.

---

## Consequences Of Violation

Architecture risks: circular dependency between services and actions. Maintenance risks: dependency graph becomes tangled and hard to trace. Testing risks: testing actions requires mocking services.

---

## Rule 4: Use Actions for Single Complex or Reused Operations

An operation that is complex (30+ lines), called from multiple entry points (HTTP, CLI, queue), or requires an isolated test class must be extracted to an action class.

---

## Category

Code Organization

---

## Rule

Extract an operation to a dedicated action class when: the method body exceeds 30 lines; the operation is invoked from multiple entry points (controller, command, queue job); the operation requires a dedicated test class with extensive setup; or the operation has clear ownership boundaries (multiple developers work on the same service).

---

## Reason

Complex operations benefit from isolation — they have their own file, test class, and dependency set. Reused operations avoid duplication — extracting to an action means one implementation called from N places. Isolated testing means changes to the action don't require running unrelated service tests.

---

## Bad Example

```php
class UserService
{
    public function register(RegisterUserData $data): User
    {
        // 50 lines of complex registration logic
        // Called from controller AND admin panel AND API
        // Hard to test — must test full service
    }
}
```

---

## Good Example

```php
class RegisterUserAction
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private EmailVerificationService $verification,
    ) {}

    public function handle(RegisterUserData $data): User
    {
        // 50 lines of complex registration logic
        // Single file, single test class, reusable
    }
}

class UserService
{
    public function register(RegisterUserData $data): User
    {
        return $this->registerUserAction->handle($data);
    }
}
```

---

## Exceptions

If a complex operation is only used in one place and has no reasonable expectation of reuse, it may remain in the service if it's well-encapsulated in a private method.

---

## Consequences Of Violation

Maintenance risks: duplicated logic when same operation is needed from multiple entry points. Testing risks: large test files for services with many methods. Reusability risks: operations cannot be invoked independently.

---

## Rule 5: Use Services for Related Operations with Shared Dependencies

Multiple operations that share dependencies (same repository, same gateway) and relate to the same entity or capability must be grouped in a service class.

---

## Category

Code Organization

---

## Rule

When multiple operations share dependencies (e.g., all need `UserRepository`) and relate to the same business concept, they must be grouped in a service class. Do not create separate action classes for each operation if they share 2+ constructor dependencies.

---

## Reason

Grouping related operations in a service eliminates dependency duplication across action classes. A service with 5 methods and 3 shared dependencies requires 3 constructor parameters total. The same operations as 5 separate actions would repeat those 3 dependencies 5 times, creating unnecessary duplication.

---

## Bad Example

```php
// Five action classes, each duplicating the same dependencies
class SuspendUserAction
{
    public function __construct(
        private UserRepository $users,
        private AuditLogger $logger,
        private MailService $mail,
    ) {}
}

class ActivateUserAction
{
    public function __construct(
        private UserRepository $users,
        private AuditLogger $logger,
        private MailService $mail,
    ) {}
}
// ... three more actions with identical constructors
```

---

## Good Example

```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private AuditLogger $logger,
        private MailService $mail,
    ) {}

    public function suspend(User $user): void { /* ... */ }
    public function activate(User $user): void { /* ... */ }
    public function verifyEmail(User $user): void { /* ... */ }
}
```

---

## Exceptions

When one of the shared operations is significantly more complex than others (30+ lines) and has a different testing profile, extract just that operation to an action. The remaining simple operations stay in the service.

---

## Consequences Of Violation

Maintenance risks: adding a new dependency requires updating N action classes. Testing risks: each action test duplicates the same mock setup. Efficiency risks: constructor parameter duplication across files.

---

## Rule 6: Split Services with 15+ Methods

A service class with 15 or more public methods must be decomposed. Extract related method groups into separate services or complex operations into action classes.

---

## Category

Maintainability

---

## Rule

When a service class reaches 15 public methods, it must be reviewed for decomposition. At 20 methods, decomposition is mandatory. Extract related groups of methods into sub-services or extract complex individual methods into action classes.

---

## Reason

Service size correlates with responsibility breadth. A 15+ method service likely has multiple responsibilities. Large services are hard to navigate, create merge conflicts (multiple developers editing the same file), and have sprawling test files.

---

## Bad Example

```php
class UserService // 28 methods
{
    public function register(...) {}
    public function login(...) {}
    public function logout(...) {}
    public function suspend(...) {}
    public function activate(...) {}
    public function updateEmail(...) {}
    public function updatePassword(...) {}
    public function resetPassword(...) {}
    public function verifyEmail(...) {}
    public function updateProfile(...) {}
    public function uploadAvatar(...) {}
    public function deleteAvatar(...) {}
    // ... 16 more
}
```

---

## Good Example

```php
class AuthService
{
    public function login(LoginData $data): User {}
    public function logout(User $user): void {}
    public function resetPassword(User $user): void {}
}

class UserProfileService
{
    public function update(UpdateProfileData $data): User {}
    public function uploadAvatar(User $user, UploadedFile $file): User {}
}

class UserManagementService
{
    public function suspend(User $user): void {}
    public function activate(User $user): void {}
    public function verifyEmail(User $user): void {}
}
```

---

## Exceptions

Domain services that are naturally large (e.g., `PricingService` with 20+ calculation methods) may exceed the limit if all methods belong to a single immutable domain concept.

---

## Consequences Of Violation

Maintenance risks: single point of contention for multiple developers. Testing risks: test files with 50+ test cases. Navigational risks: finding a specific method among 28 is slow.

---

## Rule 7: Use Actions Inside Services for Orchestration

Services that orchestrate multi-step workflows must compose actions, not implement all steps inline.

---

## Category

Architecture

---

## Rule

Orchestration methods in services must delegate execution steps to action classes. A service orchestration method must not implement the detailed logic of each step inline. Each step should be a call to an action class, with the service defining the workflow (order, transaction, error handling).

---

## Reason

Services orchestrate; actions execute. This separation allows each action to be tested in isolation, reused across workflows, and modified without impacting other steps. Inline orchestration creates monolithic methods that are hard to test and maintain.

---

## Bad Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): Order
    {
        // Everything inline — 80 lines of steps mixed together
        DB::transaction(function () use ($data) {
            foreach ($data->items as $item) { /* inventory logic */ }
            $payment = Payment::create([/* ... */]); // payment logic
            $order = Order::create([/* ... */]);       // order creation
            Mail::to($data->email)->send(...);          // notification
        });
        return $order;
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function placeOrder(PlaceOrderData $data): OrderResult
    {
        return DB::transaction(function () use ($data) {
            $inventory = $this->reserveInventory->handle($data->items);
            $payment = $this->processPayment->handle($data->payment);
            $order = $this->createOrder->handle($data, $payment);
            $this->sendConfirmation->handle($order);
            return new OrderResult($order, $payment, $inventory);
        });
    }
}
```

---

## Exceptions

Very simple two-step workflows where each step is 2-3 lines may remain inline.

---

## Consequences Of Violation

Maintenance risks: orchestration methods become monolithic. Testing risks: entire workflow must be tested as one unit. Reusability risks: individual steps cannot be reused.
