# Design Acyclic Dependency Graphs
---
## Category
Architecture
---
## Rule
Always design class dependencies as a Directed Acyclic Graph with one-way dependency flow from high-level policy to low-level detail.
---
## Reason
Circular dependencies prevent the container from resolving classes — it throws `CircularDependencyException` when it detects a cycle. Acyclic graphs ensure deterministic resolution order and maintainable class relationships.
---
## Bad Example
```php
class OrderService
{
    public function __construct(private InvoiceService $invoice) {}
}

class InvoiceService
{
    public function __construct(private OrderService $orders) {} // Cycle
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(private OrderInvoiceService $orderInvoice) {}
}

class InvoiceService
{
    public function __construct(private OrderInvoiceService $orderInvoice) {}
}
// Both depend on shared abstraction — no cycle
```
---
## Exceptions
No common exceptions. Architectural cycles must always be resolved by restructuring.
---
## Consequences Of Violation
`CircularDependencyException` at resolution time; application crash; forced emergency refactoring.

---

# Extract Shared Dependencies to Break Cycles
---
## Category
Architecture
---
## Rule
When two classes depend on each other, extract the common functionality into a third class that both depend on, breaking the cycle.
---
## Reason
The only clean way to break a circular dependency is to refactor. Extracting shared logic removes the mutual dependency and creates a stable, testable three-class structure.
---
## Bad Example
```php
class OrderProcessor
{
    public function __construct(private InvoiceGenerator $invoice) {}
}

class InvoiceGenerator
{
    public function __construct(private OrderProcessor $orders) {}
}
```
---
## Good Example
```php
class OrderInvoiceService
{
    // Shared logic extracted from both
}

class OrderProcessor
{
    public function __construct(private OrderInvoiceService $service) {}
}

class InvoiceGenerator
{
    public function __construct(private OrderInvoiceService $service) {}
}
```
---
## Exceptions
No common exceptions. Structural refactoring is the correct fix for cycles.
---
## Consequences Of Violation
Persistent circular dependencies; runtime resolution failures; application instability.

---

# Use Events to Break Circular Dependencies
---
## Category
Architecture
---
## Rule
Replace direct circular calls with event dispatch and listener pattern to decouple dependent classes.
---
## Reason
Events introduce an indirect communication channel. Class A dispatches an event; Class B (a listener) responds. Neither class depends on the other directly, eliminating the cycle.
---
## Bad Example
```php
class OrderService
{
    public function __construct(private InvoiceService $invoice)
    {
        $this->invoice->generate($this); // Direct call — creates cycle potential
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function placeOrder(Order $order): void
    {
        // ... order logic ...
        Event::dispatch(new OrderPlaced($order)); // InvoiceService listens
    }
}

class SendInvoiceListener
{
    public function handle(OrderPlaced $event): void
    {
        // Generate invoice — no cycle with OrderService
    }
}
```
---
## Exceptions
When the interaction is synchronous and must be in the same transaction — consider a shared service instead.
---
## Consequences Of Violation
Persistent cycles; tight coupling between unrelated concerns.

---

# Never Use Service Locator to "Fix" Circular Dependencies
---
## Category
Architecture
---
## Rule
Never use `app()->make()` inside a method body to work around a circular dependency.
---
## Reason
Service locator usage hides the cycle rather than resolving it. The dependency is still circular — it's just resolved at a different time with no explicit declaration. This makes the cycle invisible and harder to debug.
---
## Bad Example
```php
class InvoiceService
{
    public function generate(Order $order): void
    {
        $processor = app(OrderProcessor::class); // Hidden cycle
        $processor->process($order);
    }
}
```
---
## Good Example
```php
// Extract the shared dependency instead
class OrderInvoiceService
{
    public function processOrderAndGenerateInvoice(Order $order): void
    {
        // Both order processing and invoice generation
    }
}
```
---
## Exceptions
No common exceptions. Cycles must always be resolved structurally.
---
## Consequences Of Violation
Hidden cycles; difficult debugging; testability problems; container coupling.

---

# Never Use Setter Injection to Circumvent Constructor Cycle Detection
---
## Category
Architecture
---
## Rule
Do not use setter injection to defer a circular dependency that would be detected in the constructor.
---
## Reason
Setter injection does not resolve the cycle — it merely delays the circular call. The cycle still exists at runtime and can cause infinite recursion, stack overflow, or unpredictable behavior.
---
## Bad Example
```php
class OrderService
{
    private InvoiceService $invoice;

    public function setInvoice(InvoiceService $invoice): void
    {
        $this->invoice = $invoice; // Cycle deferred but not broken
    }
}

class InvoiceService
{
    public function __construct(private OrderService $orders) {} // Still circular
}
```
---
## Good Example
```php
// Extract shared dependency instead of deferring the cycle
class ProcessingOrchestrator
{
    public function __construct(
        private OrderService $orders,
        private InvoiceService $invoice,
    ) {}
}
```
---
## Exceptions
No common exceptions. Setter injection for cycles is a band-aid, not a fix.
---
## Consequences Of Violation
Deferred-but-present cycles; infinite recursion risk; stack overflow in long-running processes.

---

# Use Static Analysis Tools to Detect Cycles Before Runtime
---
## Category
Reliability
---
## Rule
Run static analysis tools (Deptrac, PHPStan with cycle detection) in CI to catch circular dependencies before they reach production.
---
## Reason
Circular dependencies are architecturally invisible during development. They only surface at runtime when a specific resolution path triggers them. Static analysis catches cycles during CI before they can cause production issues.
---
## Bad Example
```php
// No static analysis — cycles discovered at runtime in production
```
---
## Good Example
```php
// deptrac.yaml configuration
// CI pipeline runs deptrac and fails on cycles
// vendor/bin/deptrac --formatter-graphviz-dump-image=depgraph.png
```
---
## Exceptions
No common exceptions. Cycle detection should be part of every CI pipeline.
---
## Consequences Of Violation
Runtime cycle discovery in production; emergency hotfixes; unplanned architectural refactoring.
