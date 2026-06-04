## Rule 1: Each class must have a single, well-defined responsibility
---
## Category
Architecture
---
## Rule
A class should be responsible for one cohesive set of related operations. Use the "one-sentence test": if you need "and" or "or" to describe its purpose, split it.
---
## Reason
High cohesion means all methods in a class work together toward one purpose; low cohesion scatters related logic and makes the class hard to understand and maintain.
---
## Bad Example
```php
class OrderManager
{
    public function createOrder(array $data): Order { /* ... */ }
    public function calculateTax(Money $amount): Money { /* ... */ }
    public function sendInvoice(Order $order): void { /* ... */ }
    public function generateReport(): array { /* ... */ }
    // 4 responsibilities → low cohesion
}
```
---
## Good Example
```php
class OrderCreator { /* create orders */ }
class TaxCalculator { /* calculate tax */ }
class InvoiceSender { /* send invoices */ }
class ReportGenerator { /* generate reports */ }
```
---
## Exceptions
Facade classes that deliberately orchestrate multiple services (facade pattern) but without implementing the logic themselves.
---
## Consequences Of Violation
Low cohesion, SRP violation, testing difficulty, hard to maintain.
---
## Rule 2: Methods within a class should operate on the same set of fields
---
## Category
Architecture
---
## Rule
If different methods in a class use completely different sets of fields, those methods likely belong in different classes.
---
## Reason
Disjoint field usage is the strongest indicator of low cohesion; each group of fields with its methods forms a natural separate class.
---
## Bad Example
```php
class InvoiceProcessor
{
    private string $customerName;
    private string $customerEmail;
    private float $taxRate;
    private string $regionCode;

    public function sendEmail(): void { /* uses customerName, customerEmail */ }
    public function calculateTax(): void { /* uses taxRate, regionCode */ }
    // Two disjoint sets of fields
}
```
---
## Good Example
```php
class CustomerNotifier { /* customerName, customerEmail + notification methods */ }
class TaxCalculator { /* taxRate, regionCode + calculation methods */ }
```
---
## Exceptions
When the disjoint fields represent a cross-cutting concern that must be bundled for consistency.
---
## Consequences Of Violation
Hidden unrelated concerns in a single class, confusion about class purpose.
---
## Rule 3: Keep class size manageable—fewer than 200 lines for domain objects
---
## Category
Maintainability
---
## Rule
As a heuristic, keep classes under 200 lines (domain objects) or under 100 lines (application services). Extract new classes when sizes grow beyond.
---
## Reason
Large classes inevitably accumulate unrelated responsibilities; size limits force regular extraction and maintain high cohesion.
---
## Bad Example
```
class OrderService — 800 lines containing: creation, payment, shipping, reporting logic
```
---
## Good Example
```
class OrderCreator — 80 lines
class PaymentCollector — 60 lines
class ShippingCoordinator — 90 lines
class OrderReportGenerator — 120 lines
```
---
## Exceptions
Infrastructure classes (Service Providers, middleware) that wire up many dependencies but have minimal logic.
---
## Consequences Of Violation
Low cohesion, hard to test, SRP violation.
---
## Rule 4: Extract a class when you notice a group of methods operating on a subset of data
---
## Category
Architecture
---
## Rule
During code review or refactoring, identify groups of methods that share a subset of fields and extract them into a dedicated class.
---
## Reason
Cohesion improves by grouping related data and behavior; extraction is the primary tool for improving cohesion.
---
## Bad Example
```php
class ReportService
{
    // Some methods format dates
    // Some methods aggregate data
    // Some methods export to CSV
    // Three different responsibilities
}
```
---
## Good Example
```php
class DateFormatter { /* date formatting only */ }
class DataAggregator { /* data aggregation only */ }
class CsvExporter { /* CSV export only */ }
```
---
## Exceptions
When the extracted class would create excessive cross-class coupling; balance cohesion with coupling.
---
## Consequences Of Violation
Low cohesion, unclear responsibility boundaries.
