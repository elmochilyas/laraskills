## Rule 1: Use Factory Method when a class can't anticipate the class of objects it must create
---
## Category
Architecture
---
## Rule
Define an interface for creating an object, but let subclasses decide which class to instantiate.
---
## Reason
Factory Method lets a class defer instantiation to subclasses, keeping the creator class closed for modification but open for extension.
---
## Bad Example
```php
abstract class ReportGenerator
{
    public function generate(): string
    {
        $report = new PdfReport(); // hard-coded type
        return $report->render();
    }
}
```
---
## Good Example
```php
abstract class ReportGenerator
{
    abstract protected function createReport(): Report;

    public function generate(): string
    {
        $report = $this->createReport(); // delegated to subclass
        return $report->render();
    }
}

class PdfReportGenerator extends ReportGenerator
{
    protected function createReport(): Report
    {
        return new PdfReport();
    }
}
```
---
## Exceptions
When the type is known statically and unlikely to change.
---
## Consequences Of Violation
Hard-coded instantiation, OCP violation, rigid hierarchy.
---
## Rule 2: Use Abstract Factory when families of related products need to be created
---
## Category
Architecture
---
## Rule
When you need to create families of related objects (e.g., UI components for different OS), define an Abstract Factory interface with methods for each product type.
---
## Reason
Abstract Factory ensures that products from the same family are used together, preventing incompatible combinations.
---
## Bad Example
```php
// Creating UI widgets without factory
$button = new WindowsButton(); // OS-specific
$menu = new MacMenu(); // inconsistent family
```
---
## Good Example
```php
interface UIFactory
{
    public function createButton(): Button;
    public function createMenu(): Menu;
    public function createDialog(): Dialog;
}

class WindowsUIFactory implements UIFactory { /* ... */ }
class MacUIFactory implements UIFactory { /* ... */ }
// All products from the same factory are consistent
```
---
## Exceptions
When only one product type exists (use Factory Method or Simple Factory).
---
## Consequences Of Violation
Inconsistent product families, incompatible combinations.
---
## Rule 3: Prefer Simple Factory (static factory) when creation is conditional but not polymorphic
---
## Category
Architecture
---
## Rule
Use a static factory method (e.g., `PaymentGateway::create($type)`) when the creation logic has conditions but no polymorphic creation is needed.
---
## Reason
Simple Factory is less complex than Abstract Factory or Factory Method when the creation logic is straightforward.
---
## Bad Example
```php
class PaymentController
{
    public function process(Request $request): void
    {
        $gateway = match($request->type) {
            'stripe' => new StripeGateway(),
            'paypal' => new PaypalGateway(),
        };
        // creation logic in controller
    }
}
```
---
## Good Example
```php
class PaymentGatewayFactory
{
    public static function create(string $type): PaymentGateway
    {
        return match($type) {
            'stripe' => new StripeGateway(),
            'paypal' => new PaypalGateway(),
        };
    }
}
```
---
## Exceptions
When creation logic is trivial (`new ClassName()` with no conditions).
---
## Consequences Of Violation
Scattered creation logic, SRP violation in callers.
