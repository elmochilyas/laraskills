# Restrict Facades to Controllers, Views, and Route Files
---
## Category
Architecture
---
## Rule
Limit facade usage to controllers, Blade views, and route files. Never use facades in domain services, repositories, or business logic classes.
---
## Reason
Facades provide convenient static access but hide dependencies. In business logic, dependencies must be explicit for testability, clarity, and static analysis. Controllers are thin orchestration layers where facade tradeoffs are acceptable.
---
## Bad Example
```php
class OrderRepository
{
    public function findByUser(int $userId): Collection
    {
        return Cache::remember('user.orders.'.$userId, 3600, function () {
            return Order::where('user_id', $userId)->get();
        });
    }
}
```
---
## Good Example
```php
class OrderRepository
{
    public function __construct(
        private CacheInterface $cache,
    ) {}

    public function findByUser(int $userId): Collection
    {
        return $this->cache->remember('user.orders.'.$userId, 3600, function () {
            return Order::where('user_id', $userId)->get();
        });
    }
}
```
---
## Exceptions
Facades are acceptable in controllers, route closures, Blade templates, and testing helper methods.
---
## Consequences Of Violation
Hidden dependencies in business logic; difficult testing; tight coupling to static facade API.

---

# Clear Facade State Between Tests
---
## Category
Testing
---
## Rule
Always clear facade resolved instances in test `setUp()` methods to prevent state leaking between tests.
---
## Reason
The `Facade` base class caches resolved instances in a static `$resolvedInstance` array. This static state persists across tests — if one test swaps a facade, subsequent tests may receive the swapped instance instead of the real service.
---
## Bad Example
```php
public function test_cache_returns_value(): void
{
    Cache::shouldReceive('get')->andReturn('cached');
    // No cleanup — affects other tests
}
```
---
## Good Example
```php
protected function setUp(): void
{
    parent::setUp();
    Facade::clearResolvedInstances();
}

public function test_cache_returns_value(): void
{
    Cache::shouldReceive('get')->andReturn('cached');
}
```
---
## Exceptions
When using `RefreshDatabase` or `RefreshesApplication` trait which rebuilds the application per test case.
---
## Consequences Of Violation
Flaky tests; inter-test contamination; false positives and negatives in test suite.

---

# Inject Dependencies in Business Logic, Do Not Use Facades
---
## Category
Architecture
---
## Rule
Prefer constructor injection over facades in all classes that contain business logic or domain rules.
---
## Reason
Constructor injection makes dependencies explicit in the class signature, enabling static analysis, IDE navigation, and clean test setup. Facades obscure which services a class actually depends on.
---
## Bad Example
```php
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class PaymentService
{
    public function charge(float $amount): void
    {
        $key = Config::get('services.stripe.secret');
        Log::info('Charging '.$amount);
    }
}
```
---
## Good Example
```php
class PaymentService
{
    public function __construct(
        private PaymentGateway $gateway,
        private LoggerInterface $logger,
    ) {}

    public function charge(float $amount): void
    {
        $this->logger->info('Charging '.$amount);
    }
}
```
---
## Exceptions
Facades are acceptable in controllers, route files, and Blade templates where constructor injection is impractical.
---
## Consequences Of Violation
Hidden dependencies; testing difficulty; inability to swap implementations without modifying consumers.

---

# Never Use Facade Resolution Inside Constructors
---
## Category
Reliability
---
## Rule
Never call a facade method inside a class constructor.
---
## Reason
Calling `Cache::get()` or `Log::info()` in a constructor ties resolution to global static state at construction time. This makes the class impossible to test in isolation and violates the principle of pure construction.
---
## Bad Example
```php
class OrderService
{
    public function __construct()
    {
        $this->initialized = Cache::has('app.initialized');
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private CacheInterface $cache,
    ) {}

    public function isInitialized(): bool
    {
        return $this->cache->has('app.initialized');
    }
}
```
---
## Exceptions
No common exceptions. Constructors must remain free of service access.
---
## Consequences Of Violation
Testing difficulty; global state coupling; unpredictable behavior during resolution.

---

# Use Facade::fake() Over Real Service Setup in Tests
---
## Category
Testing
---
## Rule
Always use `Facade::fake()` or `shouldReceive()` for testing facade-backed code instead of setting up real service instances.
---
## Reason
Facade faking installs a Mockery mock that provides expectations and assertions about service usage. Using real service instances couples tests to infrastructure and makes them slower and more brittle.
---
## Bad Example
```php
public function test_orders_are_cached(): void
{
    $this->get('/orders')->assertOk();
    // No assertion about caching behavior — not testing the cache usage
}
```
---
## Good Example
```php
public function test_orders_are_cached(): void
{
    Cache::shouldReceive('remember')
        ->once()
        ->andReturn(collect([]));

    $this->get('/orders')->assertOk();
}
```
---
## Exceptions
When testing the service implementation itself (integration test for the real cache driver).
---
## Consequences Of Violation
Untested facade interactions; slower tests; brittle test setup.

---

# Avoid Custom Facades for Services Used in Few Places
---
## Category
Maintainability
---
## Rule
Avoid creating custom facade classes for services that are only consumed in one or two locations.
---
## Reason
A custom facade adds a file, a class alias entry, and a static proxy without meaningful benefit when the service is used sparingly. Constructor injection is simpler and more explicit for limited-use services.
---
## Bad Example
```php
class PaymentServiceFacade extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'payment.service';
    }
}
// Used only once — unnecessary abstraction
```
---
## Good Example
```php
// Direct constructor injection instead
public function __construct(
    private PaymentService $payment,
) {}
```
---
## Exceptions
When the service is consumed across many different contexts (controllers, views, commands) and facade access significantly reduces verbosity.
---
## Consequences Of Violation
Unnecessary files; indirection; maintenance burden for facade class and alias registration.

---

# Clear Facade Roots Per-Request in Octane
---
## Category
Performance
---
## Rule
Clear facade resolved instances between requests when running Laravel Octane to prevent stale service references.
---
## Reason
Octane persists the application across requests. The Facade base class stores resolved instances in a static cache — if the underlying service should be refreshed per-request, the facade root must be cleared.
---
## Bad Example
```php
// In Octane worker — facade root never cleared
Cache::remember('key', 3600, fn() => 'value');
// Second request may return stale resolved instance
```
---
## Good Example
```php
// In a service provider or middleware
$app['events']->listen(RequestHandled::class, function () {
    Facade::clearResolvedInstances();
});
```
---
## Exceptions
When the underlying service is a singleton that should not be refreshed between requests.
---
## Consequences Of Violation
Stale service instances; cross-request state leaks; unexpected behavior in long-running processes.
