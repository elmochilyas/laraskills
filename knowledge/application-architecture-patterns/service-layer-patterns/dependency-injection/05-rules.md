## Use Constructor Injection For Required Dependencies
---
## Architecture
---
## Rule
Use constructor injection for all required dependencies in services and actions. Avoid method injection, service locator, or `app()` helper for regular dependencies.
---
## Reason
Constructor injection makes dependencies explicit, testable via mocking, and visible at a glance. Hidden dependencies (facades, `app()`) obscure what a class needs.
---
## Bad Example
```php
class UserService
{
    public function register(array $data): User
    {
        $mailer = app(Mailer::class); // Hidden dependency via service locator
        \Cache::put('key', 'value'); // Hidden dependency via facade
        return User::create($data);
    }
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(
        private Mailer $mailer,
        private Cache $cache,
    ) {}

    public function register(array $data): User
    {
        $this->cache->put('key', 'value');
        return User::create($data);
    }
}
```
---
## Exceptions
Method injection for truly optional or variadic dependencies. Prototype-stage code where constructor setup overhead is not justified.
---
## Consequences Of Violation
Hidden dependencies, difficult testing, untrackable coupling, brittle refactoring.

## Depend On Interfaces, Not Concrete Classes
---
## Architecture
---
## Rule
Depend on interfaces rather than concrete classes for services that may need alternative implementations. Bind the interface to the concrete implementation in a service provider.
---
## Reason
Interface-based dependency enables swapping implementations (different payment gateways, notification channels) without changing consumers, and simplifies testing with mocks.
---
## Bad Example
```php
class CheckoutService
{
    public function __construct(
        private StripePaymentGateway $gateway, // Concrete class dependency
    ) {}

    public function checkout(array $data): Order
    {
        return $this->gateway->charge($data);
    }
}
// To switch to PayPal, must change CheckoutService
```
---
## Good Example
```php
class CheckoutService
{
    public function __construct(
        private PaymentGateway $gateway, // Interface dependency
    ) {}

    public function checkout(array $data): Order
    {
        return $this->gateway->charge($data);
    }
}

// Service provider binds implementation
$this->app->bind(PaymentGateway::class, StripePaymentGateway::class);
// Switching to PayPal only changes the binding
$this->app->bind(PaymentGateway::class, PayPalPaymentGateway::class);
```
---
## Exceptions
Services with a single implementation and no planned alternative. Adding interfaces prematurely is speculative overhead (YAGNI).
---
## Consequences Of Violation
Harder to swap implementations, tighter coupling, more difficult testing with mocks.

## Avoid Facades In Injected Services
---
## Architecture
---
## Rule
Avoid using facades inside services and actions that are resolved via the container. Inject the underlying contract instead.
---
## Reason
Facades hide dependencies, making them invisible in the constructor signature. This breaks the explicit dependency contract and makes testing harder (requires `Facade::shouldReceive()`).
---
## Bad Example
```php
class UserService
{
    public function register(array $data): User
    {
        $user = User::create($data);
        Cache::put('user_count', User::count()); // Hidden facade dependency
        Log::info('User registered', ['email' => $data['email']]); // Hidden facade dependency
        return $user;
    }
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(
        private Cache $cache,
        private LoggerInterface $logger,
    ) {}

    public function register(array $data): User
    {
        $user = User::create($data);
        $this->cache->put('user_count', User::count()); // Explicit dependency
        $this->logger->info('User registered', ['email' => $data['email']]); // Explicit dependency
        return $user;
    }
}
```
---
## Exceptions
No common exceptions. Injected services should never use facades.
---
## Consequences Of Violation
Hidden dependencies, difficult testing without facades, invisible coupling to infrastructure.

## Watch For Five-Plus Constructor Dependencies
---
## Maintainability
---
## Rule
Monitor constructor dependency count. Five or more dependencies signals that the class is doing too much and should be split.
---
## Reason
Constructor dependencies count collaborators. Each additional dependency adds a responsibility and makes the class harder to test (more mocks) and harder to understand.
---
## Bad Example
```php
class RegistrationService
{
    public function __construct(
        private UserRepository $users,
        private PlanRepository $plans,
        private SubscriptionRepository $subscriptions,
        private PaymentGateway $gateway,
        private Mailer $mailer,
        private AnalyticsService $analytics,
        private AuditService $audit,
        private CacheService $cache,
    ) {}
    // 8 dependencies — clearly doing too much
}
```
---
## Good Example
```php
class RegistrationService
{
    public function __construct(
        private UserRepository $users,
        private PlanRepository $plans,
        private PaymentGateway $gateway,
        private Mailer $mailer,
    ) {}
    // 4 dependencies — focused and manageable
}

// Additional concerns handled by separate services
class AnalyticsService { /* tracking */ }
class AuditService { /* auditing */ }
```
---
## Exceptions
Infrastructure services that coordinate multiple adapters by nature (e.g., a health check service checking multiple services).
---
## Consequences Of Violation
Class with too many responsibilities, difficult testing (too many mocks), fragile constructor changes, unclear responsibility boundaries.

