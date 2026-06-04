# Limit Constructor Parameters to 4 or Fewer
---
## Category
Maintainability
---
## Rule
Keep constructor parameters to 4 or fewer. Refactor classes with 5+ by grouping related services or splitting the class.
---
## Reason
Each parameter represents a distinct concern. Excessive parameters indicate the class violates the Single Responsibility Principle — it is coupled to too many abstractions and does too much.
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
Orchestrator classes (controllers, service facades) with documented justification may exceed 4 parameters.
---
## Consequences Of Violation
SRP violation; testing difficulty; maintainability debt; resistance to change.

---

# Never Fix Over-Injection by Switching to Service Locator
---
## Category
Architecture
---
## Rule
Never replace constructor injection with `app()` calls to reduce the constructor parameter count.
---
## Reason
Switching to `app()` hides the dependency count but does not reduce the class's responsibilities. The class still does too much — the dependencies are just invisible. Testing becomes harder because dependencies are hidden in method bodies.
---
## Bad Example
```php
class OrderService
{
    public function process(Order $order): void
    {
        $payment = app(PaymentGateway::class);     // Hidden
        $mail = app(MailService::class);            // Hidden
        $logger = app(LoggerInterface::class);      // Hidden
        // Class still has too many responsibilities
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
        private NotificationService $notifications,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order->total);
        $this->notifications->send($order);
    }
}
```
---
## Exceptions
No common exceptions. Over-injection must be solved by refactoring, not by hiding.
---
## Consequences Of Violation
Hidden dependencies; testing difficulty; SRP violation remains unaddressed.

---

# Group Related Dependencies into Higher-Level Abstractions
---
## Category
Architecture
---
## Rule
When a class requires multiple related low-level services, group them into a single higher-level service or parameter object.
---
## Reason
Related dependencies (e.g., logger + metrics + mail) often change together and serve a common purpose. Grouping them reduces parameter count while maintaining explicit dependency visibility.
---
## Bad Example
```php
public function __construct(
    private LoggerInterface $logger,
    private MetricsCollector $metrics,
    private MailService $mail,
    private NotificationService $notifications,
) {}
```
---
## Good Example
```php
public function __construct(
    private InfrastructureService $infrastructure, // Groups logger + metrics + mail
    private NotificationService $notifications,
) {}
```
---
## Exceptions
When the dependencies are genuinely unrelated and a grouping abstraction would be unnatural.
---
## Consequences Of Violation
Excessive parameter counts; obscured cohesion between related services.

---

# Do Not Use Container as a Single Dependency to Avoid Listing All Dependencies
---
## Category
Architecture
---
## Rule
Never accept `Container $container` as a constructor parameter to avoid listing all dependencies individually.
---
## Reason
Injecting the container is the worst form of over-injection — it hides all dependencies behind a single parameter, makes every service call invisible, and prevents static analysis from understanding class requirements.
---
## Bad Example
```php
class OrderService
{
    public function __construct(private Container $container) {}

    public function process(Order $order): void
    {
        $payment = $this->container->make(PaymentGateway::class);
        $logger = $this->container->make(LoggerInterface::class);
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
        private LoggerInterface $logger,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order->total);
        $this->logger->info('Order processed');
    }
}
```
---
## Exceptions
No common exceptions. Container injection in business logic is always a design flaw.
---
## Consequences Of Violation
All dependencies hidden; impossible to unit test without container; static analysis blind.

---

# Use Parameter Count as a Code Review Trigger
---
## Category
Maintainability
---
## Rule
Flag any class with 5+ constructor parameters during code review and require justification or refactoring.
---
## Reason
A constructor parameter count of 5+ is a reliable heuristic for over-injection. Making it a review gate ensures the design is intentional rather than accidental.
---
## Bad Example
```php
// 6 parameters — should be flagged and refactored before merge
public function __construct(
    private A $a, private B $b, private C $c,
    private D $d, private E $e, private F $f,
) {}
```
---
## Good Example
```php
// 3 parameters — clean, manageable
public function __construct(
    private A $a,
    private GroupedService $grouped, // B, C, D grouped
    private E $e,
) {}
```
---
## Exceptions
No common exceptions for the 5-parameter threshold. Use it as a warning, not an absolute ban.
---
## Consequences Of Violation
SRP debt accumulates; refactoring becomes more expensive as the class grows.

---

# Do Not Bundle Unrelated Dependencies
---
## Category
Maintainability
---
## Rule
Group only dependencies that change together and serve a common purpose. Never bundle unrelated services into a generic parameter object.
---
## Reason
Unrelated dependencies bundled together create a "miscellaneous" service that is unclear, untestable, and violates the principle of cohesive abstractions. A logger and a payment gateway should not be in the same group.
---
## Bad Example
```php
class MiscServices
{
    public function __construct(
        public LoggerInterface $logger,     // Not related to payment
        public PaymentGateway $payment,     // Not related to logging
    ) {}
}
```
---
## Good Example
```php
class NotificationService
{
    public function __construct(
        public LoggerInterface $logger,     // Related — notifications involve logging
        public MailService $mail,           // Related — primary notification channel
    ) {}
}
```
---
## Exceptions
No common exceptions. Groupings must be semantically cohesive.
---
## Consequences Of Violation
Unnatural coupling between unrelated services; confusion about class responsibility.
