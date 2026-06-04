## Rule 1: Prefer content coupling → stamp coupling → data coupling (lowest to highest coupling)
---
## Category
Architecture
---
## Rule
Design modules to use only data coupling (passing only necessary data) or stamp coupling (passing a data structure); avoid control coupling, common coupling, and content coupling.
---
## Reason
Higher coupling levels make modules harder to change, test, and reuse—content coupling means changing one module requires changing its consumer.
---
## Bad Example
```php
// Content coupling — modifying another module's internal state
$order->status = 'cancelled';  // accessing private property
```
---
## Good Example
```php
// Data coupling — passing only required data
$order->cancel($reason);  // well-defined interface
```
---
## Exceptions
Framework internals (e.g., Eloquent model property access) where the framework's coupling is an accepted cost of using it.
---
## Consequences Of Violation
Brittle code, unexpected side effects, difficult refactoring.
---
## Rule 2: Measure and track efferent coupling (Ce) per class or module; flag values above 10
---
## Category
Maintainability
---
## Rule
Run coupling analysis tools (PHPStan, PhpMetrics) to measure Ce per class; classes with Ce > 10 depend on too many other classes and should be refactored.
---
## Reason
High Ce means a class is tightly coupled to many collaborators, making it fragile—any change in any collaborator can force a change in it.
---
## Bad Example
```php
class OrderReportController
{
    public function __construct(
        private OrderRepository $r1,
        private UserRepository $r2,
        private BillingService $s1,
        private Mailer $m1,
        private PdfGenerator $p1,
        private Config $c1,
        private Cache $c2,
        private Logger $l1,
        private EventDispatcher $e1,
        private Metrics $m2,
        private NotificationService $n1
        // Ce = 11 → too many dependencies
    ) {}
}
```
---
## Good Example
```php
class OrderReportController
{
    public function __construct(
        private OrderReportService $service // facade over many deps
    ) {}
}
```
---
## Exceptions
Infrastructure classes (service providers, middleware) that naturally orchestrate many dependencies.
---
## Consequences Of Violation
Brittle classes, testing burden, excessive constructor injection.
---
## Rule 3: Measure fan-out (Ce) and fan-in (Ca) per module; modules with low fan-in and high fan-out are unstable
---
## Category
Architecture
---
## Rule
Compute Instability (I = Ce / (Ce + Ca)) per module; unstable modules (I close to 1) with high Ce should be stabilized or extracted.
---
## Reason
Unstable modules that many other modules depend on (high Ca) cause widespread breakage when they change; modules with high Ce and low Ca are volatile.
---
## Bad Example
```
Module "Billing": Ce = 15, Ca = 1, I = 0.94 (very unstable)
Changes in Billing don't affect many others, but Billing breaks when any of its 15 deps change.
```
---
## Good Example
```
Module "Billing": Ce = 3, Ca = 1, I = 0.25
Interface extracted, dependencies minimized, stable.
```
---
## Exceptions
Orchestrator/entry-point modules that naturally have high Ce (e.g., Controllers) where stability is handled by making them thin.
---
## Consequences Of Violation
Unstable modules causing frequent breakage.
---
## Rule 4: Break cyclic dependencies between modules immediately
---
## Category
Architecture
---
## Rule
Use dependency analysis to detect cycles between modules; resolve by extracting an interface, introducing events, or moving shared code to a lower-level module.
---
## Reason
Cyclic dependencies create inseparable modules—you cannot change one without considering the other, and they cannot be extracted independently.
---
## Bad Example
```
Module A → Module B → Module C → Module A
No module can be tested, changed, or extracted independently.
```
---
## Good Example
```
Module A → Module B → Module C
Module A → Module D (new extracted interface)
Acyclic → independent modules.
```
---
## Exceptions
Bidirectional relationships that represent a genuine partnership pattern (documented in ADR).
---
## Consequences Of Violation
Distributed monolith, impossible module extraction, fragile system.
---
## Rule 5: Use the Law of Demeter to reduce coupling depth
---
## Category
Architecture
---
## Rule
A method should only call methods on: itself, its parameters, objects it creates, its own fields. Never "chain" through multiple objects.
---
## Reason
Chains (e.g., `$order->getCustomer()->getAddress()->getCity()`) couple the caller to the entire object graph, violating encapsulation.
---
## Bad Example
```php
$city = $order->getCustomer()->getAddress()->getCity();
// Coupled to: Order, Customer, Address structures
```
---
## Good Example
```php
$city = $order->getShippingCity(); // encapsulates the chain
// Only coupled to Order's public interface
```
---
## Exceptions
Fluent interfaces explicitly designed for chaining (Query Builder, collection pipelines).
---
## Consequences Of Violation
Train-wreck code, deep coupling, encapsulation violation.
