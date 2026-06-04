## Rule 1: Split any class whose single-responsibility description requires "and"
---
## Category
Architecture
---
## Rule
If a class has more than ~200 lines or more than 5 public methods covering unrelated responsibilities, extract each responsibility into its own class.
---
## Reason
God classes concentrate all logic in one place, making them impossible to test, understand, or change without side effects.
---
## Bad Example
```php
class UserManager // 800 lines
{
    public function createUser(array $data): User { /* ... */ }
    public function sendWelcomeEmail(User $user): void { /* ... */ }
    public function generateUserReport(): array { /* ... */ }
    public function resetPassword(User $user, string $pw): void { /* ... */ }
    public function calculateUserDiscount(User $user): float { /* ... */ }
    // 15 more unrelated methods...
}
```
---
## Good Example
```php
class UserCreator { /* creates only */ }
class WelcomeEmailSender { /* email only */ }
class UserReportGenerator { /* reports only */ }
class PasswordResetter { /* reset only */ }
class UserDiscountCalculator { /* discount only */ }
```
---
## Exceptions
Facades that deliberately delegate to multiple sub-services without implementing the logic themselves.
---
## Consequences Of Violation
Low cohesion, high coupling, testing overhead, change ripple effect.
---
## Rule 2: Extract data groups from god classes into dedicated value objects or models
---
## Category
Architecture
---
## Rule
If a class holds fields that are used by only a subset of its methods, extract those fields into a separate class with the methods that use them.
---
## Reason
Disjoint field usage is the strongest indicator that multiple data concepts are crammed into one class.
---
## Bad Example
```php
class OrderProcessor
{
    private string $customerName;
    private string $customerEmail;
    private float $taxRate;
    private string $region;
    // customer fields used by sendReceipt, tax fields used by calculateTax
}
```
---
## Good Example
```php
class CustomerContact { /* name + email + notifications */ }
class TaxProfile { /* rate + region + tax calculation */ }
class OrderProcessor
{
    public function __construct(
        private CustomerContact $customer,
        private TaxProfile $tax
    ) {}
}
```
---
## Exceptions
When the grouped fields represent a cross-cutting concern that must be handled together for consistency.
---
## Consequences Of Violation
Hidden concerns in a single class, SRP violation.
---
## Rule 3: Use the "why would this change?" test to identify god class boundaries
---
## Category
Architecture
---
## Rule
Ask "what reasons could cause this class to change?" If more than one answer exists, those are separate responsibilities that should be extracted.
---
## Reason
SRP states a class should have only one reason to change; multiple reasons mean multiple responsibilities.
---
## Bad Example
```
"UserManager changes when: user creation rules change, email templates change, report formats change, password policies change."
→ 4 reasons → 4 classes
```
---
## Good Example
```
"UserCreator changes when: user validation rules change."
→ 1 reason → good
```
---
## Exceptions
When the changes are tightly coupled by business rules (changing creation inevitably changes validation) — document as such.
---
## Consequences Of Violation
Mysterious bugs from unrelated changes affecting the same class.
---
## Rule 4: Break god classes incrementally — Tease Apart Inheritance pattern
---
## Category
Maintainability
---
## Rule
Do not rewrite a god class from scratch; extract methods/classes one at a time, ensuring tests pass after each extraction.
---
## Reason
Big-bang refactoring of a god class is error-prone, breaks everything at once, and is often abandoned halfway.
---
## Bad Example
```
"Let me rewrite UserManager from scratch."
Week of work, everything breaks, rolls back.
```
---
## Good Example
```
Day 1: Extract UserCreator, delegate. Tests pass.
Day 2: Extract EmailSender, delegate. Tests pass.
Day 3: Extract ReportGenerator, delegate. Tests pass.
```
---
## Exceptions
When the god class is already fully covered by tests and the team is confident in a complete rewrite.
---
## Consequences Of Violation
Failed refactoring, wasted effort, abandoned improvement.
---
## Rule 5: Prefer delegation over inheritance when extracting from a god class
---
## Category
Architecture
---
## Rule
When splitting a god class, use composition/delegation (new class + original class calls it) rather than inheritance.
---
## Reason
Inheritance from a god class pulls all its baggage into the child class, defeating the purpose of extraction.
---
## Bad Example
```php
class UserManager { /* god class */ }
class AdminUserManager extends UserManager { /* inherits all the god logic */ }
```
---
## Good Example
```php
class UserManager
{
    public function __construct(
        private UserCreator $creator,
        private EmailSender $emailer
    ) {}
    // delegates to each
}
```
---
## Exceptions
When the extracted behavior is genuinely an IS-A relationship with a stable base class (rare in god class refactoring).
---
## Consequences Of Violation
Inheritance from god class perpetuates the problem.
