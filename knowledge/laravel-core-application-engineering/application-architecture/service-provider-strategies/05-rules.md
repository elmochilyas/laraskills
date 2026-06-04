# Service Provider Strategies — Rules

## Keep register() Thin — Only Container Bindings

Restrict `register()` methods to container binding calls only. No resolution, no side effects, no business logic.

---

## Category

Architecture

---

## Rule

Service provider `register()` methods must only contain `$this->app->bind()`, `$this->app->singleton()`, `$this->app->instance()`, `$this->app->tag()`, and `$this->app->scoped()` calls. Do not call `$this->app->make()`, facades, helpers, or any service resolution.

---

## Reason

The two-phase provider contract guarantees all `register()` calls complete before any `boot()` begins. Resolving services during `register()` returns potentially partially initialized instances. Keeping `register()` thin makes container bindings easy to audit.

---

## Bad Example

```php
public function register(): void
{
    $this->app->singleton(ReportingService::class);
    $service = $this->app->make(ReportingService::class);
    $service->initialize(); // resolution and side effect in register()
}
```

---

## Good Example

```php
public function register(): void
{
    $this->app->singleton(ReportingService::class);
}

public function boot(ReportingService $service): void
{
    $service->initialize();
}
```

---

## Exceptions

No common exceptions. The register-only-bindings rule is invariant.

---

## Consequences Of Violation

Services resolved in partially initialized state, unpredictable failures when provider order changes, hard-to-debug bootstrap bugs.

---

## Use Method Injection in boot()

Declare service dependencies as type-hinted parameters in `boot()` instead of calling `$this->app->make()` manually.

---

## Category

Design

---

## Rule

In `boot()` methods, declare dependencies as type-hinted parameters. The container will inject them automatically via `$this->app->call()`.

---

## Reason

Method injection is cleaner, makes dependencies explicit in the method signature, and avoids manual `$this->app->make()` calls. The container resolves all parameters at call time, ensuring they are fully initialized.

---

## Bad Example

```php
public function boot(): void
{
    $cache = $this->app->make(CacheContract::class);
    $cache->tags(['config'])->flush();
}
```

---

## Good Example

```php
public function boot(CacheContract $cache): void
{
    $cache->tags(['config'])->flush();
}
```

---

## Exceptions

When `boot()` needs conditional dependencies that depend on runtime conditions, manual resolution with `$this->app->make()` is acceptable.

---

## Consequences Of Violation

Manual resolution clutters provider code, dependencies are less visible, inconsistent with framework patterns.

---

## Defer Providers for Services Not Used on Every Request

Mark service providers as deferred when their bound services are not needed on the majority of requests.

---

## Category

Performance

---

## Rule

Set `protected $defer = true` and implement `provides()` for providers whose services are used on less than 80% of requests. Keep providers eager only when their services must be available on every request.

---

## Reason

Deferred providers avoid instantiation, register, and boot cost until the service is first resolved. For services used infrequently, this eliminates bootstrap overhead entirely, reducing bootstrap time by 30-70%.

---

## Bad Example

```php
class PdfExportServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PdfExporter::class);
    }
    // No $defer — loads on every request
}
```

---

## Good Example

```php
class PdfExportServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function register(): void
    {
        $this->app->singleton(PdfExporter::class);
    }

    public function provides(): array
    {
        return [PdfExporter::class];
    }
}
```

---

## Exceptions

Do not defer providers whose services are resolved on 80%+ of requests. The deferred resolution overhead is not justified when the provider loads on nearly every request anyway.

---

## Consequences Of Violation

2-5ms additional bootstrap time per request for unused services, unnecessary memory allocation, increased startup time.

---

## Implement provides() for Every Deferred Provider

Every deferred provider must implement `provides()` returning an array of all bound abstract names.

---

## Category

Reliability

---

## Rule

When a provider has `protected $defer = true`, it must implement a `provides()` method that returns an array of all abstract names the provider binds. The `provides()` method must include every abstract passed to `bind()`, `singleton()`, or `instance()`.

---

## Reason

The deferred provider manifest maps service abstracts to their provider classes. Without `provides()`, the manifest cannot know which provider to instantiate when a deferred service is resolved, resulting in a `BindingResolutionException`.

---

## Bad Example

```php
class MailServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function register(): void
    {
        $this->app->singleton(Mailer::class, MailManager::class);
    }
    // Missing provides() — service not found when resolved
}
```

