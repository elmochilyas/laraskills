## Rule 1: Gateway wraps external or database access behind a simple interface
---
## Category
Architecture
---
## Rule
A Gateway encapsulates access to an external system (database, web service, file system) behind a simple interface that the domain/application code calls.
---
## Reason
Without a Gateway, external system code is scattered across the codebase; Gateway centralizes it and isolates the domain from infrastructure changes.
---
## Bad Example
```php
// Direct database calls scattered in domain logic
$orders = DB::table('orders')->where('status', 'pending')->get();
Mail::send('emails.reminder', ['orders' => $orders]);
```
---
## Good Example
```php
class OrderGateway
{
    public function findPending(): Collection
    {
        return DB::table('orders')->where('status', 'pending')->get();
    }
}

class ReminderService
{
    public function __construct(private OrderGateway $gateway) {}
    public function send(): void
    {
        $orders = $this->gateway->findPending();
        // ...
    }
}
```
---
## Exceptions
Trivial applications with a single database and no planned changes.
---
## Consequences Of Violation
Scattered infrastructure code, hard to replace external systems.
---
## Rule 2: Gateway methods return simple data structures, not domain objects
---
## Category
Architecture
---
## Rule
A Gateway returns generic data (arrays, stdClass, Collection) rather than domain objects. If domain objects are needed, add a Repository layer on top.
---
## Reason
Gateways are data access mechanisms; Domain Objects are domain concepts. Mixing them couples the domain to the Gateway's data format.
---
## Bad Example
```php
class PaymentGateway
{
    public function charge(Money $amount): Payment // returns domain object
    {
        $response = $this->api->charge($amount);
        return new Payment($response);
    }
}
```
---
## Good Example
```php
class PaymentGateway
{
    public function charge(Money $amount): array // returns raw response
    {
        return $this->api->charge($amount->amount(), $amount->currency());
    }
}
```
---
## Exceptions
When the Gateway is part of an Anti-Corruption Layer that intentionally transforms data to domain types.
---
## Consequences Of Violation
Domain objects tied to external format, gateway concerns mixed with domain mapping.
---
## Rule 3: Test Gateways with integration tests using real (or sandbox) external systems
---
## Category
Testing
---
## Rule
Write integration tests for Gateway implementations that connect to real/sandbox versions of the external system.
---
## Reason
Mocking external systems only verifies the code path, not the actual integration. Real integration tests catch API changes, auth issues, and data format mismatches.
---
## Bad Example
```php
class PaymentGatewayTest
{
    public function test_charge(): void
    {
        $gateway = $this->createMock(PaymentGateway::class); // tests nothing real
    }
}
```
---
## Good Example
```php
class StripeGatewayTest
{
    public function test_charge(): void
    {
        $gateway = new StripeGateway(config('services.stripe.secret'));
        $result = $gateway->charge(new Money(100, 'USD'));
        $this->assertTrue($result['success']);
    }
}
```
---
## Exceptions
When the external system is not available in test environments and cannot be sandboxed.
---
## Consequences Of Violation
Untested integration, production failures from API changes.
