## Rule 1: Use polymorphism to handle behavioral variations, not conditionals
---
## Category
Architecture
---
## Rule
When behavior varies by type, replace conditional statements (if/else, switch) with polymorphic dispatch through an interface.

## Reason
Conditional logic for type-based behavior scatters variation logic, violates OCP, and makes adding new types require modifying existing code.

## Bad Example
```php
class PaymentProcessor
{
    public function process(Payment $payment): void
    {
        switch ($payment->type) {
            case 'credit_card':
                // credit card logic
                break;
            case 'paypal':
                // paypal logic
                break;
            case 'bank_transfer':
                // bank transfer logic
                break;
        }
    }
}
```

## Good Example
```php
interface PaymentMethod
{
    public function process(Money $amount): PaymentResult;
}

class CreditCardPayment implements PaymentMethod { /* ... */ }
class PaypalPayment implements PaymentMethod { /* ... */ }
class BankTransferPayment implements PaymentMethod { /* ... */ }

class PaymentProcessor
{
    public function __construct(
        private PaymentMethod $method
    ) {}

    public function process(Money $amount): PaymentResult
    {
        return $this->method->process($amount);
    }
}
```

## Exceptions
When the condition is truly primitive and unlikely to grow (e.g., `if ($isAdmin)` for a single boolean check).

## Consequences Of Violation
OCP violation, scattered conditionals, difficult to extend.
---
## Rule 2: Define interfaces with behavior, not type markers
---
## Category
Architecture
---
## Rule
Interface methods should represent behavioral contracts (what to do), not type markers (what type I am). Avoid marker interfaces without methods.

## Reason
Marker interfaces provide no behavioral contract—they just tag classes, leading to instanceof checks that reintroduce conditionals.

## Bad Example
```php
interface Payable {} // marker interface — no behavior
// Later:
if ($entity instanceof Payable) {
    // conditional logic
}
```

## Good Example
```php
interface Payable
{
    public function calculatePayment(): Money;
    public function markAsPaid(): void;
}
```

## Exceptions
Attributes/annotations are the idiomatic alternative to marker interfaces when runtime metadata is needed.

## Consequences Of Violation
instanceof conditionals, no behavioral contract, marker misuse.
---
## Rule 3: Favor Strategy pattern over inheritance for polymorphic behavior
---
## Category
Architecture
---
## Rule
When behavior varies, compose with Strategy (interface + injected implementation) rather than subclassing.

## Reason
Inheritance couples subclasses to the base class and is less flexible; composition allows behavior to be selected, swapped, and tested independently.

## Bad Example
```php
abstract class OrderCalculator
{
    abstract protected function calculateDiscount(Money $total): Money;
    // Inheritance couples all calculators to base class
}
```

## Good Example
```php
interface DiscountStrategy
{
    public function calculate(Money $total): Money;
}

class OrderCalculator
{
    public function __construct(
        private DiscountStrategy $discount
    ) {}
}
```

## Exceptions
When the shared behavior across variants is significant and stable (Template Method pattern).

## Consequences Of Violation
Deep inheritance hierarchies, inflexible behavior selection.
---
## Rule 4: Test behavior through the interface, not implementation details
---
## Category
Testing
---
## Rule
Write tests against the polymorphic interface; test each implementation separately to verify its specific behavior.

## Reason
Testing through the interface allows any implementation to be tested with the same contract tests; testing details couples tests to implementation.

## Bad Example
```php
public function test_credit_card_payment(): void
{
    $payment = new CreditCardPayment();
    $result = $payment->process(new Money(100));
    $this->assertTrue($result->isSuccess());
}
```

## Good Example
```php
public function test_all_payment_methods(PaymentMethod $method): void
{
    $result = $method->process(new Money(100));
    $this->assertInstanceOf(PaymentResult::class, $result);
}
// Run for each implementation
```

## Exceptions
When the interface is too broad and testing all implementations requires too many similar tests.

## Consequences Of Violation
Brittle tests, missed polymorphic behavior, test duplication.
