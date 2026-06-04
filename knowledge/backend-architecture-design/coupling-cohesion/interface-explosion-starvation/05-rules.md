## Rule 1: Create interfaces only when there are or will be at least two implementations
---
## Category
Architecture
---
## Rule
Do not extract an interface from a class with a single implementation unless you can foresee a concrete second implementation within the next release.
---
## Reason
Single-implementation interfaces add abstraction overhead, increase code navigation complexity, and provide no benefit. Extract only when the abstraction pays for itself.
---
## Bad Example
```php
// Only one implementation exists or will ever exist
interface PaymentGateway
{
    public function charge(Money $amount): ChargeResult;
}
class StripeGateway implements PaymentGateway { /* ... */ }
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
// Adapter pattern for existing multi-provider reality
```
---
## Exceptions
When the interface is part of a hexagonal architecture port (domain layer) and the implementation is in infrastructure — swap-ability is the goal.
---
## Consequences Of Violation
Interface explosion, navigation overhead, abstraction without benefit.
---
## Rule 2: When you have too many small interfaces, consider merging them
---
## Category
Architecture
---
## Rule
If a class implements 5+ interfaces, or a constructor takes 4+ single-method interfaces from the same context, merge related interfaces into role interfaces.
---
## Reason
Interface proliferation creates object construction pain, verbose code, and makes it hard to understand the overall role a class plays.
---
## Bad Example
```php
class OrderService implements
    OrderCreatorInterface,
    OrderValidatorInterface,
    OrderPricerInterface,
    OrderShipperInterface,
    OrderNotifierInterface
{ /* ... */ }
```
---
## Good Example
```php
interface OrderProcessor
{
    public function process(OrderDto $dto): OrderResult;
}
```
---
## Exceptions
When the small interfaces represent genuinely independent roles that different clients use independently (interface segregation).
---
## Consequences Of Violation
Interface pollution, DI container clutter, poor discoverability.
---
## Rule 3: Replace interfaces with callables/closures for single-method contracts
---
## Category
Architecture
---
## Rule
For a contract with a single method, consider using a Closure or callable type instead of defining a named interface.
---
## Reason
Single-method interfaces add formality where a function type suffices, keeping the contract inline and reducing file count.
---
## Bad Example
```php
interface DiscountCalculatorInterface
{
    public function calculate(Order $order): Money;
}
```
---
## Good Example
```php
// In the consumer:
public function setDiscountCalculator(callable $calculator): void
{
    $this->discountCalculator = $calculator;
}
```
---
## Exceptions
When the single-method interface needs to be explicitly documented, tested in isolation, or used across module boundaries where type clarity is critical.
---
## Consequences Of Violation
More files to navigate, ceremony without value.
---
## Rule 4: Provide a default implementation so consumers don't have to implement every interface
---
## Category
Maintainability
---
## Rule
When defining an interface with many methods, provide a base/default class that implements reasonable defaults; consumers extend only what they need.
---
## Reason
Without defaults, every new method added to the interface forces all implementors to update, causing explosion in change surface.
---
## Bad Example
```php
interface EventHandler
{
    public function handle(Event $event): void;
    public function isSubscribedTo(Event $event): bool;
    public function onError(\Throwable $e): void;
    public function onSuccess(Event $event): void;
}
// Every implementor must write all 4 methods
```
---
## Good Example
```php
abstract class BaseEventHandler implements EventHandler
{
    public function isSubscribedTo(Event $event): bool { return true; }
    public function onError(\Throwable $e): void { /* log */ }
    public function onSuccess(Event $event): void { /* no-op */ }
}
class SpecificHandler extends BaseEventHandler
{
    public function handle(Event $event): void { /* only this needed */ }
}
```
---
## Exceptions
When the interface is intentionally minimal (0–3 methods) and defaults would add more code than they save.
---
## Consequences Of Violation
Interface change forces wide code changes, implementor fatigue.
---
## Rule 5: Don't create interfaces for value objects or DTOs
---
## Category
Architecture
---
## Rule
Value objects and data-transfer objects should be concrete final classes; they represent data, not behavior that needs swapping.
---
## Reason
Interfaces for plain data add abstraction without purpose — data never has multiple implementations.
---
## Bad Example
```php
interface MoneyInterface
{
    public function getAmount(): float;
    public function getCurrency(): string;
}
```
---
## Good Example
```php
readonly class Money
{
    public function __construct(
        public float $amount,
        public string $currency
    ) {}
}
```
---
## Exceptions
When the data structure itself can have different representations (e.g., a serialized vs. hydrated form) that require polymorphic behavior.
---
## Consequences Of Violation
Pointless abstraction, excessive files, navigation overhead.
