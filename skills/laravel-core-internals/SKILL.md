# Laravel 13 Core Internals

## When to Use

Use this skill when you need to understand how Laravel 13 works under the hood. It covers the Service Container, Dependency Injection, Service Providers, Facades, the Request Lifecycle, and the Contract system. Apply this knowledge to write framework-aware code that is testable, swappable, and maintainable.

---

## Service Container

### How the Container Works

The Laravel Service Container is a dependency injection container that manages class dependencies and performs auto-resolution. It is the heart of the framework — every class resolved by Laravel passes through it.

```php
// The container is available as $app in service providers
// or via the app() helper in bootstrap code
$container = app();
```

### Auto-Resolution

The container can resolve classes without explicit bindings by using PHP's Reflection API to inspect constructor parameters:

```php
class UserService
{
    public function __construct(
        private UserRepository $repository,
        private LoggerInterface $logger,
    ) {}
}

// No binding needed — container auto-resolves
$service = app(UserService::class);
```

Auto-resolution works recursively. If `UserService` depends on `UserRepository`, the container resolves that too, and so on.

### Explicit Binding

#### Simple Binding (Transient)

```php
$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);

// Each resolution creates a new instance
$gateway1 = app(PaymentGatewayInterface::class);
$gateway2 = app(PaymentGatewayInterface::class);
// $gateway1 !== $gateway2
```

#### Singleton Binding

```php
$this->app->singleton(PaymentClient::class);

// Same instance every resolution
$client1 = app(PaymentClient::class);
$client2 = app(PaymentClient::class);
// $client1 === $client2
```

Use singletons for:
- API clients with connection pooling
- Configuration services
- Cache adapters
- External SDK wrappers

#### Scoped Binding (Laravel 11+)

```php
$this->app->scoped(TenantContext::class);

// Same instance within a request lifecycle
$context1 = app(TenantContext::class);
$context2 = app(TenantContext::class);
// $context1 === $context2 within same request
```

Use scoped for:
- Tenant context data
- Request-scoped state
- User session data
- Transaction contexts

Critical for **Laravel Octane** — scoped bindings reset between requests, singletons persist across requests.

#### Binding with Factory

```php
$this->app->bind(SearchServiceInterface::class, function (Application $app) {
    $config = $app->make(SearchConfig::class);
    return new MeilisearchService($config->host(), $config->apiKey());
});
```

### Contextual Binding

When different consumers need different implementations of the same interface:

```php
use Illuminate\Container\Container;

$this->app->when(AdminController::class)
    ->needs(PaymentGatewayInterface::class)
    ->give(StripeGateway::class);

$this->app->when(ApiController::class)
    ->needs(PaymentGatewayInterface::class)
    ->give(PaypalGateway::class);
```

Contextual binding also works with primitive values:

```php
$this->app->when(ReportGenerator::class)
    ->needs('$chunkSize')
    ->give(500);

$this->app->when(ApiReportGenerator::class)
    ->needs('$chunkSize')
    ->give(50);
```

Use cases:
- **Multi-tenancy** — different DB connections per tenant
- **Multi-provider** — different payment, SMS, or email providers per context
- **Environment-specific** — different config values per environment

### Tagged Services

Tag services for plugin-style architectures:

```php
$this->app->tag([
    StripeGateway::class,
    PaypalGateway::class,
    MollieGateway::class,
], 'payment-gateways');

// Retrieve all tagged services
$gateways = app()->tagged('payment-gateways');

foreach ($gateways as $gateway) {
    $gateway->process($payment);
}
```

Use tags for:
- Payment providers
- Notification channels
- Report exporters
- Data importers
- Event handlers
- Feature modules

### Container Events

The container fires events during resolution:

```php
// Called before any object resolution
$this->app->resolving(function (object $object, Application $app) {
    if ($object instanceof UsesLogger) {
        $object->setLogger($app->make(LoggerInterface::class));
    }
});

// Called when a specific type is resolved
$this->app->resolving(SearchServiceInterface::class, function (SearchServiceInterface $service, Application $app) {
    $service->setCache($app->make(CacheInterface::class));
});

// Called after resolution completes
$this->app->afterResolving(SearchServiceInterface::class, function (SearchServiceInterface $service) {
    // Post-resolution setup
});
```

