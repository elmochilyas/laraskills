# Laravel Facade System

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Laravel Facade System
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02
- **ECC Phase:** 4

---

## Overview

Laravel facades provide a static proxy interface to services bound in the container. `Cache::get('key')` resolves to `$app['cache']->get('key')` at runtime. The `Facade` base class uses `__callStatic()` to dispatch static method calls to resolved container instances. Facades are registered as global class aliases via `class_alias()` during the `RegisterFacades` bootstrap step. They offer concise, readable access to framework services at the cost of creating implicit dependencies that are invisible in method signatures.

---

## Core Concepts

1. **Facade Base Class** — All facades extend `Illuminate\Support\Facades\Facade` and implement `getFacadeAccessor()` returning the container binding key. The facade class itself contains no logic — it is a thin routing layer.

2. **Runtime Resolution via __callStatic** — When a static method is called on a facade, PHP triggers `Facade::__callStatic()`, which calls `getFacadeRoot()` → `resolveFacadeInstance()` → `$app->make($accessor)`, then forwards the method call to the resolved service instance.

3. **Facade Alias Registration** — Facades are registered as class aliases via `class_alias()` during the `RegisterFacades` bootstrap step. The alias map comes from `config/app.php` `aliases` array. This allows `Cache::get()` instead of `Illuminate\Support\Facades\Cache::get()`.

4. **Resolved Instance Caching** — Once resolved, the service instance is cached in `Facade::$resolvedInstance[$accessor]`. Subsequent calls through the same facade skip container resolution entirely.

5. **Real-Time Facades** — Any class can be used as a facade by prefixing `Facades\` to its namespace: `Facades\App\Services\PaymentService::process($order)`. This is equivalent to `app(PaymentService::class)->process($order)`.

6. **Facade Caching** — `php artisan optimize` compiles facade aliases into `bootstrap/cache/packages.php`, avoiding per-request `class_alias()` calls.

---

## When To Use

- **Well-known framework services** — `Cache`, `DB`, `Log`, `Route`, `Config`, `Session`, `Auth`, `Storage`, `Queue` — services used pervasively where constructor injection would add noise
- **Controller and view code** — Facades keep HTTP-layer code concise when the dependency is clear and the context is well-understood
- **Prototyping and simple operations** — When speed of writing code matters more than test isolation
- **Custom services with clear accessor** — When creating a custom facade for a service that is used across many classes in the same context

---

## When NOT To Use

- **Application services with test-critical behavior** — Prefer constructor injection for services that are mocked in tests; static mocking through facades is less explicit
- **Service provider register() methods** — The container may not be fully configured during provider registration; facades rely on `Facade::setFacadeApplication()` which runs during `RegisterFacades` bootstrap
- **Every class in the application** — Using real-time facades for every service creates hidden dependencies throughout the codebase
- **Constructor-injected dependencies** — Mixing facade calls with injected dependencies in the same class creates inconsistent dependency patterns
- **Business logic layer (services, actions, domain objects)** — These classes benefit from explicit dependencies visible in their signatures

---

## Best Practices (WHY)

1. **Prefer facades for framework services, injection for application services** — Framework services (`Cache`, `Log`, `Config`) are stable, well-understood, and unlikely to be swapped. Application services (`PaymentService`, `UserRepository`) change behavior and need visible, testable dependencies. This distinction keeps the convenience where it's safe.

2. **Avoid facades in constructors** — `$this->cache = Cache::get('prefix')` in a constructor creates tight coupling to the facade at instantiation time. Use constructor injection for values needed at construction and facades (or injection) for methods.

3. **Use shouldReceive() with explicit expectations** — Partial mocks (`Cache::partialMock()`) may miss unexpected calls. `Cache::shouldReceive('get')->once()->andReturn('value')` provides explicit expectations that fail tests when the mocked method is called with unexpected arguments.

4. **Reset facade state between tests** — Facade mocks are stored in `Facade::$resolvedInstance`. Without `Mockery::close()` in `tearDown()` (provided by PHPUnit integration), mock state leaks between tests. Use `parent::tearDown()` or add mock cleanup.

5. **Register custom facades in config/app.php** — Do not rely on package auto-discovery for application facades. Add the facade alias explicitly to the `aliases` array in `config/app.php` for discoverability and explicit registration.

6. **Use IDE helper for autocompletion** — Facades use `__callStatic()` which is opaque to static analysis. Run `php artisan ide-helper:generate` to generate `@method` annotations. Without this, IDEs cannot resolve facade method calls.

---

## Architecture Guidelines

### Facade vs Helper vs Injection

| Concern | Facade | Constructor Injection | Helper |
|---|---|---|---|
| Syntax | `Cache::get('k')` | `$cache->get('k')` | `cache('k')` |
| Implicit dependencies | Yes | No | Yes |
| IDE autocompletion | Limited (via @method) | Full | Limited |
| Testability | Static mocking | Constructor mocks | Static mocking |
| Dependency visibility | Hidden | Explicit (signature) | Hidden |
| Refactoring risk | Low (rename facade) | Low (change type hint) | Low (change function) |

### Decision Framework

```
Is this a well-known framework service (Cache, Log, Config, DB)?
├── Yes → Is it used in a business logic class (Service, Action)?
│   ├── Yes → Use constructor injection
│   └── No → Facade is acceptable (controller, view, event)
└── No → Is it an application service?
    ├── Yes → Constructor injection
    └── No → Consider the tradeoff; prefer injection for testability
```

### Custom Facade Registration
```php
// app/Facades/Payment.php
use Illuminate\Support\Facades\Facade;
class Payment extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'payment';
    }
}

