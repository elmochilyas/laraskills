## Rule 1: Add abstraction only when a clear, concrete need for the second implementation exists
---
## Category
Architecture
---
## Rule
Do not extract interfaces, factories, strategies, or visitors in anticipation of future needs you cannot demonstrate today.
---
## Reason
Speculative abstraction increases complexity, code volume, and maintenance burden without delivering any current value. YAGNI (You Ain't Gonna Need It).
---
## Bad Example
```php
// Extracted "in case we switch payment providers"
interface PaymentGateway
{
    public function charge(Money $amount): ChargeResult;
}
// Only one implementation, no plan to add another
```
---
## Good Example
```php
// Concrete class. Extract interface only when 2nd provider is confirmed.
class StripeGateway
{
    public function charge(Money $amount): ChargeResult { /* ... */ }
}
```
---
## Exceptions
Published library/package interfaces where the contract must be stable for external consumers.
---
## Consequences Of Violation
Unnecessary complexity, code bloat, YAGNI violation.
---
## Rule 2: Prove an abstraction's value by showing concrete before/after metrics
---
## Category
Architecture
---
## Rule
When proposing an abstraction, demonstrate: (a) it reduces complexity, (b) it simplifies testing, or (c) it enables a required change that is impossible without it.
---
## Reason
Abstractions that don't measurably improve the codebase add cost without benefit; metrics provide an objective decision criterion.
---
## Bad Example
```
"I think we should abstract all repositories behind interfaces."
"Why?" "Because it's cleaner."
No measurable benefit identified.
```
---
## Good Example
```
"We need to switch from Eloquent to Doctrine for the write model.
Strategy: Introduce OrderRepository interface.
Benefit: Swap implementation without touching domain logic.
Cost: 1 new interface, 2 implementations."
```
---
## Exceptions
When the abstraction is so trivial (1 interface, 1 implementation) that the cost is negligible and the benefit of consistent convention is clear.
---
## Consequences Of Violation
Abstract complexity without justification.
---
## Rule 3: Prefer duplication over the wrong abstraction
---
## Category
Architecture
---
## Rule
If two pieces of code happen to look similar but serve different business purposes and evolve separately, leave them duplicated rather than prematurely unifying.
---
## Reason
Prematurely unifying similar-but-different code creates a rigid abstraction that is wrong for both use cases, requiring frequent workarounds.
---
## Bad Example
```php
// "These two handlers look similar, let's unify"
abstract class BaseOrderHandler
{
    abstract protected function handle(Order $order): void;
    public function execute(Order $order): void
    {
        $this->validate($order);
        $this->authorize($order);
        $this->handle($order);
        $this->notify($order);
    }
} // Now both handlers must follow this exact flow, even when one doesn't need some steps
```
---
## Good Example
```php
// Duplication is acceptable — they evolve independently
class RefundHandler { /* independent flow */ }
class ShipmentHandler { /* entirely different flow */ }
```
---
## Exceptions
When the duplication is in a truly generic utility (date formatting, validation helpers) that is conceptually stable.
---
## Consequences Of Violation
Wrong abstraction, workarounds, increased complexity.
---
## Rule 4: Wait for the third occurrence before extracting a generic solution
---
## Category
Architecture
---
## Rule
As a heuristic, wait until a pattern occurs at least three times before extracting a shared abstraction.
---
## Reason
The third occurrence reveals the true variation points; extracting after two occurrences often produces an abstraction that doesn't fit the third case.
---
## Bad Example
```
UserRepository and OrderRepository share a "findByName" method.
→ Extract BaseRepository with findByName.
Third repository: ProductRepository findByName doesn't match — now fight the abstraction.
```
---
## Good Example
```
Three repositories all have similar "findBySlug" logic.
→ Extract SlugRepositoryTrait.
The third occurrence confirmed the pattern is real.
```
---
## Exceptions
Security-related logic where even two occurrences should be unified to avoid security gaps.
---
## Consequences Of Violation
Abstraction that doesn't fit the third use case, wasted extraction.
---
## Rule 5: Remove an abstraction that is no longer pulling its weight
---
## Category
Maintainability
---
## Rule
If an interface or abstraction has only one implementation and no planned second implementation, remove the abstraction and collapse into the concrete class.
---
## Reason
Dead abstractions are cognitive overhead; removing them simplifies navigation, reduces files, and makes the code more direct.
---
## Bad Example
```
// Originally had StripeGateway and PaypalGateway
// Paypal removed. Still: interface PaymentGateway + class StripeGateway implements PaymentGateway
// No plan for replacement
```
---
## Good Example
```
// Collapse interface into concrete class
class StripeGateway { /* concrete, no interface */ }
```
---
## Exceptions
Published library interfaces where removing it would break external consumers.
---
## Consequences Of Violation
Unnecessary abstraction, navigation overhead, misleading code structure.
