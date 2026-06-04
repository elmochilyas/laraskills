## Rule 1: Facade provides a simplified interface to a complex subsystem
---
## Category
Architecture
---
## Rule
Place a Facade in front of a complex subsystem to provide a simple, unified interface that clients use instead of interacting with subsystem components directly.
---
## Reason
Without a Facade, clients must understand and orchestrate multiple subsystem components, creating tight coupling and scattered knowledge.
---
## Bad Example
```php
// Client must know about all subsystem components
$validator = new OrderValidator();
$pricer = new OrderPricer();
$inventory = new InventoryService();
$payment = new PaymentService();
$notifier = new NotificationService();

$validator->validate($data);
$total = $pricer->calculate($data->items);
$inventory->reserve($data->items);
$payment->charge($total);
$notifier->sendConfirmation($data->customer);
```
---
## Good Example
```php
class CheckoutFacade
{
    public function __construct(
        private OrderValidator $validator,
        private OrderPricer $pricer,
        private InventoryService $inventory,
        private PaymentService $payment,
        private NotificationService $notifier
    ) {}

    public function checkout(CheckoutData $data): CheckoutResult
    {
        $this->validator->validate($data);
        $total = $this->pricer->calculate($data->items);
        $this->inventory->reserve($data->items);
        $this->payment->charge($total);
        $this->notifier->sendConfirmation($data->customer);
        return new CheckoutResult($total);
    }
}
```
---
## Exceptions
When clients need fine-grained access to subsystem components (and a Facade would hide necessary flexibility).
---
## Consequences Of Violation
Client coupling to subsystem details, scattered orchestration.
---
## Rule 2: Facade does not add new behavior—it only delegates
---
## Category
Architecture
---
## Rule
The Facade should not implement business logic; it only orchestrates existing subsystem components.
---
## Reason
Business logic in a Facade violates SRP and cannot be tested independently of the subsystem.
---
## Bad Example
```php
class CheckoutFacade
{
    public function checkout(CheckoutData $data): void
    {
        if ($data->total > 1000) { // business logic in facade
            $data->applyDiscount(0.1);
        }
        $this->pricer->calculate($data->items);
    }
}
```
---
## Good Example
```php
class CheckoutFacade
{
    public function checkout(CheckoutData $data): void
    {
        $this->pricer->calculate($data->items); // pure delegation
    }
}
```
---
## Exceptions
Orchestration logic that coordinates calls but doesn't implement domain rules (coordination ≠ business logic).
---
## Consequences Of Violation
SRP violation, logic hidden from tests, cannot reuse logic without facade.
---
## Rule 3: Test the Facade behavior, not the subsystem through the Facade
---
## Category
Testing
---
## Rule
Unit test the Facade with mocked subsystem components to verify orchestration; test subsystem components separately.
---
## Reason
Testing the entire subsystem through the Facade creates integration tests that are slow and fragile; mocking subsystem components isolates Facade behavior.
---
## Bad Example
```php
class CheckoutFacadeTest
{
    public function test_checkout(): void
    {
        $facade = new CheckoutFacade(/* real dependencies */);
        $facade->checkout($data); // tests everything — slow
    }
}
```
---
## Good Example
```php
class CheckoutFacadeTest
{
    public function test_checkout_orchestrates_components(): void
    {
        $validator = $this->createMock(OrderValidator::class);
        $pricer = $this->createMock(OrderPricer::class);
        $facade = new CheckoutFacade($validator, $pricer, ...);
        $facade->checkout($data);
        // Verify each component was called
    }
}
```
---
## Exceptions
When the Facade is thin and testing it in isolation provides no meaningful value.
---
## Consequences Of Violation
Slow tests, fragile integration tests, not isolating behavior.
