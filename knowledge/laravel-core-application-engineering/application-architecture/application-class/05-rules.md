# Application Class — Rules

## Prefer Fluent API Over Class Extension

Prefer `bootstrap/app.php` fluent methods (`withMiddleware`, `withExceptions`, `withRouting`) over extending the Application class.

---

## Category

Framework Usage

---

## Rule

Use the fluent configuration API in `bootstrap/app.php` for all standard customizations. Only extend the Application class when overriding path resolution methods or modifying core lifecycle behavior.

---

## Reason

The fluent API is the framework's declared customization contract. Extending the Application creates tight coupling to the class hierarchy, increasing upgrade risk and adding unnecessary complexity.

---

## Bad Example

```php
class CustomApplication extends Application
{
    public function registerConfiguredProviders()
    {
        // overriding just to add a middleware
    }
}
// bootstrap/app.php
$app = new CustomApplication(dirname(__DIR__));
```

---

## Good Example

```php
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontReport(ValidationException::class);
    })
    ->create();
```

---

## Exceptions

Extend Application when overriding path resolution methods (e.g., using `src/` instead of `app/`), implementing multi-app setups, or modifying the boot sequence.

---

## Consequences Of Violation

Upgrade risk, unnecessary complexity, deviation from framework conventions, increased maintenance burden during Laravel version upgrades.

---

## Avoid Post-Boot Binding Registration

Never call `$app->bind()`, `$app->singleton()`, or `$app->instance()` after the Application has booted.

---

## Category

Architecture

---

## Rule

Register all container bindings inside service provider `register()` methods. Do not register bindings in controllers, middleware, or after `$app->boot()` has completed.

---

## Reason

After boot, the container's binding map is considered finalized. Late registrations may be ignored or create unpredictable resolution behavior, as services may already have been resolved without the new binding.

---

## Bad Example

```php
class SomeController extends Controller
{
    public function index()
    {
        app()->bind(PaymentGateway::class, StripeGateway::class);
        // binding registered too late; other services already resolved
    }
}
```

---

## Good Example

```php
class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, StripeGateway::class);
    }
}
```

---

## Exceptions

No common exceptions. All bindings must be registered in service providers.

---

## Consequences Of Violation

Services resolve with default or stale implementations, unpredictable application behavior, hard-to-debug resolution failures.

---

## Keep bootstrap/app.php Free of Business Logic

Never place business logic, complex conditionals, or service resolution code in `bootstrap/app.php`.

---

## Category

Architecture

---

## Rule

`bootstrap/app.php` must only contain fluent Application configuration calls. Extract all business logic, validation, and complex conditionals to service providers or dedicated classes.

---

## Reason

`bootstrap/app.php` executes on every request. Business logic placed here cannot be cached, adds latency to every request, and mixes configuration concerns with application behavior.

---

## Bad Example

```php
// bootstrap/app.php
if (app()->environment('production')) {
    $key = env('PAYMENT_KEY');
    if (empty($key)) {
        throw new RuntimeException('Missing payment key');
    }
}
return Application::configure(...)->create();
```

---

## Good Example

```php
// bootstrap/app.php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(...)
    ->create();
```

---

## Exceptions

Environment detection callbacks passed to `detectEnvironment()` are acceptable as they are part of framework configuration.

---

## Consequences Of Violation

Per-request performance penalty, untestable bootstrap logic, configuration mixed with business behavior, deployment validation bypassed.

---

## Always Call parent::__construct() When Extending Application

Always invoke `parent::__construct($basePath)` as the first operation when overriding the Application constructor.

---

## Category

Framework Usage

---

## Rule

When creating a custom Application subclass, the constructor must call `parent::__construct($basePath)` before any custom logic.

---

## Reason

The parent constructor registers base container bindings (`app`, `Container`, `Illuminate\Contracts\Container\Container`), core service providers (`EventServiceProvider`, `LogServiceProvider`, `RoutingServiceProvider`), and container aliases. Skipping it breaks all framework operations.

---

## Bad Example

```php
class CustomApplication extends Application
{
    public function __construct(string $basePath)
    {
        $this->customBinding = new SomeService();
        // parent::__construct() never called
    }
}
```

---

## Good Example

```php
class CustomApplication extends Application
{
    public function __construct(string $basePath)
    {
        parent::__construct($basePath);
        // custom logic after parent construction
    }
}
```

