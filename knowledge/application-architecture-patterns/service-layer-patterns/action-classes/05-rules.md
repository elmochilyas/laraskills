## Actions Must Have Exactly One Public Method
---
## Architecture
---
## Rule
Each action class must have exactly one public method. Name it `execute()` or `handle()` consistently across the codebase.
---
## Reason
The purpose of action classes is to encapsulate one business operation per class. Multiple public methods violate this contract and blur the line between actions and services.
---
## Bad Example
```php
class UserAction
{
    public function register(array $data): User { /* ... */ }
    public function verifyEmail(User $user): void { /* ... */ }
    public function changePassword(User $user, string $password): void { /* ... */ }
}
```
---
## Good Example
```php
class RegisterUserAction
{
    public function execute(array $data): User { /* one operation */ }
}

class VerifyEmailAction
{
    public function execute(User $user): void { /* one operation */ }
}
```
---
## Exceptions
No common exceptions. If a class needs multiple public methods, it should be a service, not an action.
---
## Consequences Of Violation
Action degenerates into a mini-service, losing the single-operation benefit, unclear purpose, variable method signatures.

## Actions Must Not Call Other Actions
---
## Architecture
---
## Rule
Actions must not call other actions. Actions are leaf nodes in the call graph. Composition of multiple actions belongs at the service level.
---
## Reason
Action-to-action calls create opaque call graphs, couple operations together, and bypass the service orchestration layer that should manage workflow coordination.
---
## Bad Example
```php
class RegisterUserAction
{
    public function execute(array $data): User
    {
        $user = $this->createUserAction->execute($data);
        $this->sendWelcomeAction->execute($user); // Action calling action
        $this->assignRoleAction->execute($user, 'member'); // Action calling action
        return $user;
    }
}
```
---
## Good Example
```php
class RegistrationService
{
    public function register(array $data): User
    {
        $user = $this->createUserAction->execute($data);
        $this->sendWelcomeAction->execute($user);
        $this->assignRoleAction->execute($user, 'member');
        return $user;
    }
}

// Each action remains a leaf node
class SendWelcomeAction
{
    public function execute(User $user): void { /* leaf operation */ }
}
```
---
## Exceptions
No common exceptions. Action-to-action calls are always an architecture violation.
---
## Consequences Of Violation
Opaque call graphs, coupled operations, bypassed service orchestration, difficult testing, cascading changes.

## Actions Must Be Stateless
---
## Reliability
---
## Rule
Actions must be stateless. Do not set mutable properties between construction and execution. Pass all data as parameters to `execute()`.
---
## Reason
Stateful actions cause cross-request contamination under Octane's persistent worker model. State on singletons leaks between requests.
---
## Bad Example
```php
class RegisterUserAction
{
    private array $data;
    private ?User $user = null;

    public function setData(array $data): void
    {
        $this->data = $data; // Mutable state set before execute
    }

    public function execute(): User
    {
        $this->user = User::create($this->data); // Uses stored state
        return $this->user;
    }
}

// Usage creates temporal coupling
$action->setData($data);
$action->execute();
```
---
## Good Example
```php
class RegisterUserAction
{
    public function execute(array $data): User
    {
        return User::create($data); // All data passed as parameter
    }
}

// Usage is stateless
$user = $action->execute($data);
```
---
## Exceptions
Actions that hold read-only configuration injected via constructor (not set during request lifecycle).
---
## Consequences Of Violation
Cross-request data leaks under Octane, temporal coupling between setter and execute calls, intermittent unreproducible bugs.

## Group Actions By Domain Subdirectory
---
## Code Organization
---
## Rule
Group action classes by domain subdirectory. Do not place all actions in a flat `app/Actions/` directory.
---
## Reason
A flat directory with 100 action files is unmanageable. Domain subdirectories make it easy to find actions for a specific business domain.
---
## Bad Example
```
app/Actions/
├── CreateUserAction.php
├── UpdateUserAction.php
├── ProcessPaymentAction.php
├── GenerateInvoiceAction.php
├── SendWelcomeMailAction.php
├── CancelSubscriptionAction.php
├── ApproveRefundAction.php
├── DeleteUserAction.php
├── ChargeCustomerAction.php
└── ExportReportAction.php
// 100 flat files — impossible to navigate
```
---
## Good Example
```
app/Actions/
├── User/
│   ├── CreateUserAction.php
│   ├── UpdateUserAction.php
│   └── DeleteUserAction.php
├── Billing/
│   ├── ProcessPaymentAction.php
│   ├── GenerateInvoiceAction.php
│   └── CancelSubscriptionAction.php
└── Notification/
    └── SendWelcomeMailAction.php
```
---
## Exceptions
Small projects with fewer than 10 total actions, where the flat structure remains navigable.
---
## Consequences Of Violation
Unmanageable action directories, naming conflicts, difficulty finding relevant actions, namespace collisions.