// config/app.php
'aliases' => [
    'Payment' => App\Facades\Payment::class,
]
```

---

## Performance

- Facade resolution cost: ~0.001ms per call after the first (cached in `$resolvedInstance`)
- First call per facade per request: ~0.01-0.05ms (container resolution)
- `class_alias()` calls during `RegisterFacades` bootstrap: negligible, optimized by `php artisan optimize`
- Real-time facades incur the same resolution cost as standard facades

---

## Security

- Facades resolve through the container — ensure the underlying service is properly bound and does not expose privileged operations
- Do NOT use facades to access services that perform authorization checks without passing the authenticated user context
- Facade aliases registered via `class_alias()` are global — ensure custom facade names do not collide with existing class names
- Real-time facades (`Facades\Prefix`) resolve any class from the container — be cautious with classes that have side effects in their constructors

---

## Common Mistakes

### Facade in Constructor
- **Description:** `$this->cache = Cache::get('prefix')` inside a constructor
- **Cause:** Treating facades like static utility classes rather than proxy interfaces
- **Consequence:** Tight coupling to facade; constructor cannot be tested without facade mocking; value resolved at instantiation time
- **Better:** Pass resolved values via constructor injection or use facade calls within methods

### Mock Pollution Between Tests
- **Description:** Mock state from one test leaks to the next
- **Cause:** `Mockery::close()` not called in `tearDown()`
- **Consequence:** Subsequent tests receive stale mock expectations, causing unexpected failures or false passes
- **Better:** Ensure `parent::tearDown()` is called or add `Mockery::close()` explicitly in test cleanup

### Real-Time Facade Overuse
- **Description:** Using `Facades\App\Services\PaymentService::process()` for every service call
- **Cause:** Convenience without considering dependency visibility
- **Consequence:** Every service call becomes an implicit dependency; refactoring requires finding all facade usages in function bodies
- **Better:** Reserve real-time facades for prototyping or leaf operations; use constructor injection for regular production code

### Missing Class Alias Registration
- **Description:** `Cache` class not found error at runtime
- **Cause:** Facade alias not registered in `config/app.php` `aliases` array, or auto-discovery not configured
- **Consequence:** PHP throws `Class "Cache" not found`
- **Better:** Add the alias to `config/app.php` or use the fully qualified namespace with `use` statement

---

## Anti-Patterns

- **Hidden Dependencies** — A class that uses 5 facades in its methods has 5 hidden dependencies. The class signature reveals nothing about what services it needs. This makes testing, refactoring, and reasoning about the class harder.
- **Facade Chains** — `Cache::tags(Config::get('cache.prefix'))->remember(..., function() { return DB::table(...)... })` — mixing facades in expressions creates code that is hard to read, test, and debug.
- **Inconsistent Access Pattern** — Using facades for some services and injection for others in the same class without a clear rationale. Choose one pattern per class based on the class role (controller vs service vs action).
- **Facades in Package Code** — Writing Laravel packages that call facades internally. Package code should use constructor injection or container resolution to allow consumers to swap implementations.

---

## Examples

### Standard Facade Usage
```php
// Controller — facade is acceptable
class PostController extends Controller
{
    public function index(): View
    {
        $posts = Cache::remember('posts.all', 3600, fn() => Post::all());
        return view('posts.index', compact('posts'));
    }
}

// Service — constructor injection preferred
class PostService
{
    public function __construct(
        private CacheContract $cache,
    ) {}
}
```

### Testing with Facades
```php
// Explicit mock with expectation
Cache::shouldReceive('get')
    ->once()
    ->with('posts.all')
    ->andReturn(collect([]));

// Partial mock
Cache::partialMock()
    ->shouldReceive('get')
    ->andReturn('value');
```

### Real-Time Facade (Use Sparingly)
```php
use Facades\App\Services\PaymentService;

// Equivalent to: app(PaymentService::class)->process($order)
PaymentService::process($order);
```

### Custom Facade
```php
use Illuminate\Support\Facades\Facade;

class Payment extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'payment';
    }
}
```

---

## Related Topics

- **Service Container Basics** — facades resolve through the container
- **Bootstrapping Lifecycle** — facade alias registration during `RegisterFacades` bootstrap
- **Service Provider Strategies** — providers register the services facades resolve
- **Helper Functions** — alternative static access pattern for container services
- **Testing** — facade mocking techniques and state cleanup

---

## AI Agent Notes

- `Illuminate\Support\Facades\Facade` is the base class (~200 lines)
- `__callStatic()` is the core dispatch mechanism
- `class_alias()` is called during `RegisterFacades` bootstrap step
- Real-time facades use a dynamic accessor derived from the class name with `Facades\` prefix
- Facade mock reset is handled by `Mockery::close()` in PHPUnit's `tearDown()`
- The `shouldReceive()` method on facades forwards to the underlying Mockery mock
- When asked about facades vs injection: default recommendation is injection for custom application services, facades for framework infrastructure services
- IDE helper is essential for facade discoverability — suggest running `php artisan ide-helper:generate`

---

## Verification

- [ ] Understands how `__callStatic()` routes facade calls to container services
- [ ] Can explain the difference between facades, helpers, and constructor injection
- [ ] Knows when to use facades vs constructor injection
- [ ] Understands how facade aliases are registered and cached
- [ ] Can write and interpret facade tests (shouldReceive, partialMock)
- [ ] Understands real-time facade mechanics
- [ ] Can identify and fix common mistakes (constructor usage, mock pollution, missing aliases)
- [ ] Knows how IDE helper improves facade developer experience
