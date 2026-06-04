## Rule 1: Adapter converts one interface to another that the client expects
---
## Category
Architecture
---
## Rule
Wrap an existing class (Adaptee) with an Adapter that implements the target interface, translating calls from the client's expected interface to the Adaptee's interface.
---
## Reason
When a client expects one interface but the available class has a different interface, Adapter bridges the gap without modifying either side.
---
## Bad Example
```php
// Client expects: $gateway->charge(Money $amount)
// Third-party has: $stripe->createCharge(float $amount, string $currency)

class PaymentService
{
    public function process(Money $amount): void
    {
        $stripe = new StripeApi();
        $stripe->createCharge($amount->amount(), $amount->currency());
        // Client must know Stripe's API
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

class StripeAdapter implements PaymentGateway
{
    public function __construct(private StripeApi $stripe) {}

    public function charge(Money $amount): ChargeResult
    {
        $result = $this->stripe->createCharge(
            $amount->amount(),
            $amount->currency()
        );
        return ChargeResult::fromStripeResponse($result);
    }
}
```
---
## Exceptions
When you can modify the Adaptee to implement the target interface directly (refactor, don't adapt).
---
## Consequences Of Violation
Client coupled to vendor-specific API, hard to swap providers.
---
## Rule 2: Adapter should not add new behavior—only convert interfaces
---
## Category
Architecture
---
## Rule
The Adapter translates between interfaces; it should not implement business logic, validation, or caching.
---
## Reason
Business logic in an Adapter violates SRP and makes it impossible to test the logic without the external system.
---
## Bad Example
```php
class StripeAdapter implements PaymentGateway
{
    public function charge(Money $amount): ChargeResult
    {
        if ($amount->amount() > 10000) { // business logic in adapter
            throw new \DomainException('Amount too high');
        }
        // ...
    }
}
```
---
## Good Example
```php
class StripeAdapter implements PaymentGateway
{
    public function charge(Money $amount): ChargeResult
    {
        // Pure translation only
        return ChargeResult::fromStripeResponse(
            $this->stripe->createCharge($amount->amount(), $amount->currency())
        );
    }
}
```
---
## Exceptions
Data transformation that is part of the "translation" (e.g., converting status codes).
---
## Consequences Of Violation
SRP violation, business logic hidden in adapters.
---
## Rule 3: Use Object Adapter (composition) over Class Adapter (inheritance)
---
## Category
Architecture
---
## Rule
Prefer composition (holding a reference to the Adaptee) over inheritance (extending the Adaptee) for implementing Adapter.
---
## Reason
Composition is more flexible than inheritance; it allows adapting any instance, not just classes that can be extended.
---
## Bad Example
```php
class StripeAdapter extends StripeApi implements PaymentGateway
{
    // Inheritance — limited to StripeApi class
}
```
---
## Good Example
```php
class StripeAdapter implements PaymentGateway
{
    public function __construct(
        private StripeApi $stripe // composition — works with any instance
    ) {}
}
```
---
## Exceptions
When the Adaptee has many methods that need default pass-through behavior.
---
## Consequences Of Violation
Rigid inheritance, limited to specific class hierarchy.
