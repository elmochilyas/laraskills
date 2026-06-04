# Controller Dependency Injection

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Dependency Injection
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel's service container automatically resolves dependencies defined in controller constructors. Any class type-hinted in the constructor is instantiated and injected by the container, including repository classes, service classes, and configuration bindings. This eliminates manual instantiation and enables dependency inversion at the controller boundary.

Constructor injection is the primary mechanism for providing controllers with the services they need—repositories, loggers, HTTP clients, and domain services. Combined with Laravel's auto-resolution and binding system, controller constructors become declarative dependency manifests: what the controller needs to do its job is visible at a glance.

---

## Core Concepts

- **Auto-Resolution**: The container recursively resolves constructor parameters without explicit configuration for most classes.
- **Constructor Type-Hinting**: Any concrete class or interface in the constructor is injected automatically.
- **Contextual Binding**: Different controllers can receive different implementations of the same interface.
- **Controller Contructor Lifetime**: A controller is instantiated once per request (resolved from the container), so constructor dependencies are available for all methods.
- **Explicit vs. Implicit Binding**: Concrete classes resolve implicitly; interfaces require `app()->bind()` or `AppServiceProvider` registration.

---

## Mental Models

- **Controller as Orchestrator**: The constructor declares the orchestra (services), the methods conduct the performance.
- **Dependency Manifest**: The constructor signature is the single source of truth for what the controller depends on.
- **Lego Brick Analogy**: The controller is a brick; the constructor parameters are the studs that determine which bricks can connect.

---

## Internal Mechanics

When a route matches, the `Router` calls `ControllerDispatcher::dispatch()`. Inside, `ControllerDispatcher::resolveController()` resolves the controller instance via the container:

```php
protected function resolveController($controller, $method)
{
    return $this->container->make($controller);
}
```

The container's `make()` method uses reflection (`ReflectionClass::newInstanceArgs()`) to resolve constructor parameters recursively. For each parameter, it:

1. Checks if the type-hint is bound in the container (via `bind()`, `singleton()`, or `instance()`).
2. If not bound, tries to instantiate the concrete class (recursively resolving its own constructor).
3. If the parameter has a default value, uses that fallback.

Controllers are treated as "unshared" instances (a new instance per request), not singletons.

---

## Patterns

- **Repository Injection**:
  ```php
  class PhotoController extends Controller
  {
      public function __construct(
          private PhotoRepository $photos,
      ) {}
  }
  ```
- **Service Layer Injection**:
  ```php
  class SubscriptionController extends Controller
  {
      public function __construct(
          private SubscriptionService $subscriptions,
          private LoggerInterface $logger,
      ) {}
  }
  ```
- **Interface Binding with Contextual Resolution**:
  ```php
  // In AppServiceProvider:
  $this->app->when(PhotoController::class)
      ->needs(RepositoryInterface::class)
      ->give(fn () => new PhotoRepository(cache: true));

  $this->app->when(PostController::class)
      ->needs(RepositoryInterface::class)
      ->give(fn () => new PostRepository(cache: false));
  ```

---

## Architectural Decisions

- **Why constructor over method injection for shared dependencies?** Constructor injection instantiates the dependency once per request, available to all methods. Method injection would re-resolve the dependency on every call.
- **Why use interfaces over concrete classes in constructor?** Interface injection enables swapping implementations per controller (contextual binding), simplifies testing, and follows the Dependency Inversion Principle.
- **Why not inject Request objects in the constructor?** The `Request` is not fully initialized when the controller constructor runs. Inject it via method injection instead.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Declarative dependency listing | Constructor can become bloated with many parameters | Use action classes or service facades to group related dependencies |
| Automatic resolution | Hidden resolution failures (missing binding throws at runtime) | Test every route to catch resolution errors early |
| Contextual binding flexibility | Over-use of contextual binding creates a fragile binding graph | Prefer explicit `AppServiceProvider` registration over inline contextual bindings |

---

## Performance Considerations

