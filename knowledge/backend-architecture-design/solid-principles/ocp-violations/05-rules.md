## Rule 1: Open for extension, closed for modification—use polymorphism for new behavior
---
## Category
Architecture
---
## Rule
When adding new behavior, create new classes that implement existing interfaces; do not modify existing classes.
---
## Reason
Modifying existing classes risks breaking existing functionality; extending via new classes keeps existing code unchanged and safe.
---
## Bad Example
```php
class PaymentProcessor
{
    public function process(string $type, Money $amount): void
    {
        if ($type === 'stripe') { /* stripe logic */ }
        elseif ($type === 'paypal') { /* paypal logic */ }
        // Adding new type requires modifying this method
    }
}
```
---
## Good Example
```php
interface PaymentGateway
{
    public function charge(Money $amount): ChargeResult;
}

class StripeGateway implements PaymentGateway { /* ... */ }
class PaypalGateway implements PaymentGateway { /* ... */ }
// Adding new gateway: create new class, don't modify existing
```
---
## Exceptions
Security patches and bug fixes where modification is unavoidable and necessary.
---
## Consequences Of Violation
Fragile code, frequent regressions, switch/if-else chains.
---
## Rule 2: Replace switch/if-else chains with Strategy pattern
---
## Category
Architecture
---
## Rule
When you see a switch or if-else chain that dispatches by type, replace it with a Strategy pattern (interface + implementations).
---
## Reason
Switch statements violate OCP because adding a new case requires modifying the switch; Strategy allows adding cases by creating new classes.
---
## Bad Example
```php
public function calculateDiscount(string $customerType, Money $total): Money
{
    return match($customerType) {
        'regular' => $total->multiplyBy(0.95),
        'vip' => $total->multiplyBy(0.90),
        'employee' => $total->multiplyBy(0.80),
    };
}
```
---
## Good Example
```php
interface DiscountStrategy
{
    public function calculate(Money $total): Money;
}

class RegularDiscount implements DiscountStrategy { /* ... */ }
class VipDiscount implements DiscountStrategy { /* ... */ }
class EmployeeDiscount implements DiscountStrategy { /* ... */ }
```
---
## Exceptions
When the condition is primitive and unlikely to grow (simple boolean check).
---
## Consequences Of Violation
OCP violation, scattered conditionals, difficult to extend.
---
## Rule 3: Use Template Method for algorithms with varying steps but fixed structure
---
## Category
Architecture
---
## Rule
When an algorithm has a fixed sequence but some steps vary, define the algorithm skeleton in an abstract base class (or via composition) and let subclasses/strategies implement the varying steps.
---
## Reason
Template Method allows extending the algorithm's steps without modifying the algorithm structure.
---
## Bad Example
```php
class ReportGenerator
{
    public function generate(string $type): string
    {
        if ($type === 'csv') {
            // csv-specific fetch, format, export
        } elseif ($type === 'pdf') {
            // pdf-specific fetch, format, export
        }
    }
}
```
---
## Good Example
```php
abstract class ReportGenerator
{
    final public function generate(): string
    {
        $data = $this->fetchData();
        $formatted = $this->format($data);
        return $this->export($formatted);
    }

    abstract protected function fetchData(): array;
    abstract protected function format(array $data): string;
    abstract protected function export(string $content): string;
}

class CsvReportGenerator extends ReportGenerator { /* ... */ }
class PdfReportGenerator extends ReportGenerator { /* ... */ }
```
---
## Exceptions
When the varying steps are so numerous that the template becomes a fragile base class (consider Strategy pattern instead).
---
## Consequences Of Violation
Conditional logic for algorithm variants, duplicated algorithm structure.
---
## Rule 4: Use events to extend behavior without modifying existing code
---
## Category
Architecture
---
## Rule
When an action should trigger additional behavior, dispatch an event; add new subscribers to extend behavior without modifying the original action.
---
## Reason
Events allow unlimited extension of behavior at trigger points without touching the triggering code—pure OCP.
---
## Bad Example
```php
class OrderService
{
    public function placeOrder(OrderData $data): void
    {
        $order = $this->repo->save($data);
        // Every new action requires modifying this method
        $this->emailService->sendConfirmation($order);
        $this->inventoryService->reserve($order->items);
        $this->analyticsService->track($order);
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function placeOrder(OrderData $data): void
    {
        $order = $this->repo->save($data);
        $this->events->dispatch(new OrderPlaced($order));
    }
}
// New subscribers: EmailSubscriber, InventorySubscriber, AnalyticsSubscriber
```
---
## Exceptions
When the behavior must be synchronous and its result is needed by the caller.
---
## Consequences Of Violation
Modification needed for each new requirement, SRP violation in triggering class.
---
## Rule 5: Make extension points explicit and documented
---
## Category
Architecture
---
## Rule
Mark extension points (interfaces, events, hooks) in code and document how they are intended to be extended.
---
## Reason
Undocumented extension points are missed by developers who instead modify the core code, violating OCP.
---
## Bad Example
```php
// No indication that NotificationChannel is an extension point
interface NotificationChannel { /* ... */ }
```
---
## Good Example
```php
/**
 * Extension point: implement this interface to add a new notification channel.
 * Register in AppServiceProvider.
 */
interface NotificationChannel
{
    public function send(Notification $notification): void;
}
```
---
## Exceptions
When the extension point is a well-known pattern (e.g., Repository) that doesn't need documentation.
---
## Consequences Of Violation
Missed extension points, core modifications, OCP violations.
