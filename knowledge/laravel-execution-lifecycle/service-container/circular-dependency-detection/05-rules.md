# Circular Dependency Detection — Rules

## Break Circular Dependencies with the Factory Pattern
---
## Category
Architecture
---
## Rule
Replace one direction of a circular constructor dependency with a factory that lazily resolves the circular link.
---
## Reason
Circular dependencies (A → B → A) cannot be resolved through constructor injection — the container detects the cycle via the build stack and throws `CircularDependencyException`. A factory breaks the cycle by deferring resolution of the reverse dependency to runtime, after both services exist.
---
## Bad Example
```php
class ReportService {
    public function __construct(protected DatabaseService $db) {}
}

class DatabaseService {
    public function __construct(protected ReportService $reports) {} // Circular: A → B → A
}
// make(ReportService::class) throws CircularDependencyException
```
---
## Good Example
```php
class ReportService {
    public function __construct(
        protected DatabaseService $db,
        protected ReportFactory $reportFactory // Factory breaks the cycle
    ) {}
}

class DatabaseService {
    public function __construct(protected ReportFactory $reportFactory) {}
}

class ReportFactory {
    public function __construct(protected Container $container) {}
    public function make(): ReportService {
        return $this->container->make(ReportService::class);
    }
}
```
---
## Exceptions
No common exceptions — circular constructor dependencies always indicate a design flaw.
---
## Consequences Of Violation
Reliability: `CircularDependencyException` at resolution time. Maintainability: tangled dependency graph that prevents independent testing of either service.

---

## Avoid Using Singletons to Mask Circular Dependencies
---
## Category
Reliability
---
## Rule
Do not change a binding to `singleton()` as a strategy to bypass circular dependency detection.
---
## Reason
Singletons only mask the cycle if one of the services has already been resolved and cached before the cycle is hit. If both services are unresolved when the cycle is encountered, the singleton status provides no benefit — the build stack still detects the duplicate abstract. This creates a ticking time bomb dependent on resolution order.
---
## Bad Example
```php
// Masking the cycle with singleton — brittle and order-dependent
$this->app->singleton(ReportService::class);
$this->app->singleton(DatabaseService::class);
// If both are unresolved, cycle still detected.
// If ReportService is resolved first, DatabaseService tries to resolve ReportService again — cycle.
```
---
## Good Example
```php
// Break the cycle structurally:
$this->app->bind(ReportService::class);
$this->app->bind(DatabaseService::class);
$this->app->bind(ReportFactory::class);
// No cycle — DatabaseService depends on ReportFactory, not ReportService
```
---
## Exceptions
No common exceptions — singleton should never be a cycle-breaking strategy.
---
## Consequences Of Violation
Reliability: intermittent `CircularDependencyException` depending on resolution order. Testing: passes in unit tests but fails in production where resolution order differs.

---

## Test All Registered Bindings for Circular Dependencies in CI
---
## Category
Testing
---
## Rule
Write a CI test that resolves every registered abstract and catches `CircularDependencyException`.
---
## Reason
Circular dependencies are detected at runtime, not at registration time. A cycle introduced in a commit may go unnoticed until a specific code path triggers resolution. A dedicated CI test that resolves all bindings catches cycles immediately.
---
## Bad Example
```php
// No cycle detection test — cycle only surfaces in production
// when the specific code path is hit
```
---
## Good Example
```php
class ContainerTest extends TestCase {
    public function test_no_circular_dependencies(): void {
        $container = $this->app;

        // Collect all registered abstracts
        $abstracts = array_keys($container->getBindings());

        foreach ($abstracts as $abstract) {
            try {
                $container->make($abstract);
            } catch (CircularDependencyException $e) {
                $this->fail("Circular dependency detected: {$e->getMessage()}");
            } catch (BindingResolutionException) {
                // Skip abstracts that cannot be resolved without context
                continue;
            }
        }

        $this->assertTrue(true, 'No circular dependencies found');
    }
}
```
---
## Exceptions
Abstracts that require contextual binding or runtime parameters to resolve — skip those with documented exceptions.
---
## Consequences Of Violation
Reliability: circular dependencies reach production undetected. Debugging: must trace production exceptions without build stack context.

