## Rule 1: A class should have only one reason to change
---
## Category
Architecture
---
## Rule
When asked "what could cause this class to change?", there must be exactly one answer. Multiple answers means multiple responsibilities.
---
## Reason
Multiple reasons to change mean every change to any responsibility risks breaking the others; classes become fragile and hard to maintain.
---
## Bad Example
```php
class OrderService
{
    public function createOrder(array $data): Order { /* ... */ }
    public function sendInvoice(Order $order): void { /* ... */ }
    public function generateReport(): array { /* ... */ }
    // Changes due to: order rules, email templates, report formats
}
```
---
## Good Example
```php
class OrderCreator { /* changes only when order creation rules change */ }
class InvoiceSender { /* changes only when email/invoice rules change */ }
class ReportGenerator { /* changes only when report format changes */ }
```
---
## Exceptions
Facade classes that delegate without implementing the logic themselves.
---
## Consequences Of Violation
Brittle classes, unexpected breakage on changes, testing complexity.
---
## Rule 2: Extract unrelated methods into separate classes
---
## Category
Architecture
---
## Rule
If a class contains methods that don't directly relate to its primary purpose, extract them into dedicated classes.
---
## Reason
Co-locating unrelated methods creates a dumping ground class that becomes harder to understand, test, and change.
---
## Bad Example
```php
class UserController
{
    public function update(Request $request): JsonResponse { /* ... */ }
    public function exportCsv(): StreamedResponse { /* CSV generation unrelated to user updates */ }
    public function sendNewsletter(): void { /* mailing logic unrelated */ }
}
```
---
## Good Example
```php
class UserController { /* user update actions only */ }
class CsvExporter { /* CSV export only */ }
class NewsletterService { /* newsletter only */ }
```
---
## Exceptions
When the "unrelated" method is a simple helper that would be over-engineered as its own class.
---
## Consequences Of Violation
God classes, scattered logic, low cohesion.
---
## Rule 3: Infrastructure concerns (logging, caching, persistence) should be separate from business logic
---
## Category
Architecture
---
## Rule
Do not mix database calls, cache operations, logging, or HTTP calls into classes whose primary responsibility is business logic.
---
## Reason
Business logic classes become untestable without infrastructure and violate SRP when they handle persistence alongside domain decisions.
---
## Bad Example
```php
class Order
{
    public function calculateTotal(): Money
    {
        $tax = TaxRate::fromDB($this->region); // infrastructure in domain
        Log::info('Calculating total'); // logging in domain
        return $this->items->sum()->add($tax);
    }
}
```
---
## Good Example
```php
class Order
{
    public function calculateTotal(TaxProvider $tax): Money
    {
        return $this->items->sum()->add($tax->forRegion($this->region));
    }
}
// Logging and persistence handled by decorators/repositories
```
---
## Exceptions
When the infrastructure concern is explicitly part of the domain requirement (e.g., "log every price change for audit").
---
## Consequences Of Violation
Domain coupled to infrastructure, untestable domain logic.
---
## Rule 4: Apply SRP at the method level too—one method, one operation
---
## Category
Maintainability
---
## Rule
Each method should do one thing. If a method name contains "and", it does too many things.
---
## Reason
Methods with multiple operations are harder to test, name, and understand; they hide side effects.
---
## Bad Example
```php
public function validateAndSaveAndNotify(array $data): void
{
    $this->validate($data);
    $this->save($data);
    $this->notify($data);
}
```
---
## Good Example
```php
public function handle(array $data): void
{
    $validated = $this->validator->validate($data);
    $entity = $this->repository->save($validated);
    $this->notifier->send($entity);
}
// Each dependency has its own single responsibility
```
---
## Exceptions
Trivial scripting where splitting would add more scaffolding than value.
---
## Consequences Of Violation
Long methods, hidden side effects, low cohesion.
---
## Rule 5: Use the "describe the class in one sentence" test
---
## Category
Architecture
---
## Rule
If you cannot describe what a class does in one sentence without using "and" or "or", it has too many responsibilities.
---
## Reason
The one-sentence test is a quick heuristic that prevents SRP violations without requiring formal analysis.
---
## Bad Example
```
"This class manages user registrations and sends emails and generates reports."
→ Violates SRP (3 responsibilities)
```
---
## Good Example
```
"This class handles user registration."
→ Compliant (1 responsibility)
```
---
## Exceptions
Facade classes whose explicit purpose is to coordinate multiple sub-tasks.
---
## Consequences Of Violation
Unclear class responsibilities, maintenance burden, testing overhead.
