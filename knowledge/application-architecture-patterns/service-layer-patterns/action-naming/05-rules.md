## Use Verb-Noun Naming With Action Suffix
---
## Code Organization
---
## Rule
Name action classes using Verb-Noun naming with an optional Action suffix. The verb describes the operation; the noun describes the target. Use the Action suffix to prevent naming conflicts with models.
---
## Reason
Verb-Noun naming is self-documenting — a directory of actions reads like a list of business operations. The Action suffix distinguishes action classes from Eloquent models with the same name.
---
## Bad Example
```php
class UserProcess {}        // Verb-Noun order reversed
class Handle {}             // No noun — what does it handle?
class DoStuff {}            // Not a business operation
```
---
## Good Example
```php
class CreateUserAction {}
class ProcessPaymentAction {}
class GenerateInvoiceAction {}
class CancelSubscriptionAction {}
```
---
## Exceptions
Teams that omit the Action suffix for brevity, provided it does not cause naming conflicts with model classes.
---
## Consequences Of Violation
Naming collisions with models, unclear operation purpose, inconsistent team conventions.

## Group Actions By Domain Subdirectory
---
## Code Organization
---
## Rule
Group action classes by domain subdirectory within `app/Actions/`. Do not use a flat file structure for actions.
---
## Reason
A flat structure with 100 action files is unmanageable. Domain subdirectories make actions discoverable and group related operations together.
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
Small projects with fewer than 10 total actions.
---
## Consequences Of Violation
Unmanageable action directories, naming conflicts, difficulty finding relevant actions.

## Establish A Controlled Verb Vocabulary
---
## Maintainability
---
## Rule
Establish and document a controlled vocabulary of action verbs. Use consistently across the codebase: Create, Update, Delete, Process, Send, Generate, Cancel, Approve, Reject, Archive.
---
## Reason
Without a controlled vocabulary, different developers use `Create`/`Make`/`Generate` interchangeably for the same operation type, causing confusion and inconsistency.
---
## Bad Example
```php
// Three different verbs for the same operation type
class MakeOrderAction {}    // Developer A
class CreateOrderAction {}  // Developer B
class GenerateOrderAction {} // Developer C
```
---
## Good Example
```php
// Documented vocabulary: Create for new entities, Process for workflows
class CreateOrderAction {}
class CreateUserAction {}
class ProcessPaymentAction {}
class GenerateInvoiceAction {}
class CancelSubscriptionAction {}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent action naming, confusion about which verb to use, difficulty finding actions by verb.

## Avoid Action Names That Are Too Long
---
## Maintainability
---
## Rule
Avoid action names longer than 3-4 words. A name like `ProcessAndNotifyPaymentAction` signals that the action is doing too much.
---
## Reason
Long action names are a code smell — they indicate the action violates the single-responsibility principle by combining multiple operations.
---
## Bad Example
```php
class CreateUserAndSendWelcomeEmailAndAssignRoleAction {}
class ProcessPaymentAndGenerateInvoiceAndNotifyCustomerAction {}
class UpdateOrderStatusAndRecalculateShippingAndNotifyWarehouseAction {}
```
---
## Good Example
```php
// Service orchestrates multiple focused actions
class RegistrationService
{
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->createUserAction->execute($data);
            $this->assignRoleAction->execute($user, 'member');
            $this->sendWelcomeAction->execute($user);
            return $user;
        });
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Action violates single-responsibility principle, difficult to test, name doesn't fit code review diffs.

## Use Handle Or Execute Consistently
---
## Maintainability
---
## Rule
Use either `handle()` or `execute()` as the single public method name for all actions. Pick one and be consistent across the entire codebase.
---
## Reason
Consistent method names make actions predictable. Developers know to call `$action->execute()` or `$action->handle()` without checking the class.
---
## Bad Example
```php
class CreateUserAction { public function execute(): User {} }
class ProcessPaymentAction { public function handle(): void {} }
class GenerateInvoiceAction { public function run(): Invoice {} }
class CancelSubscriptionAction { public function __invoke(): void {} }
// Inconsistent — caller must check each class
```
---
## Good Example
```php
// Consistent execute() across all actions
class CreateUserAction { public function execute(): User {} }
class ProcessPaymentAction { public function execute(): void {} }
class GenerateInvoiceAction { public function execute(): Invoice {} }
class CancelSubscriptionAction { public function execute(): void {} }
```
---
## Exceptions
When using `__invoke()` for callable actions is a team-wide convention (less explicit but allows action as callable).
---
## Consequences Of Violation
Inconsistent action interface, caller must check each class for the method name, harder to create generic action dispatchers.

## Avoid Generic Action Names
---
## Maintainability
---
## Rule
Avoid generic action names like `ProcessAction`, `HandleAction`, or `RunAction`. Every action name must identify the specific business operation.
---
## Reason
Generic names don't communicate what the action does. An action name should tell a developer exactly what business operation it performs.
---
## Bad Example
```php
class ProcessAction {}     // Process what?
class HandleAction {}      // Handle what?
class ExecuteAction {}     // Execute what?
class RunAction {}         // Run what?
```
---
## Good Example
```php
class ProcessPaymentAction {}   // Clear: processes a payment
class HandleRefundAction {}     // Clear: handles a refund
class ExecuteMigrationAction {} // Clear: executes a migration
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unclear action purpose, requires reading the class to understand what it does, violates self-documenting code principle.

## Avoid Inconsistent Verb Choices
---
## Code Organization
---
## Rule
Document approved action verbs and use them consistently. Do not allow the same operation type to use different verbs in different parts of the codebase.
---
## Reason
Inconsistent verb choices make the codebase feel disorganized and confusing. Developers waste time deciding which verb to use and which verb to search for.
---
## Bad Example
```php
// Multiple verbs for creation operations across the codebase
class MakeProductAction {}
class CreateCategoryAction {}
class GenerateCouponAction {}
class BuildReportAction {}
class ConstructQueryAction {}
```
---
## Good Example
```php
// Consistent verb usage
class CreateProductAction {}  // Create for new entities
class CreateCategoryAction {}
class CreateCouponAction {}
class GenerateReportAction {} // Generate for output/document generation
class BuildQueryAction {}     // Build for query construction
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Confusion about which verb to use, difficulty searching for actions, inconsistent codebase vocabulary.
