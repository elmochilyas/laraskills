## Rule 1: Introduce an intermediary when direct coupling between components is undesirable
---
## Category
Architecture
---
## Rule
When two components would otherwise be tightly coupled, place an intermediary (interface, adapter, controller) between them to decouple.
---
## Reason
Direct coupling makes components inseparable; indirection introduces a boundary that allows each side to change independently.
---
## Bad Example
```php
// PaymentService directly depends on StripeGateway
class PaymentService
{
    private StripeGateway $gateway; // direct coupling
}
```
---
## Good Example
```php
// PaymentService depends on PaymentGateway interface
class PaymentService
{
    public function __construct(
        private PaymentGateway $gateway // indirection via interface
    ) {}
}
```
---
## Exceptions
When the two components are in the same cohesion group and will always change together (no benefit to decoupling).
---
## Consequences Of Violation
Tight coupling, cannot swap implementations, hard to test.
---
## Rule 2: Use indirection where direct access would violate encapsulation or increase complexity
---
## Category
Architecture
---
## Rule
Use the Mediator, Facade, or Adapter pattern when direct communication would expose internals or create excessive dependencies.
---
## Reason
Indirection absorbs complexity that would otherwise be scattered across clients, reducing overall system coupling.
---
## Bad Example
```php
// Client directly manages complex multi-step payment flow
class CheckoutController
{
    public function checkout(Request $request): void
    {
        // Validate
        // Authorize payment
        // Capture payment
        // Create invoice
        // Send confirmation
        // Update inventory
    }
}
```
---
## Good Example
```php
// Facade handles the complex flow
class CheckoutFacade
{
    public function execute(CheckoutData $data): CheckoutResult
    {
        $payment = $this->paymentService->process($data->payment);
        $invoice = $this->invoiceService->create($data, $payment);
        $this->notificationService->sendConfirmation($data->customer);
        $this->inventoryService->reserve($data->items);
        return new CheckoutResult($invoice);
    }
}
```
---
## Exceptions
When the indirection introduces more complexity than the coupling it avoids (YAGNI).
---
## Consequences Of Violation
Complex client code, scattered orchestration, SRP violation in clients.
---
## Rule 3: Prefer interface-based indirection over class inheritance
---
## Category
Architecture
---
## Rule
Use interfaces (contracts) to introduce indirection between components; avoid base classes as intermediaries because they couple through inheritance hierarchy.
---
## Reason
Interface-based indirection (composition) is more flexible than inheritance; interfaces can be swapped, decorated, and combined without affecting the hierarchy.
---
## Bad Example
```php
abstract class PaymentProvider
{
    abstract protected function charge(Money $amount): ChargeResult;
}

class StripeProvider extends PaymentProvider { /* ... */ }
// All consumers coupled to PaymentProvider abstract class
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
// Consumers depend on interface, not hierarchy
```
---
## Exceptions
When the intermediary genuinely provides shared behavior that would be duplicated across all implementations (Template Method pattern).
---
## Consequences Of Violation
Inheritance coupling, less flexible indirection.
---
## Rule 4: Don't over-indirect—add intermediaries only when there's a proven need
---
## Category
Architecture
---
## Rule
Do not pre-emptively add interfaces, facades, or mediators in anticipation of future needs. Add them when refactoring reveals the coupling is problematic.
---
## Reason
Unnecessary indirection increases code volume, navigation complexity, and cognitive load without delivering decoupling benefits.
---
## Bad Example
```php
// Interface for a service with only one implementation and no planned second
interface UserServiceInterface { /* ... */ }
class UserService implements UserServiceInterface { /* ... */ }
```
---
## Good Example
```php
// Concrete class. Extract interface only when a second provider exists.
class UserService { /* ... */ }
```
---
## Exceptions
Published library interfaces where the contract must be stable for external consumers.
---
## Consequences Of Violation
Unnecessary abstraction, navigation overhead, YAGNI violation.