- Reflection-based resolution has a one-time cost per class. After resolution, the container caches the parameter list for subsequent resolutions.
- Constructor injection has zero per-request overhead for the injection itself (it is simply PHP object construction).
- The actual cost is in the dependencies' own constructor resolution, not the injection mechanism.
- Using `app()->make()` inside controller methods instead of constructor injection bypasses the container's caching and forces re-resolution.

---

## Production Considerations

- Keep controller constructors to 3–4 dependencies max. More indicates the controller is doing too much and needs decomposition.
- Use PHP 8's constructor promotion (`private readonly Service $service`) for concise injection.
- Register all interface-to-implementation bindings in a single service provider, not scattered across the codebase.
- Run `php artisan route:list` and hit each route in a test suite to catch missing container bindings before deployment.
- Use `--parallel` test execution to catch injection errors across feature tests quickly.

---

## Common Mistakes

- **Injecting `Request` in the constructor**: Using `__construct(Request $request)` expecting the current request data.
  - *Why it happens:* Natural instinct to inject what you need.
  - *Why it's harmful:* The request is not fully initialized; properties are empty.
  - *Better approach:* Use method injection: `public function index(Request $request)`.

- **Constructor explosion (8+ parameters)**: Injecting every dependency the controller might ever need.
  - *Why it happens:* Accumulating dependencies over time without refactoring.
  - *Why it's harmful:* Hard to read, harder to test, suggests SRP violation.
  - *Better approach:* Group related dependencies into a service class or action class.

- **Using `app()` helper inside controller methods**: `$repo = app(PhotoRepository::class)` inline.
  - *Why it happens:* Convenience, avoiding constructor parameter add.
  - *Why it's harmful:* Hides dependencies, makes the controller signature misleading.
  - *Better approach:* Always declare dependencies in the constructor for visibility.

---

## Failure Modes

- **Missing binding for interface in constructor**: Container throws `BindingResolutionException` when the route is hit. *Detection:* 500 error with "Target [InterfaceName] is not instantiable." *Mitigation:* Add `app()->bind()` in `AppServiceProvider`; run feature tests for every route.

- **Circular dependency in constructor graph**: Service A needs Service B which needs Service A. *Detection:* `Maximum function nesting level of '256' reached'` or infinite loop. *Mitigation:* Use `Container::get()` with singleton or break the cycle with an interface layer.

- **Singleton vs. unshared confusion**: A dependency expected to be fresh per request is injected as a singleton and retains state. *Detection:* Unexpected data leaking between requests. *Mitigation:* Review `app()->singleton()` bindings; use `app()->scoped()` in Laravel 11+.

---

## Ecosystem Usage

- **Laravel Spark**: Injecting `SparkService` and `BillingService` into subscription controllers.
- **Laravel Nova**: Nova's resource controllers inject `ResourceValidator`, `ResourceMapper`, and other Nova-internal services.
- **Laravel Horizon**: Horizon's monitoring controllers inject `WorkloadRepository`, `JobRepository`, and `MetricsService`.

---

## Related Knowledge Units

### Prerequisites
- Service Container Fundamentals
- Controller Basics

### Related Topics
- Controller Method Injection
- Controller Form Request Integration

### Advanced Follow-up Topics
- Controller Action Delegation
- Thin Controller Enforcement

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\ControllerDispatcher::resolveController()` — controller resolution via container
- `Illuminate\Container\Container::make()` — recursive dependency resolution
- `Illuminate\Container\Container::build()` — reflection-based instantiation

### Key Insight
Controller constructor injection is standard PHP dependency injection enabled by the container, not a Laravel-specific "controller feature." Any class resolved by the container supports the same mechanism.

### Version-Specific Notes
- Constructor injection has worked identically since Laravel 5.0.
- PHP 8 constructor promotion (Laravel 8+) made controller injection significantly cleaner.
- Laravel 11's `scoped()` bindings provide per-request singleton semantics, relevant for request-scoped controller dependencies.