---

## Exceptions

No common exceptions. The parent constructor call is mandatory.

---

## Consequences Of Violation

Container-dependent operations fail, facades cannot resolve, service providers fail to register, application crashes at boot.

---

## Use Dependency Injection Over app() Helper in Application Code

Prefer constructor injection over the `app()` helper in all business logic classes (services, actions, domain objects).

---

## Category

Design

---

## Rule

Resolve dependencies via constructor injection in application services, actions, and domain classes. Reserve the `app()` helper for bootstrap code, service providers, and prototyping.

---

## Reason

Constructor injection makes dependencies explicit, testable, and IDE-friendly. The `app()` helper creates hidden dependencies that cannot be mocked or substituted without container awareness.

---

## Bad Example

```php
class PaymentService
{
    public function process(int $orderId): void
    {
        $gateway = app(PaymentGateway::class);
        $gateway->charge($orderId);
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
    ) {}

    public function process(int $orderId): void
    {
        $this->gateway->charge($orderId);
    }
}
```

---

## Exceptions

`app()` is acceptable in event listeners, route closures, and prototyping where constructor injection would introduce disproportionate ceremony.

---

## Consequences Of Violation

Hidden dependencies that cannot be mocked, classes not testable in isolation, refactoring difficulty, service locator anti-pattern.

---

## Never Expose the Application Instance to Untrusted Code

Never pass the `$app` container instance to code that accepts untrusted user input or dynamic binding registration.

---

## Category

Security

---

## Rule

The Application instance controls all service resolution and binding. Never expose it to user-controlled code paths or allow dynamic binding registration from request data.

---

## Reason

The Application manages core binding registries, singleton caches, and alias resolution. Exposing it allows an attacker to override service implementations, intercept sensitive operations, or manipulate application behavior.

---

## Bad Example

```php
$serviceName = $request->input('service');
$result = app($serviceName)->execute();
// attacker provides any class name from the application
```

---

## Good Example

```php
$action = match ($request->input('action')) {
    'process' => new ProcessAction(),
    'refund' => new RefundAction(),
    default => abort(400),
};
$action->execute();
```

---

## Exceptions

Debug toolbars or development-only utility routes may access the container, but must be environment-gated.

---

## Consequences Of Violation

Arbitrary service resolution by attackers, security middleware bypass, container manipulation, privilege escalation.

---

## Run php artisan optimize in Production

Execute `php artisan optimize` as part of every production deployment.

---

## Category

Performance

---

## Rule

Always run `php artisan optimize` (which compiles config cache, route cache, event cache, and deferred provider manifest) in production deployment scripts.

---

## Reason

Config caching eliminates environment file reading and multi-file config parsing on every request. Route caching eliminates route registration overhead. The optimized autoloader replaces PSR-4 filesystem lookups with a flat classmap.

---

## Bad Example

```bash
# Deployment without optimization
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
php artisan view:cache
php artisan event:cache
```

---

## Exceptions

Development and local environments should not run `optimize` as it prevents config changes from taking effect without cache rebuild.

---

## Consequences Of Violation

Uncached bootstrap on every request (5-15ms overhead), environment file read on every request, slower response times, increased server load.

---

## Validate Custom Path Overrides Thoroughly

Test all framework operations after overriding Application path resolution methods.

---

## Category

Reliability

---

## Rule

After overriding `path()`, `configPath()`, `storagePath()`, or any path resolution method, verify that migrations, seeders, generators, package commands, and service providers still resolve correct paths.

---

## Reason

Custom path resolution breaks framework assumptions. Service providers may reference default paths, generators use framework defaults, and packages resolve paths through the Application. Untested path overrides cause silent failures.

---

## Bad Example

```php
class CustomApplication extends Application
{
    public function path($path = '')
    {
        return $this->basePath('custom-src');
    }
}
// Never tested: php artisan make:controller, php artisan migrate, etc.
```

---

## Good Example

```php
// After path override, test:
// - php artisan make:controller TestController → creates in custom-src/
// - php artisan migrate → finds migrations
// - php artisan db:seed → finds seeders
// - php artisan route:list → resolves controllers
```

---

## Exceptions

No common exceptions. Path overrides always require verification.

---

## Consequences Of Violation

Generator commands place files in wrong directories, `class not found` errors, migrations fail to locate, package commands break, silent production failures.