---

## Use Setter Injection for One Direction of a Cycle
---
## Category
Architecture
---
## Rule
Move one direction of a circular dependency from constructor injection to setter injection with a documented two-phase initialization contract.
---
## Reason
Constructor injection requires the full dependency graph at construction time. Setter injection allows one service to be constructed first, then the other is set after both exist. This breaks the cycle while keeping the dependency explicit (versus opaque service location).
---
## Bad Example
```php
class NotificationService {
    public function __construct(protected UserService $users) {}
}

class UserService {
    public function __construct(protected NotificationService $notifications) {}
    // Circular — both required in constructors
}
```
---
## Good Example
```php
class NotificationService {
    public function __construct(protected ?UserService $users = null) {}
    public function setUserService(UserService $users): void {
        $this->users = $users;
    }
}

class UserService {
    public function __construct(protected NotificationService $notifications) {}
}

// Boot-time wiring:
$notifications = $app->make(NotificationService::class);
$users = $app->make(UserService::class);
$notifications->setUserService($users);
```
---
## Exceptions
Services with strictly synchronous initialization requirements where setter injection would leave the service in an invalid state.
---
## Consequences Of Violation
Reliability: unresolved cycles that fail at runtime. Maintainability: implicit two-phase initialization if setter injection is used without documentation.

---

## Use Event-Driven Communication to Eliminate Cycles
---
## Category
Architecture
---
## Rule
Replace a circular constructor dependency with an event that one service dispatches and the other listens for.
---
## Reason
Circular dependencies often indicate that two services should communicate through an intermediary rather than direct method calls. Events decouple the services entirely — neither needs a reference to the other in its constructor.
---
## Bad Example
```php
class BillingService {
    public function __construct(protected InvoiceService $invoices) {}
    public function charge(): void {
        $this->invoices->generate($this); // Needs InvoiceService
    }
}

class InvoiceService {
    public function __construct(protected BillingService $billing) {} // Circular
}
```
---
## Good Example
```php
class BillingService {
    public function charge(): void {
        event(new PaymentProcessed($this->transaction));
    }
}

class InvoiceService {
    public function __construct(protected EventDispatcher $events) {
        $this->events->listen(PaymentProcessed::class, fn($e) => $this->generate($e));
    }
}
// No circular dependency — both depend on EventDispatcher
```
---
## Exceptions
Synchronous workflows that require immediate response from the other service within the same request/response cycle.
---
## Consequences Of Violation
Reliability: cycle exceptions or tightly coupled services that are difficult to test independently.

---

## Read the Build Stack from Bottom to Top for Cycle Root Cause
---
## Category
Maintainability
---
## Rule
When debugging a `CircularDependencyException`, read the build stack trace from bottom to top — the first repeated abstract name is the cycle point.
---
## Reason
The build stack is a push-based array: abstracts are appended as resolution proceeds. When a duplicate is detected, the last entry is the repeated abstract. Reading bottom-to-top reveals the entry point and the path through the dependency graph back to the cycle origin.
---
## Bad Example
```php
// CircularDependencyException: "Circular dependency: ReportService"
// Build stack: [CacheService, DatabaseService, ReportService, DatabaseService]
// Reading top-to-bottom: "ReportService causes the cycle" — misleading
```
---
## Good Example
```php
// CircularDependencyException: "Circular dependency: ReportService"
// Build stack: [CacheService, DatabaseService, ReportService, DatabaseService]
// Reading bottom-to-top:
//   DatabaseService at position 1 ← DatabaseService at position 3 (cycle point)
//   DatabaseService → ReportService → DatabaseService is the cycle
// Fix: break the DatabaseService → ReportService edge
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Maintainability: wasted time misidentifying the cycle source, applying fixes to the wrong edge of the dependency graph.