### Binding Interfaces to Implementations

```php
// In a service provider
public function register(): void
{
    $this->app->bind(
        PaymentGatewayInterface::class,
        StripeGateway::class
    );

    $this->app->singleton(
        CacheInterface::class,
        RedisCacheService::class
    );
}
```

### Extending Bindings

After a binding is resolved, extend it:

```php
$this->app->extend(CacheInterface::class, function (CacheInterface $cache, Application $app) {
    return new LoggingCacheDecorator($cache, $app->make(LoggerInterface::class));
});
```

---

## Dependency Injection

### Constructor Injection (Preferred)

Always inject via constructor in services, actions, repositories:

```php
class CreateOrderAction
{
    public function __construct(
        private OrderRepository $repository,
        private InventoryService $inventory,
        private PaymentGatewayInterface $gateway,
        private LoggerInterface $logger,
    ) {}

    public function execute(CreateOrderDTO $dto): Order
    {
        $this->logger->info('Creating order', ['email' => $dto->email]);
        $this->inventory->reserve($dto->items);
        return $this->repository->create($dto->toArray());
    }
}
```

### Method Injection

Allowed in controllers, commands, jobs, event listeners, and middleware:

```php
// Controller method injection
public function store(
    StoreUserRequest $request,
    CreateUserAction $action,
): JsonResponse
{
    return UserResource::make($action->execute($request->validated()));
}

// Command
public function handle(UserRepository $repository): int
{
    // ...
}

// Event listener
public function handle(OrderPlaced $event, MailService $mail): void
{
    // ...
}
```

### Maximum Dependency Rule

A class should rarely exceed 5 constructor dependencies.

```php
// Too many — refactor
public function __construct(
    private Service1 $s1,
    private Service2 $s2,
    private Service3 $s3,
    private Service4 $s4,
    private Service5 $s5,
    private Service6 $s6,
) {}
```

Signs of excessive dependencies:
- **God Class** — doing too much
- **Responsibility Leakage** — handling concerns that belong elsewhere
- **Testing Pain** — too many mocks needed

**Fix:** group related dependencies into facades/services, or split the class.

### Forbidden in Business Code

```php
// NEVER do these in domain/business code:
$service = new UserService();              // Hard instantiation
app(UserService::class);                   // Service locator
resolve(UserService::class);               // Service locator
App::make(UserService::class);             // Service locator
```

These make code untestable and couple it to the container. **Exceptions** exist in:
- Service Providers (where bindings are registered)
- Stubs and factory definitions
- Laravel-specific bootstrap files

---

## Service Providers

### Register vs Boot Lifecycle

```php
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Only container bindings here
        $this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
        $this->app->singleton(SearchClient::class);
        $this->app->tag([...], 'notifications');
    }

    public function boot(): void
    {
        // Runtime configuration after ALL providers have registered
        View::share('appName', config('app.name'));
        Route::pattern('id', '[0-9]+');
        Event::listen(OrderPlaced::class, SendOrderConfirmation::class);
    }
}
```

**Critical rules:**
- `register()` — only bindings. No application logic, no DB queries, no routes.
- `boot()` — runtime config. All provider `register()` methods run before any `boot()`.

### Deferred Providers

For expensive services that may never be used in a given request:

```php
use Illuminate\Contracts\Support\DeferrableProvider;

class AIServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(AIClient::class, function () {
            return new AIClient(config('ai.api_key'));
        });
    }

    public function provides(): array
    {
        return [AIClient::class];
    }
}
```

Deferred providers are only loaded when one of the provided types is actually resolved. Use for:
- AI/ML clients
- Payment SDKs
- Search engine clients
- Large reporting engines
- Heavy infrastructure integrations

### Provider Organization

**Small applications:**
```php
// config/app.php — providers array
App\Providers\AppServiceProvider::class,
App\Providers\EventServiceProvider::class,
```

**Large applications (domain-driven):**
```
app/Providers/
├── BillingServiceProvider.php
├── NotificationServiceProvider.php
├── ReportingServiceProvider.php
├── SearchServiceProvider.php
└── AIServiceProvider.php
```

Each provider owns a single domain concern.

### Dynamic Provider Loading

