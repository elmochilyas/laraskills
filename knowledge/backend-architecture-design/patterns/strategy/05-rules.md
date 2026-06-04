## Rule 1: Replace conditional logic with Strategy for varying behavior
---
## Category
Architecture
---
## Rule
When an operation has multiple variants selected by a condition (switch/if-else), extract each variant into a Strategy class implementing a common interface.
---
## Reason
Conditional logic for variants violates OCP and scatters variant logic; Strategy encapsulates each variant in its own class.
---
## Bad Example
```php
class OrderService
{
    public function calculateDiscount(string $type, Money $total): Money
    {
        return match($type) {
            'vip' => $total->multiplyBy(0.9),
            'employee' => $total->multiplyBy(0.8),
            'seasonal' => $total->multiplyBy(0.85),
            default => $total,
        };
    }
}
```
---
## Good Example
```php
interface DiscountStrategy
{
    public function calculate(Money $total): Money;
}

class VipDiscount implements DiscountStrategy { /* ... */ }
class EmployeeDiscount implements DiscountStrategy { /* ... */ }
class SeasonalDiscount implements DiscountStrategy { /* ... */ }
```
---
## Exceptions
When the condition is a simple boolean check that is unlikely to grow.
---
## Consequences Of Violation
OCP violation, scattered conditionals, difficult to extend.
---
## Rule 2: Strategies should be stateless and statelessly composable
---
## Category
Architecture
---
## Rule
Strategy implementations should hold no mutable state. All data needed for the calculation should be passed as parameters.
---
## Reason
Stateful strategies cause concurrency issues, make testing harder, and are difficult to reuse across contexts.
---
## Bad Example
```php
class ProgressiveDiscount implements DiscountStrategy
{
    private Money $totalSpent; // mutable state

    public function setTotalSpent(Money $amount): void { /* ... */ }
    public function calculate(Money $total): Money { /* uses totalSpent */ }
}
```
---
## Good Example
```php
class ProgressiveDiscount implements DiscountStrategy
{
    public function calculate(Money $total, Money $totalSpent): Money
    {
        // all data passed as parameters
    }
}
```
---
## Exceptions
When the strategy needs to accumulate state across calls (rare and should be documented).
---
## Consequences Of Violation
Concurrency bugs, testing difficulty, implicit state dependencies.
---
## Rule 3: Inject Strategies via constructor—let the caller choose
---
## Category
Architecture
---
## Rule
The class that uses a Strategy should receive it via constructor injection, allowing the caller to choose which strategy to use.
---
## Reason
Hard-coded strategies in the consumer defeat the pattern's purpose of runtime flexibility.
---
## Bad Example
```php
class OrderService
{
    private DiscountStrategy $discount;

    public function __construct()
    {
        $this->discount = new NoDiscount(); // hard-coded
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private DiscountStrategy $discount // injected
    ) {}
}
```
---
## Exceptions
When the strategy is determined by configuration (DI container decides which implementation to inject).
---
## Consequences Of Violation
No runtime flexibility, hard-coded behavior.
---
## Rule 4: Prefer Strategy over inheritance for varying behavior
---
## Category
Architecture
---
## Rule
When behavior varies, compose with Strategy rather than creating subclass hierarchies for each variation.
---
## Reason
Inheritance creates rigid hierarchies; Strategy via composition allows mixing, matching, and testing independently.
---
## Bad Example
```php
abstract class Order { abstract function calculateDiscount(): Money; }
class VipOrder extends Order { /* ... */ }
class EmployeeOrder extends Order { /* ... */ }
```
---
## Good Example
```php
class Order
{
    public function __construct(
        private DiscountStrategy $discount
    ) {}
}
```
---
## Exceptions
When the varying behavior shares significant state/implementation with the base class (Template Method).
---
## Consequences Of Violation
Deep inheritance hierarchies, inflexible combinations.
