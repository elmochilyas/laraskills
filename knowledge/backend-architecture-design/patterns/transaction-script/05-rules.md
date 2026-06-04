## Rule 1: Use Transaction Script for simple, procedural business logic
---
## Category
Architecture
---
## Rule
Use Transaction Script (a single method/class per use case containing all logic) when the business logic is simple enough that Domain Model would be over-engineering.
---
## Reason
Transaction Script is simple, direct, and easy to understand. Domain Model adds abstraction that is only justified for complex, multi-rule domains.
---
## Bad Example
```php
// Domain Model for a simple contact form submission
class ContactForm
{
    public function submit(ContactData $data): void
    {
        // 3 lines of logic
    }
}
```
---
## Good Example
```php
class SubmitContactForm
{
    public function execute(ContactData $data): void
    {
        DB::table('contacts')->insert($data->toArray());
        Mail::send('emails.contact', $data->toArray());
    }
}
```
---
## Exceptions
When the business logic has multiple interacting rules, invariants, and validation that would benefit from Domain Model encapsulation.
---
## Consequences Of Violation
Over-engineering for simple logic, unnecessary complexity.
---
## Rule 2: One Transaction Script per use case
---
## Category
Architecture
---
## Rule
Each use case (place order, cancel order, update profile) gets its own Transaction Script class with one public method.
---
## Reason
One script per use case keeps each script focused, testable, and independently changeable.
---
## Bad Example
```php
class OrderScripts
{
    public function placeOrder(array $data): void { /* ... */ }
    public function cancelOrder(int $id): void { /* ... */ }
    public function returnOrder(int $id): void { /* ... */ }
}
```
---
## Good Example
```php
class PlaceOrderScript { public function execute(OrderData $data): void { /* ... */ } }
class CancelOrderScript { public function execute(int $orderId): void { /* ... */ } }
class ReturnOrderScript { public function execute(int $orderId): void { /* ... */ } }
```
---
## Exceptions
When use cases share significant setup/teardown logic (extract shared as base class or trait).
---
## Consequences Of Violation
Monolithic scripts, SRP violation, difficulty finding specific use case logic.
---
## Rule 3: Transaction Scripts can use Table Data Gateway (DB facade) or Active Record
---
## Category
Architecture
---
## Rule
Transaction Scripts typically access the database directly via SQL, DB facade, or Active Record. This is acceptable for simple logic.
---
## Reason
Adding a Repository layer between Transaction Script and DB adds abstraction that simple scripts don't need.
---
## Bad Example
```php
class PlaceOrderScript
{
    public function __construct(
        private OrderRepository $repo, // abstraction for simple logic
        private CustomerRepository $customerRepo
    ) {}
    public function execute(OrderData $data): void
    {
        $customer = $this->customerRepo->find($data->customerId);
        $order = Order::fromData($data);
        $this->repo->save($order);
    }
}
```
---
## Good Example
```php
class PlaceOrderScript
{
    public function execute(OrderData $data): void
    {
        $customer = Customer::find($data->customerId);
        $order = new Order(['customer_id' => $customer->id, ...]);
        $order->save();
    }
}
```
---
## Exceptions
When the team follows a consistent Repository pattern everywhere and consistency is valued over simplicity.
---
## Consequences Of Violation
Unnecessary abstraction, increased file count, slower development.
---
## Rule 4: Put shared Transaction Script logic in a Service Layer, not in base classes
---
## Category
Architecture
---
## Rule
When multiple Transaction Scripts share logic (e.g., send email, generate invoice), extract it to a shared Service Layer rather than inheriting from a base script.
---
## Reason
Base class inheritance creates an inflexible hierarchy; composition via Service Layer is more flexible and testable.
---
## Bad Example
```php
abstract class BaseScript
{
    protected function sendEmail(string $to, string $subject): void { /* ... */ }
    protected function logActivity(string $action): void { /* ... */ }
}
```
---
## Good Example
```php
class NotificationService
{
    public function sendEmail(string $to, string $subject): void { /* ... */ }
}
```
---
## Exceptions
Cross-cutting concerns (logging, transactions) that are truly common to all scripts.
---
## Consequences Of Violation
Rigid inheritance, hard-to-test scripts, deep hierarchies.