```php
// Conditionally load providers
if ($this->app->environment('production')) {
    $this->app->register(ProductionOptimizationProvider::class);
}

if (config('services.braintree.enabled')) {
    $this->app->register(BraintreeServiceProvider::class);
}
```

### Boot Order

Providers are loaded in `config/app.php` order. Deferred providers load on demand. All `register()` methods complete before any `boot()` method runs.

```
1. All providers: register()  → only bindings
2. All providers: boot()      → runtime config
3. Application ready
```

---

## Facades

### How Facades Work

A Facade is a class that provides a static-like interface to a service resolved from the container:

```php
// This:
Cache::put('key', 'value', 3600);

// Is equivalent to:
app('cache')->put('key', 'value', 3600);
```

Each facade has a `getFacadeAccessor()` method that returns the container key or class name:

```php
class Cache extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'cache'; // Resolves app('cache') from container
    }
}
```

### Allowed Facade Usage

Facades are acceptable for infrastructure concerns:

```php
Cache::put('key', 'value', 3600);
Log::info('Order processed', ['order_id' => $order->id]);
DB::transaction(fn () => ...);
Event::dispatch(new OrderPlaced($order));
Queue::push(new SendEmail($user));
```

### Forbidden Facade Usage in Business Logic

```php
class OrderService
{
    public function process(Order $order): void
    {
        // BAD — hidden dependencies, untestable without swapping facades
        Cache::put('order_' . $order->id, $order);
        Log::info('Processing order');
        Event::dispatch(new OrderProcessing($order));
    }
}
```

### Preferred Alternative — Inject Contracts

```php
class OrderService
{
    public function __construct(
        private CacheInterface $cache,
        private LoggerInterface $logger,
    ) {}

    public function process(Order $order): void
    {
        $this->cache->set('order_' . $order->id, $order);
        $this->logger->info('Processing order');
    }
}
```

This makes dependencies explicit and testable with mocks.

### Hidden Dependency Rule

Every dependency a class needs must be visible through its constructor. Facades hide dependencies, making code hard to test and refactor.

### Facade Testing

```php
// Fake a facade
Cache::shouldReceive('get')
    ->with('key')
    ->once()
    ->andReturn('cached-value');

// Swap facade implementation
Event::fake();
Event::assertDispatched(OrderPlaced::class);

Http::fake([
    'https://api.example.com/*' => Http::response(['status' => 'ok'], 200),
]);

Queue::fake();
Bus::fake();
Mail::fake();
Notification::fake();
Storage::fake();
```

### Custom Facades

Only create custom facades when building packages or framework abstractions:

```php
use Illuminate\Support\Facades\Facade;

class Search extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return SearchServiceInterface::class;
    }
}
```

**Avoid custom facades in standard application code** — use dependency injection instead.

### Facade Anti-Patterns Summary

| Pattern | Status | Reason |
|---------|--------|--------|
| Facade in controllers | Occasionally OK | Controllers are thin, facades for Log/Cache are readable |
| Facade in services | Forbidden | Hidden dependencies, untestable |
| Facade in actions | Forbidden | Violates single responsibility, coupling |
| Custom facades in apps | Avoid | Use DI instead |
| Custom facades in packages | Allowed | Needed for Laravel convention |

---

## Request Lifecycle

### Full Lifecycle

```
Request
  ↓
public/index.php
  ↓
HTTP Kernel (Illuminate\Foundation\Http\Kernel)
  ↓
Global Middleware Stack
  ↓
Route Matching
  ↓
Route-Specific Middleware
  ↓
Controller Dispatch
  ↓
Business Logic (Action / Service)
  ↓
Response Generation
  ↓
Response Sent to Browser
```

### Middleware Configuration (Laravel 11+)

Since Laravel 11, middleware is configured in `bootstrap/app.php` instead of an `App\Http\Kernel` class.

```php
// bootstrap/app.php
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global middleware — runs on EVERY request
        $middleware->append(\Illuminate\Http\Middleware\TrustHosts::class);
        $middleware->append(\Illuminate\Http\Middleware\TrustProxies::class);
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);

        // Route-group middleware
        $middleware->group('web', [
            \Illuminate\Cookie\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        $middleware->group('api', [
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // Route middleware aliases
        $middleware->alias([
            'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
            'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
            'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
            'can' => \Illuminate\Auth\Middleware\Authorize::class,
            'guest' => \Illuminate\Auth\Middleware\RedirectIfAuthenticated::class,
            'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
            'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
            'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
```

