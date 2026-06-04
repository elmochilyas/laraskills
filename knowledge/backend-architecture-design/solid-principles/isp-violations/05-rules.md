## Rule 1: Keep interfaces focused—clients should not depend on methods they don't use
---
## Category
Architecture
---
## Rule
Design interfaces with a single, focused purpose. A class implementing an interface should not be forced to implement methods it doesn't need.
---
## Reason
Fat interfaces force all implementors to provide stubs or throw exceptions for unused methods, violating ISP and creating fragile code.
---
## Bad Example
```php
interface Worker
{
    public function work(): void;
    public function eat(): void;
    public function sleep(): void;
}

class HumanWorker implements Worker
{
    public function work(): void { /* ... */ }
    public function eat(): void { /* ... */ }
    public function sleep(): void { /* ... */ }
}

class RobotWorker implements Worker
{
    public function work(): void { /* ... */ }
    public function eat(): void { throw new \Exception('Robots don\'t eat'); }
    public function sleep(): void { throw new \Exception('Robots don\'t sleep'); }
}
```
---
## Good Example
```php
interface Workable
{
    public function work(): void;
}

interface Eatable
{
    public function eat(): void;
}

interface Sleepable
{
    public function sleep(): void;
}

class HumanWorker implements Workable, Eatable, Sleepable { /* ... */ }
class RobotWorker implements Workable { /* ... */ }
```
---
## Exceptions
When the interface represents a stable contract that all implementors legitimately need (e.g., a base repository interface).
---
## Consequences Of Violation
Empty stub methods, thrown UnsupportedOperationException, broken API contracts.
---
## Rule 2: Split large interfaces into role-specific interfaces
---
## Category
Architecture
---
## Rule
If an interface has more than 3-5 methods covering different concerns, split it into distinct role interfaces.
---
## Reason
Large interfaces accumulate methods from different requirements; splitting makes them focused and prevents unnecessary dependencies.
---
## Bad Example
```php
interface OrderService
{
    public function createOrder(OrderData $data): Order;
    public function cancelOrder(OrderId $id): void;
    public function getOrder(OrderId $id): ?Order;
    public function exportOrders(DateRange $range): string;
    public function sendInvoice(Order $order): void;
}
```
---
## Good Example
```php
interface OrderCreator { public function create(OrderData $data): Order; }
interface OrderCanceler { public function cancel(OrderId $id): void; }
interface OrderQuery { public function find(OrderId $id): ?Order; }
interface OrderExporter { public function export(DateRange $range): string; }
interface InvoiceSender { public function send(Order $order): void; }
```
---
## Exceptions
When the clients always use all methods together (cohesive usage).
---
## Consequences Of Violation
Classes forced to implement methods they don't need, unclear interface purpose.
---
## Rule 3: Clients should own their interfaces (segregated principle)
---
## Category
Architecture
---
## Rule
Define interfaces based on client needs, not on what the implementing class provides. The client's needs drive the interface shape.
---
## Reason
Interfaces defined from the provider's perspective are naturally fat; client-defined interfaces are naturally segregated.
---
## Bad Example
```php
// Interface defined from provider's perspective
interface UserProvider
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function save(User $user): void;
    public function delete(int $id): void;
    public function exportCsv(): string;
}
```
---
## Good Example
```php
// Interfaces defined from client perspectives
interface UserQuery { public function findById(int $id): ?User; }
interface UserCommand { public function save(User $user): void; }
interface UserReport { public function exportCsv(): string; }
```
---
## Exceptions
Framework-mandated interfaces that cannot be split (e.g., Eloquent's Model methods).
---
## Consequences Of Violation
Fat interfaces, clients coupled to methods they don't use.
---
## Rule 4: Use Adapter pattern when you need to consume an interface that is too broad
---
## Category
Architecture
---
## Rule
When you must depend on a fat interface (e.g., from a library), create an Adapter that exposes only the methods you need and delegates to the fat interface.
---
## Reason
The Adapter translates the fat interface to a focused interface that your client depends on, preventing the client from being coupled to unused methods.
---
## Bad Example
```php
class ReportService
{
    public function __construct(
        private ThirdPartyService $service // fat library interface
    ) {}

    public function generate(): string
    {
        // Uses only 1 of 20 methods on $service
    }
}
```
---
## Good Example
```php
interface ReportGenerator
{
    public function generateData(): array;
}

class ThirdPartyAdapter implements ReportGenerator
{
    public function __construct(
        private ThirdPartyService $service
    ) {}

    public function generateData(): array
    {
        return $this->service->fetchReportData(); // only exposes needed method
    }
}
```
---
## Exceptions
When the fat interface is from the same codebase and can be refactored directly.
---
## Consequences Of Violation
Coupling to unused library methods, difficult testing, broken when library interface changes.
---
## Rule 5: A method parameter that is an interface should require only what the method uses
---
## Category
Architecture
---
## Rule
Define method parameters using the most specific interface that provides exactly what the method needs, not a broader interface.
---
## Reason
Broad parameter types force callers to provide objects with capabilities the method doesn't use, making the method harder to test and call.
---
## Bad Example
```php
public function sendNotification(Order $order): void // requires full Order object
{
    $email = $order->getCustomer()->getEmail();
    // uses only email
}
```
---
## Good Example
```php
public function sendNotification(string $email): void // requires only email
{
    // uses only email
}
```
---
## Exceptions
When the method genuinely needs the full object because it delegates to other methods that use multiple fields.
---
## Consequences Of Violation
Unnecessary dependencies, harder to test, broader coupling than needed.
