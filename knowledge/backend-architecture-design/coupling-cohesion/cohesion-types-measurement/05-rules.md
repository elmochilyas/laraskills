## Rule 1: Keep LCOM4 at 1 (cohesive) for non-infrastructure classes; investigate values > 2
---
## Category
Maintainability
---
## Rule
Measure Lack of Cohesion of Methods (LCOM4) in CI; flag classes with LCOM4 > 2 for refactoring.
---
## Reason
LCOM4 > 2 indicates a class contains multiple unrelated responsibilities, violating SRP and making the class harder to understand, test, and maintain.
---
## Bad Example
```php
class UserService
{
    public function createUser(array $data): User { /* ... */ }
    public function sendWelcomeEmail(User $user): void { /* ... */ }
    public function generateReport(): array { /* ... */ }
    public function calculateTax(float $amount): float { /* ... */ }
    // LCOM4 would be 3+ — unrelated methods grouped together
}
```
---
## Good Example
```php
class UserCreator { /* create user only */ }
class WelcomeEmailSender { /* email only */ }
class ReportGenerator { /* reports only */ }
class TaxCalculator { /* tax only */ }
```
---
## Exceptions
Facade classes or controllers that deliberately orchestrate multiple services (but keep orchestration logic minimal).
---
## Consequences Of Violation
God classes, SRP violation, testing complexity, low maintainability.
---
## Rule 2: Prefer high-cohesion (functional cohesion) over sequential or communicational cohesion
---
## Category
Architecture
---
## Rule
Aim for functional cohesion—every element in a module contributes to a single, well-defined purpose. Avoid coincidental cohesion entirely.
---
## Reason
Higher cohesion levels (functional) correlate with lower defect rates and higher maintainability; coincidental cohesion is comparable to copy-paste garbage.
---
## Cohesion Hierarchy
```
Functional (best) → Sequential → Communicational → Procedural → Temporal → Logical → Coincidental (worst)
```
---
## Bad Example
```php
class Utils
{
    public function formatDate(string $date): string { /* ... */ }
    public function sendEmail(string $to, string $msg): void { /* ... */ }
    public function calculateAge(Carbon $birth): int { /* ... */ }
    public function hashPassword(string $pw): string { /* ... */ }
    // Coincidental cohesion — no relationship between these methods
}
```
---
## Good Example
```php
class DateFormatter
{
    public function formatShort(Carbon $date): string { /* ... */ }
    public function formatLong(Carbon $date): string { /* ... */ }
    public function formatRelative(Carbon $date): string { /* ... */ }
    // Functional cohesion — all methods format dates
}
```
---
## Exceptions
Utility helpers that are intentionally simple delegations and are explicitly documented as "no cohesion expected."
---
## Consequences Of Violation
Low maintainability, scattered logic, hard to find related functionality.
---
## Rule 3: Use the "Single Responsibility Prompt" test to evaluate class cohesion
---
## Category
Architecture
---
## Rule
For every class, try to describe its responsibility in one sentence without using "and" or "or." If you cannot, the class lacks cohesion.
---
## Reason
The one-sentence test is a quick heuristic that reveals whether a class has too many responsibilities without needing metric tooling.
---
## Bad Example
```
"This class handles user authentication AND generates reports AND caches data."
→ 3 responsibilities → split into 3 classes
```
---
## Good Example
```
"This class validates user credentials against the database."
→ 1 responsibility → cohesive
```
---
## Exceptions
Adapter/bridge classes where "translate from X to Y" is inherently two concepts but the SR describes the translation itself.
---
## Consequences Of Violation
Unclear ownership, difficult maintenance, testing complexity.
---
## Rule 4: Extract methods or classes when they use different subsets of fields
---
## Category
Architecture
---
## Rule
If a method uses only some fields of a class and other methods use a disjoint set of fields, extract the field groups and methods into separate classes.
---
## Reason
Field usage that is disjoint across methods is the strongest signal of low cohesion; the class is hosting multiple unrelated data structures.
---
## Bad Example
```php
class OrderProcessor
{
    private string $customerName;
    private string $customerEmail;
    private float $taxRate;
    private string $regionCode;

    public function sendReceipt(): void { /* uses customerName, customerEmail */ }
    public function calculateTax(): void { /* uses taxRate, regionCode */ }
    // Disjoint field usage → two responsibilities
}
```
---
## Good Example
```php
class CustomerNotifier { /* customer fields + notification logic */ }
class TaxCalculator { /* tax fields + calculation logic */ }
```
---
## Exceptions
When the disjoint fields represent a cross-cutting concern that is intentionally bundled (rare and should be documented).
---
## Consequences Of Violation
Hidden coupling between unrelated concerns, confusion about class purpose.
---
## Rule 5: Do not sacrifice coupling quality to improve cohesion artificially
---
## Category
Architecture
---
## Rule
When splitting classes to improve cohesion, ensure the resulting classes do not become tightly coupled to each other or require excessive cross-class interaction.
---
## Reason
Improving cohesion at the cost of dramatically increased coupling can make the overall design worse; high cohesion + high coupling is worse than medium cohesion + low coupling.
---
## Bad Example
```php
// Split to improve cohesion, but now 5 classes with bidirectional dependencies
class OrderService { /* needs all 4 below */ }
class OrderValidator { /* needs Pricer and Taxer */ }
class OrderPricer { /* needs DiscountEngine */ }
class OrderTaxer { /* needs Pricer */ }
class DiscountEngine { /* needs OrderService (cyclic) */ }
```
---
## Good Example
```php
// Cohesive AND loosely coupled
class OrderService
{
    public function __construct(
        private OrderPricer $pricer,
        private OrderRepository $repo
    ) {}
}
```
---
## Exceptions
When coupling is unavoidable for performance reasons and is documented in an ADR.
---
## Consequences Of Violation
Fragile system with many small but tightly-coupled classes, worse than original monolithic class.