### Global Middleware

Use only for cross-cutting infrastructure concerns:
- Security headers (HSTS, CSP)
- Request logging
- Maintenance mode detection
- CORS handling
- Trusted proxies
- Input sanitization (TrimStrings, ConvertEmptyStringsToNull)

### Route Middleware

Use for domain-specific concerns:
- Authentication (`auth`)
- Authorization (`can`, `can:update,post`)
- Rate limiting (`throttle:60,1`)
- Subscription checks
- Tenant loading
- Feature flags

### Middleware Pipeline Mechanics

Laravel uses `Illuminate\Pipeline\Pipeline` to pass the request through middleware:

```php
// Pseudocode of how the pipeline works
$response = (new Pipeline($this->app))
    ->send($request)
    ->through($middleware)
    ->then(function ($request) {
        return $this->router->dispatch($request);
    });
```

Each middleware can:
- Pass the request deeper (`return $next($request)`)
- Modify the request before passing it
- Return a response early (short-circuit)
- Modify the response after it returns

```php
class AddCustomHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        // Before: modify request
        $request->attributes->set('start_time', microtime(true));

        $response = $next($request);

        // After: modify response
        $response->headers->set('X-Duration', microtime(true) - $request->attributes->get('start_time'));

        return $response;
    }
}
```

### Route Resolution

Laravel matches the incoming request URI against registered routes:

```php
// Route matching order:
// 1. Static routes (/about, /contact)
// 2. Parameterized routes (/users/{user})
// 3. Regex routes
// 4. Fallback route
```

**Route Model Binding** (preferred):

```php
// Implicit binding — user ID from route parameter
Route::get('/users/{user}', function (User $user) {
    return $user;
});

// Explicit binding — custom resolution
Route::bind('user', function (string $value) {
    return User::where('uuid', $value)->firstOrFail();
});

// Scoped binding — nested resource
Route::get('/users/{user}/posts/{post}', function (User $user, Post $post) {
    return $post;
})->scopeBindings();
```

**Avoid** manual resolution in controllers:

```php
// BAD
public function show(string $id): User
{
    return User::findOrFail($id);
}

// GOOD
public function show(User $user): User
{
    return $user;
}
```

### Controller Dispatching

The resolved route calls the controller method with method injection:

```php
// The router:
// 1. Resolves controller from container (with DI)
// 2. Inspects method parameters via reflection
// 3. Injects type-hinted dependencies from container
// 4. Resolves route parameters
// 5. Calls the method
// 6. Converts return value to a Response

public function store(
    StoreUserRequest $request,  // Container resolves + validates
    CreateUserAction $action,   // Container resolves with DI
): UserResource                 // Return value → Response conversion
{
    return new UserResource($action->execute($request->validated()));
}
```

### Response Generation

Laravel automatically converts return values to HTTP responses:

```php
// String → Response with string body
return 'Hello World';

// Array → JSON Response
return ['user' => $user];

// Eloquent Model → Eloquent serialization
return $user;

// API Resource → JSON:API structure
return new UserResource($user);

// Response object → sent directly
return response()->json(['data' => $user], 201);
return response()->file($pathToFile);
return response()->download($pathToFile);
return redirect('/dashboard');
```

### Full Request Lifecycle Code Walkthrough

```php
// 1. public/index.php — entry point
$app = require __DIR__ . '/../bootstrap/app.php';

// 2. Kernel handles the request through the pipeline
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// 3. Response sent to browser
$response->send();

// 4. Terminable middleware called
$kernel->terminate($request, $response);
```

---

## Contracts

### Interface-First Architecture

Design business services against contracts (interfaces), not concrete implementations:

```php
namespace App\Contracts;

interface PaymentGatewayInterface
{
    public function charge(int $amount, array $paymentData): PaymentResult;
    public function refund(string $transactionId, int $amount): PaymentResult;
    public function getTransaction(string $id): TransactionDetails;
}
```

Implementations are swappable:

```php
namespace App\Infrastructure\Payment;

class StripeGateway implements PaymentGatewayInterface
{
    public function charge(int $amount, array $paymentData): PaymentResult { /* ... */ }
    public function refund(string $transactionId, int $amount): PaymentResult { /* ... */ }
    public function getTransaction(string $id): TransactionDetails { /* ... */ }
}

class PaypalGateway implements PaymentGatewayInterface
{
    public function charge(int $amount, array $paymentData): PaymentResult { /* ... */ }
    public function refund(string $transactionId, int $amount): PaymentResult { /* ... */ }
    public function getTransaction(string $id): TransactionDetails { /* ... */ }
}
```

The container decides which implementation is used:

```php
// config/app.php or ServiceProvider
$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);

// Swap environments
if (config('app.env') === 'testing') {
    $this->app->bind(PaymentGatewayInterface::class, FakePaymentGateway::class);
}
```

### When to Create Interfaces

Create interfaces when:

| Condition | Example |
|-----------|---------|
| Multiple implementations exist | `PaymentGateway`, `Cache`, `Mailer` |
| Future implementations expected | `SmsProvider`, `SearchEngine` |
| External services may change | `GeoLocationApi`, `MapsProvider` |
| Testing requires mocking | All of the above |

Do NOT create interfaces when only one implementation exists and is unlikely to change:

```php
// BAD — unnecessary abstraction
interface UserServiceInterface {}
class UserService implements UserServiceInterface {}

// GOOD — just the class
class UserService {}
```

### Laravel Core Contracts

Laravel provides contracts for most core services. Use them instead of facades:

```php
use Illuminate\Contracts\Cache\Repository as CacheInterface;
use Illuminate\Contracts\Mail\Mailer as MailerInterface;
use Illuminate\Contracts\Queue\Queue as QueueInterface;
use Illuminate\Contracts\Bus\Dispatcher as BusDispatcherInterface;
use Illuminate\Contracts\Log\Log as LogInterface;
use Illuminate\Contracts\Filesystem\Filesystem as FilesystemInterface;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcherInterface;

class OrderService
{
    public function __construct(
        private CacheInterface $cache,
        private MailerInterface $mailer,
        private LogInterface $logger,
        private EventDispatcherInterface $events,
    ) {}
}
```

### Liskov Substitution Principle

Every implementation of an interface must behave consistently:

```php
// BAD — inconsistent contract
interface PaymentGatewayInterface
{
    public function refund(string $transactionId): RefundResult;
}

class StripeGateway implements PaymentGatewayInterface
{
    public function refund(string $transactionId): RefundResult
    {
        return RefundResult::success();
    }
}

class PaypalGateway implements PaymentGatewayInterface
{
    public function refund(string $transactionId): RefundResult
    {
        throw new \Exception('PayPal does not support refunds');
    }
}
```

**The contract is broken.** Either all implementations support refund, or the interface needs redesign.

### Swappable Implementations

Controllers and services must never know which implementation is in use:

```php
class PaymentController
{
    public function __construct(
        private PaymentGatewayInterface $gateway, // Could be Stripe, PayPal, or test fake
    ) {}

    public function charge(ChargeRequest $request): JsonResponse
    {
        $result = $this->gateway->charge(
            amount: $request->validated('amount'),
            paymentData: $request->validated('payment'),
        );

        return response()->json($result->toArray());
    }
}
```

### Testing with Contracts

```php
// Fake implementation for testing
class FakePaymentGateway implements PaymentGatewayInterface
{
    public array $charges = [];
    public array $refunds = [];

    public function charge(int $amount, array $paymentData): PaymentResult
    {
        $this->charges[] = ['amount' => $amount, 'data' => $paymentData];
        return PaymentResult::success('txn_fake_' . uniqid());
    }

    public function refund(string $transactionId, int $amount): PaymentResult
    {
        $this->refunds[] = ['id' => $transactionId, 'amount' => $amount];
        return PaymentResult::success();
    }

    public function getTransaction(string $id): TransactionDetails
    {
        return new TransactionDetails(/* ... */);
    }
}

// In test
test('payment controller charges successfully', function () {
    $this->app->instance(PaymentGatewayInterface::class, new FakePaymentGateway);

    $response = $this->postJson('/api/payments', [
        'amount' => 5000,
        'payment' => ['token' => 'tok_test'],
    ]);

    $response->assertStatus(201);
});
```

