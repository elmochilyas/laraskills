# Bootstrapping Lifecycle — Rules

## Never Resolve Services in register()

Restrict service provider `register()` methods to container binding calls only. Never resolve services or interact with facades during registration.

---

## Category

Architecture

---

## Rule

Service provider `register()` methods must only contain `$this->app->bind()`, `$this->app->singleton()`, `$this->app->instance()`, and `$this->app->tag()` calls. Do not call `$this->app->make()`, facades, or any service resolution logic.

---

## Reason

During `register()`, not all providers have registered their bindings. Resolving a service may return a partially initialized instance or work only by coincidence. The two-phase provider contract guarantees all `register()` calls complete before any `boot()` call begins.

---

## Bad Example

```php
public function register(): void
{
    $this->app->singleton(ReportingService::class);
    $service = $this->app->make(ReportingService::class);
    $service->initialize();
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

No common exceptions. The register-boot separation is a framework invariant.

---

## Consequences Of Violation

Services resolved in partially initialized state, unpredictable failures when provider order changes, bootstrap bugs that are hard to reproduce and debug.

---

## Run php artisan optimize in Every Production Deployment

Always execute `php artisan optimize` (config:cache, route:cache, event:cache, deferred provider manifest) in production deployment scripts.

---

## Category

Performance

---

## Rule

Include `php artisan config:cache && php artisan route:cache && php artisan event:cache && php artisan optimize` as mandatory steps in every production deployment script.

---

## Reason

Without optimization, bootstrapping reads 20+ config files individually, re-registers all routes on every request, and loads deferred providers eagerly. Optimization reduces bootstrap time by 30-70% for large applications.

---

## Bad Example

```bash
# Deployment missing cache commands
git pull origin main
composer install --no-dev
php artisan migrate --force
```

---

## Good Example

```bash
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan optimize
php artisan migrate --force
```

---

## Exceptions

Development environments must not run cache commands, as they prevent config changes from taking effect without rebuild.

---

## Consequences Of Violation

5-15ms additional bootstrap time per request, deferred providers load eagerly, uncached config parsing on every request, unnecessary server load.

---

## Defer Providers for Services Not Used on Every Request

Mark service providers as deferred when their bound services are resolved on less than 80% of requests.

---

## Category

Performance

---

## Rule

Set `protected $defer = true` on service providers whose services are not needed on every request. Implement the `provides()` method returning all bound abstracts.

---

## Reason

Deferred providers avoid instantiation, register, and boot cost until the service is first resolved. For services used infrequently, this eliminates bootstrap overhead entirely.

---

## Bad Example

```php
class PdfExportServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PdfExporter::class);
    }
    // $defer not set — loads on every request even if PDF export is rarely used
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

Do not defer providers whose services are used on 80%+ of requests. The complexity of deferred resolution is not justified when the provider loads on nearly every request anyway.

---

## Consequences Of Violation

Unnecessary bootstrap time for unused services, 2-5ms additional provider instantiation per request, increased memory footprint.

---

## Never Add Business Logic to Bootstrappers

Custom bootstrappers must only initialize infrastructure. Never add database queries, API calls, or complex calculations.

---

## Category

Architecture

---

## Rule

Bootstrappers added to the kernel's `$bootstrappers` array must be limited to infrastructure initialization. Business logic, database queries, and external service calls belong in service providers or dedicated services.

---

## Reason

Bootstrappers run on every request before middleware. Business logic at this stage cannot be cached, cannot be bypassed for specific routes, and adds latency to every request without exception.

---

## Bad Example

```php
class LoadPaymentGateways implements Bootstrapper
{
    public function bootstrap(Application $app): void
    {
        $gateways = Gateway::all(); // database query in bootstrapper
        $app->instance('gateways', $gateways);
    }
}
```

---

## Good Example

```php
class RegisterLogger implements Bootstrapper
{
    public function bootstrap(Application $app): void
    {
        $app->singleton(Logger::class, FileLogger::class);
    }
}
```

---

## Exceptions

No common exceptions. Bootstrappers are for initialization, not business logic.

---

## Consequences Of Violation

Per-request overhead for all routes, inability to cache or skip initialization, database connection required at bootstrap, tight coupling between boot order and business behavior.

---

## Always Run config:cache in Production

Include `php artisan config:cache` in every deployment to prevent per-request config file parsing.

---

## Category

Performance

---

## Rule

Every production deployment must execute `php artisan config:cache` after configuration files are in place. Never run a production application without cached configuration.

---

## Reason

Uncached configuration loads 20+ files via glob scanning and file reading on every request (3-8ms). Cached configuration is a single `require` statement (<0.5ms). The performance difference is an order of magnitude.

---

## Bad Example

```bash
# No config caching
git pull origin main
php artisan migrate --force
```

---

## Good Example

```bash
git pull origin main
php artisan config:cache
php artisan migrate --force
```

---

## Exceptions

Development environments should not cache config to allow immediate changes.

---

## Consequences Of Violation

3-8ms additional bootstrap time per request, linearly scaling with config file count, increased server resource usage.

---

## Never Rely on Service Provider Boot Order

Do not assume providers boot in a specific order. Design providers to be order-independent.

---

## Category

Design

---

## Rule

Service providers must not depend on the boot-time side effects of other providers. Use `resolving` callbacks or lazy initialization instead of relying on provider array ordering for correctness.

---

## Reason

Provider order is defined in `config/app.php` (or `bootstrap/app.php`) and can change when providers are added, removed, or reorganized. Order-dependent providers break unpredictably under these changes.

---

## Bad Example

```php
// ProviderA — must boot before ProviderB
public function boot(): void
{
    $this->app->make(ServiceA::class)->initialize();
}

// ProviderB — silently depends on ServiceA being initialized
public function boot(): void
{
    $this->app->make(ServiceB::class)->setDependency(ServiceA::class);
}
```

---

## Good Example

```php
public function boot(): void
{
    $this->app->resolving(ServiceB::class, function ($service) {
        $service->setDependency($this->app->make(ServiceA::class));
    });
}
```

---

## Exceptions

Framework core providers have defined ordering guarantees. Application providers must never depend on each other's boot order.

---

## Consequences Of Violation

Intermittent bootstrap failures when provider order changes, hard-to-debug "works on my machine" scenarios, fragile deployment process.

---

## Validate Environment Variables at Bootstrap

Check required environment variables early in the boot sequence with descriptive error messages.

---

## Category

Reliability

---

## Rule

In a service provider's `boot()` method, validate that all required environment variables are set. Throw a descriptive `RuntimeException` with the missing variable name when validation fails.

---

## Reason

Missing environment variables cause cryptic runtime errors (database connection failures, API call failures) that are hard to trace. Early validation with clear error messages catches misconfiguration at deployment time.

---

## Bad Example

```php
// No validation — fails at first database query with generic error
public function boot(): void
{
    // No check for DB_HOST, DB_DATABASE, etc.
}
```

---

## Good Example

```php
public function boot(): void
{
    $required = ['STRIPE_KEY', 'STRIPE_SECRET', 'DB_HOST'];
    foreach ($required as $key) {
        if (empty(env($key))) {
            throw new RuntimeException(
                "Required environment variable [{$key}] is not set."
            );
        }
    }
}
```

---

## Exceptions

Validate in `boot()` not `register()`, as `register()` must not resolve services or have side effects.

---

## Consequences Of Violation

Cryptic runtime errors at first usage, delayed failure detection, difficult debugging in production, security implications from silently failing configuration.
