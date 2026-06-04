# Type-Hint Interfaces Over Concretions
---
## Category
Architecture
---
## Rule
Always type-hint interfaces rather than concrete classes in constructor parameters when the implementation should be swappable.
---
## Reason
Interface type-hints enable the container to resolve different implementations without changing the consumer. Concrete type-hints create tight coupling — swapping the implementation requires modifying every class that type-hints it.
---
## Bad Example
```php
class OrderService
{
    public function __construct(
        private EloquentUserRepository $users, // Concrete — hard to swap
    ) {}
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private UserRepositoryInterface $users, // Interface — swappable
    ) {}
}
```
---
## Exceptions
When the class is a concrete utility with no reasonable alternative implementation (e.g., a specific SDK wrapper).
---
## Consequences Of Violation
Tight coupling; testing difficulty; inability to swap implementations without modifying consumers.

---

# Keep Constructors Pure — No Side Effects
---
## Category
Reliability
---
## Rule
Never perform I/O, database queries, HTTP calls, or service resolution inside a constructor.
---
## Reason
Constructor injection means the constructor runs when the container resolves the class — which may happen during queue serialization, configuration loading, or other unexpected times. Side effects make resolution unpredictable and complicate testing.
---
## Bad Example
```php
class OrderService
{
    public function __construct(private LoggerInterface $logger)
    {
        $this->logger->info('OrderService created'); // Side effect in constructor
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(private LoggerInterface $logger) {}

    public function process(Order $order): void
    {
        $this->logger->info('Processing order', ['id' => $order->id]);
    }
}
```
---
## Exceptions
No common exceptions. Constructors must only accept and assign dependencies.
---
## Consequences Of Violation
Unexpected side effects during resolution; test instability; queue serialization failures.

---

# Never Use app() Inside Class Constructors
---
## Category
Maintainability
---
## Rule
Never call `app()`, `resolve()`, or `App::make()` inside a class constructor to obtain dependencies not declared as parameters.
---
## Reason
Calling `app()` inside a constructor creates hidden dependencies invisible in the class signature. This breaks the explicit dependency contract that constructor injection provides, making the class harder to test and refactor.
---
## Bad Example
```php
class OrderService
{
    public function __construct()
    {
        $this->users = app(UserRepositoryInterface::class); // Hidden dependency
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private UserRepositoryInterface $users, // Visible, explicit dependency
    ) {}
}
```
---
## Exceptions
No common exceptions for business logic classes. Service providers' `boot()` methods may use the container for framework operations.
---
## Consequences Of Violation
Hidden dependencies; difficult testing; container coupling; inability to instantiate outside Laravel context.

---

# Limit Constructor Parameters to 4 or Fewer
---
## Category
Maintainability
---
## Rule
Limit constructor parameters to 4 or fewer. When a class requires 5+ dependencies, refactor by grouping related services or splitting the class.
---
## Reason
Each constructor parameter represents a distinct concern the class is coupled to. Excessive parameters violate the Single Responsibility Principle and indicate the class does too much.
---
## Bad Example
```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $payment,
        private LoggerInterface $logger,
        private MailService $mail,
        private AnalyticsService $analytics,
        private CacheInterface $cache,
    ) {}
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $payment,
        private NotificationService $notifications, // Groups mail + analytics + logger
    ) {}
}
```
---
## Exceptions
Orchestrator classes (controllers, service facades) may require more dependencies in specific cases — document the rationale.
---
## Consequences Of Violation
Maintainability debt; difficulty in testing; violation of SRP; resistance to change.

---

# Use Readonly Promoted Properties
---
## Category
Code Organization
---
## Rule
Prefer `readonly` promoted constructor properties for all injected dependencies.
---
## Reason
Promoted properties reduce boilerplate by combining declaration, assignment, and visibility in a single syntax. Adding `readonly` enforces immutability — no part of the class can reassign the dependency after construction.
---
## Bad Example
```php
class OrderService
{
    protected LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {}
}
```
---
## Exceptions
When PHP 8.3+ readonly promotion is not available or when a dependency needs reassignment (rare — indicates design issue).
---
## Consequences Of Violation
Boilerplate code; potential for unintended reassignment of injected dependencies.

---

# Provide Default Values for Optional Dependencies
---
## Category
Reliability
---
## Rule
Use `?Type $dependency = null` syntax for constructor parameters that should not block resolution when no binding exists.
---
## Reason
Without a nullable type and default value, the container treats the parameter as required and throws `BindingResolutionException` if it cannot resolve it. The `= null` pattern gives the container a graceful fallback.
---
## Bad Example
```php
class ReportService
{
    public function __construct(
        private ?LoggerInterface $logger, // Nullable but no default — resolution may fail
    ) {}
}
```
---
## Good Example
```php
class ReportService
{
    public function __construct(
        private ?LoggerInterface $logger = null, // Graceful fallback
    ) {}
}
```
---
## Exceptions
When the dependency is strictly required and class instantiation without it is invalid.
---
## Consequences Of Violation
`BindingResolutionException` when no binding exists for an optional dependency.

---

# Avoid Wide Type-Hints Like Container
---
## Category
Architecture
---
## Rule
Never inject `Container $container` as a constructor dependency to pull other services inside methods.
---
## Reason
Accepting the container in the constructor is a disguised service locator. It hides the class's true dependencies, makes the contract invisible, and prevents static analysis from understanding what the class actually needs.
---
## Bad Example
```php
class OrderService
{
    public function __construct(private Container $container) {}

    public function process(Order $order): void
    {
        $payment = $this->container->make(PaymentGateway::class);
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private PaymentGateway $payment,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order->total);
    }
}
```
---
## Exceptions
In service providers and framework-level code where the container is legitimately needed for registration logic.
---
## Consequences Of Violation
Hidden dependencies; violated explicit contract; difficult testing; container coupling.