---

## Architecture Flow

### Required Architecture

```
Controller  (thin — validation, auth, response)
    ↓
Action      (orchestration, single responsibility)
    ↓
Domain Service  (business logic)
    ↓
Contract    (interface)
    ↓
Infrastructure  (Stripe, Eloquent, Mailgun, etc.)
    ↓
Database / External API
```

### Example End-to-End

```php
// 1. Controller — thin, no business logic
class CreatePaymentController
{
    public function __invoke(
        CreatePaymentRequest $request,
        ProcessPaymentAction $action,
    ): PaymentResource
    {
        $dto = CreatePaymentDTO::fromRequest($request->validated());
        $payment = $action->execute($dto);
        return new PaymentResource($payment);
    }
}

// 2. Action — orchestrates the workflow
class ProcessPaymentAction
{
    public function __construct(
        private PaymentGatewayInterface $gateway,
        private OrderRepository $orders,
        private PaymentRepository $payments,
        private EventDispatcherInterface $events,
    ) {}

    public function execute(CreatePaymentDTO $dto): Payment
    {
        $order = $this->orders->findOrFail($dto->orderId);
        $result = $this->gateway->charge($dto->amount, $dto->paymentData);
        $payment = $this->payments->createFromResult($order, $result);
        $this->events->dispatch(new PaymentCompleted($payment));
        return $payment;
    }
}

// 3. Contract
interface PaymentGatewayInterface
{
    public function charge(int $amount, array $data): PaymentResult;
}

// 4. Infrastructure
class StripeGateway implements PaymentGatewayInterface
{
    public function charge(int $amount, array $data): PaymentResult
    {
        $charge = \Stripe\Charge::create([
            'amount' => $amount,
            'currency' => 'usd',
            'source' => $data['token'],
        ]);
        return PaymentResult::fromStripe($charge);
    }
}

// 5. Container binding in ServiceProvider
$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
```

### Forbidden Architecture

```
Controller
    ↓
Model (direct DB query)
    ↓
Database
```

Or:

```
Controller (business logic, email sending, payment processing)
```

### SOLID Principles Applied to Laravel

| Principle | Laravel Application |
|-----------|-------------------|
| **S**ingle Responsibility | Each Action/Service has one reason to change |
| **O**pen/Closed | Extend via new implementations, not modification |
| **L**iskov Substitution | All payment gateways behave the same way |
| **I**nterface Segregation | Small, focused contracts (not one giant interface) |
| **D**ependency Inversion | Business code depends on contracts, not infrastructure |

---

## Enterprise Laravel Checklist

Before merging any code, verify:

- [ ] No business logic in controllers
- [ ] No `app()`, `resolve()`, or `new` in business code (use DI)
- [ ] All dependencies are explicit via constructor injection
- [ ] Interfaces exist wherever multiple implementations are possible
- [ ] Middleware has a single responsibility
- [ ] Route model binding used instead of manual `findOrFail`
- [ ] API Resources used instead of returning models directly
- [ ] Service Providers follow register/boot separation
- [ ] Facades never used in business logic
- [ ] Maximum 5 constructor dependencies per class
- [ ] Classes respect Single Responsibility Principle
- [ ] Architecture follows Controller → Action → Domain → Infrastructure
- [ ] All dependencies are testable (mockable via interfaces)
- [ ] Deferred providers used for expensive services
- [ ] Contextual binding used where consumers need different implementations

Failure to meet any of these is an **architectural violation** requiring refactoring before deployment.

## References

- See skill: `laravel-patterns` for Actions, DTOs, and Eloquent patterns
- See skill: `laravel-tdd` for testing containers, facades, and contracts
- See rule: `rules/laravel/service-container.md` for container best practices
- See rule: `rules/laravel/service-providers.md` for provider guidelines
- See rule: `rules/laravel/facades.md` for facade usage rules
- See rule: `rules/laravel/contracts.md` for contract design rules
- See rule: `rules/laravel/middleware.md` for middleware pipeline rules
- See rule: `rules/laravel/architecture.md` for architecture flow rules