## Avoid Anemic Actions
---
## Architecture
---
## Rule
Avoid anemic actions that simply call a single model method without adding operation-specific logic. Only extract to an action when it encapsulates meaningful orchestration or complexity.
---
## Reason
An anemic action adds boilerplate without value — it's a method wrapped in a class. This increases file count without improving testability or maintainability.
---
## Bad Example
```php
class CreateUserAction
{
    public function execute(array $data): User
    {
        return User::create($data); // No added value over User::create()
    }
}

class FindUserByIdAction
{
    public function execute(int $id): ?User
    {
        return User::find($id); // No added value over User::find()
    }
}
```
---
## Good Example
```php
class RegisterUserAction
{
    public function execute(array $data): User
    {
        return User::create([
            ...$data,
            'status' => 'pending',
            'email_verification_token' => Str::random(32),
        ]);
    }
}
// Contains operation-specific logic: default status, token generation
```
---
## Exceptions
Team conventions requiring actions for all operations, including simple CRUD (consistency over optimization).
---
## Consequences Of Violation
Class explosion without benefit, unnecessary indirection, wasted namespace overhead, code review fatigue.

## Use Verb-Noun Naming For Actions
---
## Maintainability
---
## Rule
Use Verb-Noun naming for action classes. The verb describes the operation; the noun describes the target. Optionally append the `Action` suffix.
---
## Reason
Verb-Noun naming is self-documenting — a directory of actions reads like a list of business operations. Consistent naming makes actions discoverable.
---
## Bad Example
```php
class UserProcessAction { /* What does this do? */ }
class HandlerAction { /* What does it handle? */ }
class DoStuffAction { /* Stuff is not an operation */ }
```
---
## Good Example
```php
class CreateUserAction {}
class ProcessPaymentAction {}
class GenerateInvoiceAction {}
class CancelSubscriptionAction {}
class ApproveRefundAction {}
```
---
## Exceptions
Teams that omit the `Action` suffix for brevity, provided the convention is consistent across the entire codebase.
---
## Consequences Of Violation
Confusing action names, difficulty finding relevant actions, naming collisions with models, inconsistent team conventions.

## Limit Action Constructor Dependencies
---
## Maintainability
---
## Rule
Keep action constructor dependencies to a reasonable count. An action with many dependencies is doing too much and should be split.
---
## Reason
Each dependency is a separate responsibility. An action with many dependencies violates the single-operation contract — it's orchestrating rather than executing.
---
## Bad Example
```php
class CreateSubscriptionAction
{
    public function __construct(
        private UserRepository $users,
        private PlanRepository $plans,
        private PaymentGateway $gateway,
        private InvoiceService $invoices,
        private Mailer $mailer,
        private AnalyticsService $analytics,
        private DiscountService $discounts,
        private AuditService $audit,
        private CacheService $cache,
    ) {}
}
```
---
## Good Example
```php
class CreateSubscriptionAction
{
    public function __construct(
        private PaymentGateway $gateway,
        private UserRepository $users,
        private PlanRepository $plans,
    ) {}
}
// Additional concerns handled by service orchestrating this action
```
---
## Exceptions
Infrastructure actions that legitimately require multiple adapters.
---
## Consequences Of Violation
Action doing too much, difficult testing (too many mocks), blurs line between action and service.

## Avoid Giant Action Classes
---
## Maintainability
---
## Rule
Keep action classes focused. An action with more than 100 lines or complex branching logic should be split into multiple actions or moved to a service.
---
## Reason
Giant actions violate the single-operation principle. An action containing complex logic is a god method in a class, harder to test and understand.
---
## Bad Example
```php
class ProcessCheckoutAction
{
    public function execute(array $data): Order
    {
        // 80 lines of validation, discount calculation, inventory check,
        // payment processing, invoice generation, notification dispatching,
        // affiliate tracking, analytics logging
    }
}
```
---
## Good Example
```php
// Service orchestrates multiple focused actions
class CheckoutService
{
    public function checkout(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = $this->createOrderAction->execute($data);
            $this->applyDiscountsAction->execute($order, $data);
            $this->processPaymentAction->execute($order);
            $this->reserveInventoryAction->execute($order);
            return $order;
        });
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Untestable action, hidden side effects, difficult debugging, action degenerates into service.