## No Constructor Work — Assign Only
---
## Architecture
---
## Rule
Constructors must only assign parameters. Do not perform logic, connect to services, call external APIs, or load data in constructors.
---
## Reason
Constructor work causes side effects during container resolution, makes testing difficult, and violates the principle that construction should be about setting up the object graph, not performing work.
---
## Bad Example
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
    ) {
        $this->initialize(); // Logic in constructor
        $this->connectExternalApi(); // Side effect in constructor
    }

    private function initialize(): void
    {
        $this->config = Config::get('services'); // Loading data in constructor
    }

    private function connectExternalApi(): void
    {
        $this->api = new ExternalApi(Config::get('services.api_key'));
        $this->api->connect(); // Network call in constructor
    }
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(
        private UserRepository $users,
        private ExternalApi $api,
    ) {
        // Assign only — no logic, no side effects
    }
}
```
---
## Exceptions
Validation of constructor parameters. Setting default values for optional parameters.
---
## Consequences Of Violation
Side effects during container resolution, difficult testing, hidden initialization failures, performance issues during resolution.

## Add Interfaces Only When Variation Is Needed
---
## Maintainability
---
## Rule
Add interfaces for services only when variation is needed (multiple implementations, testing with mocks, cross-module boundaries). Do not create interfaces for every class.
---
## Reason
Interface-per-class without need adds ceremony without value. It increases the number of files, requires binding configuration, and provides no benefit when only one implementation exists.
---
## Bad Example
```php
// Interface and implementation with identical signatures — no variation
interface UserServiceInterface
{
    public function register(array $data): User;
    public function updateProfile(User $user, array $data): void;
}

class UserService implements UserServiceInterface
{
    public function register(array $data): User { /* ... */ }
    public function updateProfile(User $user, array $data): void { /* ... */ }
}
// Only one implementation — interface adds zero value
```
---
## Good Example
```php
// Interface only for services with potential variation
interface PaymentGateway
{
    public function charge(PaymentInput $input): PaymentResult;
    public function refund(TransactionId $id): RefundResult;
}

class StripeGateway implements PaymentGateway { /* Stripe implementation */ }
class PayPalGateway implements PaymentGateway { /* PayPal implementation */ }

// No interface for single-implementation services
class UserService
{
    public function register(array $data): User { /* ... */ }
}
```
---
## Exceptions
Clean Architecture projects where the Dependency Rule requires interfaces at every layer boundary, regardless of implementation count.
---
## Consequences Of Violation
Unnecessary ceremony, increased file count, binding overhead, YAGNI violation.

## Avoid Circular Dependencies
---
## Reliability
---
## Rule
Avoid circular dependencies between services. If Service A depends on Service B which depends on Service A, refactor to remove the cycle by extracting shared logic.
---
## Reason
Circular dependencies cause `Laravel\SerializableClosure\Exceptions\CircularReferenceException` or infinite loops in the container. They also indicate a design flaw where responsibilities are not properly separated.
---
## Bad Example
```php
class UserService
{
    public function __construct(private OrderService $orders) {}
    public function getUser(int $id): User { /* ... */ }
}

class OrderService
{
    public function __construct(private UserService $users) {} // Circular!
    public function getOrdersByUser(int $userId): Collection
    {
        $user = $this->users->getUser($userId); // Depends on UserService
        return Order::where('user_id', $user->id)->get();
    }
}
```
---
## Good Example
```php
class UserService
{
    public function __construct(private UserRepository $users) {}
    public function getUser(int $id): User { return $this->users->find($id); }
}

class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private UserRepository $users, // Extract the shared dependency
    ) {}
    public function getOrdersByUser(int $userId): Collection
    {
        return $this->orders->findByUser($userId);
    }
}
```
---
## Exceptions
No common exceptions. Circular dependencies are always a design problem.
---
## Consequences Of Violation
Container resolution failures, infinite loops during container building, tight coupling, difficulty testing.
