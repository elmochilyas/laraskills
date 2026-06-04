# Type-Hint Interfaces Over Concrete Classes in Constructors
---
## Category
Architecture
---
## Rule
Prefer interface type-hints over concrete class type-hints in constructor parameters when the implementation should be swappable.
---
## Reason
Interface bindings enable the container to resolve different implementations without modifying the consumer. Concrete type-hints couple the class to a specific implementation, making substitution impossible without changing the consumer's code.
---
## Bad Example
```php
public function __construct(
    private EloquentUserRepository $users, // Tight coupling to Eloquent
) {}
```
---
## Good Example
```php
public function __construct(
    private UserRepositoryInterface $users, // Loosely coupled — swappable
) {}
```
---
## Exceptions
When the concrete class is a stable utility with no reasonable alternative implementation.
---
## Consequences Of Violation
Tight coupling; testing difficulty; inability to substitute implementations without modifying the consumer.

---

# Keep Constructors Pure — No Side Effects
---
## Category
Reliability
---
## Rule
Never perform I/O, database queries, API calls, or service resolution inside a constructor.
---
## Reason
Constructor injection causes constructor execution during container resolution, which can happen at unexpected times (queue serialization, config loading, provider registration). Side effects make resolution unpredictable and break test isolation.
---
## Bad Example
```php
public function __construct(private LoggerInterface $logger)
{
    $this->logger->info('Service constructed'); // Side effect
}
```
---
## Good Example
```php
public function __construct(private LoggerInterface $logger) {}

public function execute(): void
{
    $this->logger->info('Service executing');
}
```
---
## Exceptions
No common exceptions. Constructors must only accept and assign dependencies.
---
## Consequences Of Violation
Unexpected side effects; test instability; queue serialization failures; unpredictable resolution order.

---

# Limit Constructor Parameters to 4
---
## Category
Maintainability
---
## Rule
Limit constructor parameters to 4 or fewer. Refactor classes with more by grouping related dependencies into higher-level services.
---
## Reason
Each parameter represents a distinct concern. Excessive parameters indicate the class has too many responsibilities (SRP violation) and is harder to test, maintain, and reason about.
---
## Bad Example
```php
public function __construct(
    private OrderRepository $orders,
    private PaymentGateway $payment,
    private LoggerInterface $logger,
    private MailService $mail,
    private AnalyticsService $analytics,
) {}
```
---
## Good Example
```php
public function __construct(
    private OrderRepository $orders,
    private PaymentGateway $payment,
    private NotificationService $notifications, // Groups mail + analytics + logger
) {}
```
---
## Exceptions
Orchestrator classes (controllers, service facades) may require more in specific cases with documented rationale.
---
## Consequences Of Violation
SRP violation; testing difficulty; maintainability debt; resistance to change.

---

# Never Use app() in Constructors
---
## Category
Maintainability
---
## Rule
Never call `app()`, `resolve()`, or `Container::make()` inside a constructor.
---
## Reason
Calling `app()` in a constructor creates hidden dependencies invisible in the class signature. This breaks the explicit dependency contract and makes the class impossible to test without container configuration.
---
## Bad Example
```php
public function __construct()
{
    $this->cache = app(CacheInterface::class); // Hidden dependency
}
```
---
## Good Example
```php
public function __construct(
    private CacheInterface $cache, // Explicit, visible
) {}
```
---
## Exceptions
No common exceptions. All dependencies must be declared as constructor parameters.
---
## Consequences Of Violation
Hidden dependencies; container coupling; testing difficulty; violated explicit contract.

---

# Prefer Readonly Promoted Properties
---
## Category
Code Organization
---
## Rule
Use PHP 8.3+ promoted constructor properties with the `readonly` modifier for all injected dependencies.
---
## Reason
Promoted properties eliminate boilerplate declaration and assignment. Adding `readonly` enforces immutability — the dependency cannot be reassigned after construction.
---
## Bad Example
```php
private LoggerInterface $logger;

public function __construct(LoggerInterface $logger)
{
    $this->logger = $logger;
}
```
---
## Good Example
```php
public function __construct(
    private readonly LoggerInterface $logger,
) {}
```
---
## Exceptions
When PHP 8.3+ readonly promotion is not available in the target environment.
---
## Consequences Of Violation
Boilerplate code; potential for unintended reassignment of injected dependencies.

---

# Use Default Values for Optional Dependencies
---
## Category
Reliability
---
## Rule
Provide `= null` default for nullable constructor parameters that should not block resolution when no binding exists.
---
## Reason
Without a default value, the container treats a nullable parameter as optional only in type — it still throws if resolution fails. A default value gives the container a graceful fallback path.
---
## Bad Example
```php
public function __construct(
    private ?LoggerInterface $logger, // No default — resolution may still fail
) {}
```
---
## Good Example
```php
public function __construct(
    private ?LoggerInterface $logger = null, // Graceful fallback
) {}
```
---
## Exceptions
When the dependency is strictly required and the class cannot function without it.
---
## Consequences Of Violation
Runtime `BindingResolutionException` when no binding exists for the optional dependency.

---

# Avoid Circular Dependencies via Constructor Injection
---
## Category
Architecture
---
## Rule
Design dependency graphs as Directed Acyclic Graphs — never let two classes inject each other via their constructors.
---
## Reason
Constructor injection creates eager resolution. If A depends on B and B depends on A, the container detects the cycle and throws `CircularDependencyException`. The only fix is structural refactoring.
---
## Bad Example
```php
class OrderService
{
    public function __construct(private InvoiceService $invoice) {}
}

class InvoiceService
{
    public function __construct(private OrderService $orders) {} // Cycle!
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
No common exceptions. Cycles must be resolved by restructuring, not by band-aids like lazy resolution.
---
## Consequences Of Violation
`CircularDependencyException` at resolution time; application crash; difficult debugging.