---

## Good Example

```php
class MailServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function register(): void
    {
        $this->app->singleton(Mailer::class, MailManager::class);
    }

    public function provides(): array
    {
        return [Mailer::class, MailManager::class];
    }
}
```

---

## Exceptions

Eager providers (without `$defer = true`) do not need `provides()`.

---

## Consequences Of Violation

`BindingResolutionException` when the service is resolved at runtime, service not found errors in production, services unavailable despite being registered.

---

## Organize Providers by Domain or Bounded Context

Use one service provider per domain or bounded context in modular and domain-driven applications.

---

## Category

Code Organization

---

## Rule

Create separate service providers for each domain or bounded context (e.g., `BillingServiceProvider`, `SalesServiceProvider`, `UsersServiceProvider`). Do not register all bindings in a single monolithic provider.

---

## Reason

Domain-scoped providers provide clear ownership boundaries, enable selective registration (a domain can be disabled or swapped), make dependencies visible at the domain level, and enable per-domain deferred loading.

---

## Bad Example

```php
// app/Providers/AppServiceProvider.php — registers everything
public function register(): void
{
    $this->app->bind(OrderRepository::class, ...);
    $this->app->bind(PaymentGateway::class, ...);
    $this->app->singleton(InventoryService::class);
    $this->app->bind(UserRepository::class, ...);
    // 50+ bindings from different domains
}
```

---

## Good Example

```php
// app/Providers/BillingServiceProvider.php
public function register(): void
{
    $this->app->bind(PaymentGateway::class, StripeGateway::class);
}

// app/Providers/SalesServiceProvider.php
public function register(): void
{
    $this->app->bind(OrderRepository::class, EloquentOrderRepository::class);
}

// app/Providers/UsersServiceProvider.php
public function register(): void
{
    $this->app->bind(UserRepository::class, ...);
}
```

---

## Exceptions

Small applications with fewer than 10 total bindings may use a single `AppServiceProvider`.

---

## Consequences Of Violation

Monolithic provider, no clear ownership, impossible to selectively defer or disable domains, provider becomes unmanageable as the application grows.

---

## Never Put Business Logic in Service Providers

Service providers are composition roots. Database queries, API calls, and business operations must not be placed in providers.

---

## Category

Architecture

---

## Rule

Service providers must not contain database queries, external API calls, complex calculations, or any business logic. Providers wire dependencies in `register()` and orchestrate infrastructure setup in `boot()`. Business logic belongs in dedicated service or action classes.

---

## Reason

Business logic in providers runs on every request, cannot be tested in isolation, couples registration timing to business behavior, and makes providers unmanageable as the application grows.

---

## Bad Example

```php
public function boot(): void
{
    $activeUsers = User::whereActive(true)->get(); // DB query in provider
    foreach ($activeUsers as $user) {
        // Business logic in provider
    }
}
```

---

## Good Example

```php
public function boot(UserNotifier $notifier): void
{
    $notifier->notifyActiveUsers(); // delegated to a service
}
```

---

## Exceptions

Model observer registration (`Order::observe(OrderObserver::class)`) is infrastructure setup, not business logic, and is acceptable in `boot()`.

---

## Consequences Of Violation

Per-request business logic that cannot be cached, untestable provider code, coupling between registration timing and business behavior.

---

## Gate Debug/Profiler Providers by Environment

Register debug toolbar and profiler service providers only in non-production environments.

---

## Category

Security

---

## Rule

Use environment gating to register debug, profiler, and developer tool service providers. These providers must never be registered in production.

---

## Reason

Debug toolbar providers and profilers expose application internals, database queries, and configuration values. Registering them in production creates security risks and performance overhead. Environment gating prevents accidental production registration.

---

## Bad Example

```php
// config/app.php — always registers debug bar
'providers' => [
    Barryvdh\Debugbar\ServiceProvider::class,
    // Registered in all environments
];
```

---

## Good Example

```php
// In a service provider or AppServiceProvider
public function register(): void
{
    if (! $this->app->environment('production')) {
        $this->app->register(DebugbarServiceProvider::class);
    }
}
```

---

## Exceptions

No common exceptions. Debug and profiler providers must be strictly gated away from production.

---

## Consequences Of Violation

Exposed application internals in production, performance degradation from profiling overhead, security-sensitive information leaked to users.
