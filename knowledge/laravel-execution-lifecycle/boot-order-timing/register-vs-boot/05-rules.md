# Register vs Boot Rules

## Rule 1: Keep register() Pure — Bindings Only
---
## Category
Framework Usage
---
## Rule
Never call `$this->app->make()` or `resolve()` inside a service provider's `register()` method.
---
## Reason
The two-phase design guarantees all providers complete `register()` before any provider's `boot()` starts. A service resolved in `register()` may depend on a binding that a later provider hasn't registered yet, causing `BindingResolutionException`.
---
## Bad Example
```php
public function register()
{
    $this->app->bind(ReportingService::class, fn($app) => new ReportingService($app->make(Logger::class)));
    $logger = $this->app->make(Logger::class); // Risk: Logger provider may not have registered
}
```
---
## Good Example
```php
public function register()
{
    $this->app->bind(ReportingService::class, fn($app) => new ReportingService($app->make(Logger::class)));
}

public function boot()
{
    $logger = $this->app->make(Logger::class); // Safe — all providers registered
}
```
---
## Exceptions
Resolving `$this->app['config']` is safe in `register()` because the Config service provider is registered as a framework core provider before any app provider runs.
---
## Consequences Of Violation
`BindingResolutionException` during bootstrap. Non-deterministic failures that depend on provider registration order.
---

## Rule 2: Use boot() for All Initialization
---
## Category
Architecture
---
## Rule
Always register routes, event listeners, view composers, and gate definitions in the `boot()` method.
---
## Reason
The `boot()` phase guarantees all bindings from all providers are available. Route and listener registration often depends on services (e.g., middleware classes, listener classes) that must be resolved from the container.
---
## Bad Example
```php
public function register()
{
    Route::middleware('web')->group(base_path('routes/web.php')); // May fail if Router not yet registered
    Event::listen(UserRegistered::class, SendWelcomeEmail::class);
}
```
---
## Good Example
```php
public function register()
{
    // Bindings only
    $this->app->singleton(PaymentGateway::class, fn() => new StripeGateway());
}

public function boot()
{
    Route::middleware('web')->group(base_path('routes/web.php'));
    Event::listen(UserRegistered::class, SendWelcomeEmail::class);
}
```
---
## Exceptions
Publishing configuration or migrations — use `$this->publishes()` in `boot()` for packages, or `register()` for config merging with `mergeConfigFrom()`.
---
## Consequences Of Violation
Routes registered in `register()` may run before the Router service is fully configured. Listeners may fire before their dependencies are resolvable.
---

## Rule 3: Use $bindings and $singletons Properties for Simple Bindings
---
## Category
Code Organization
---
## Rule
Prefer the `$bindings` and `$singletons` properties over explicit `$this->app->bind()` calls for simple interface-to-class mappings.
---
## Reason
These properties are declarative, processed automatically after `register()` by the framework, and make simple bindings visible at a glance without reading closure code. They also work correctly with deferred providers.
---
## Bad Example
```php
public function register()
{
    $this->app->bind(PaymentInterface::class, StripeGateway::class);
    $this->app->singleton(LoggerInterface::class, FileLogger::class);
}
```
---
## Good Example
```php
public $bindings = [
    PaymentInterface::class => StripeGateway::class,
];

public $singletons = [
    LoggerInterface::class => FileLogger::class,
];
```
---
## Exceptions
Bindings that require closure-based construction or configuration injection.
---
## Consequences Of Violation
Unnecessary boilerplate. Simple bindings hidden inside `register()` methods rather than being immediately visible as class properties.
---

## Rule 4: Never Call register() Manually
---
## Category
Framework Usage
---
## Rule
Never invoke `$this->app->register()` from middleware, controllers, or provider `boot()` methods for the purpose of re-registering a provider.
---
## Reason
The framework orchestrates the register phase. Manual calls can register a provider after the boot phase has started, triggering immediate `register()+boot()` for that provider. This defeats the two-phase design and can lead to bindings being registered after they were already resolved.
---
## Bad Example
```php
public function boot()
{
    $this->app->register(LateServiceProvider::class); // Registers then immediately boots
    $service = $this->app->make(SomeService::class); // May get instance without late binding
}
```
---
## Good Example
```php
// In config/app.php — all providers registered declaratively
'providers' => [
    App\Providers\LateServiceProvider::class,
],
```
---
## Exceptions
Testing or package bootstrapping scenarios where a provider must be conditionally loaded after the app is booted.
---
## Consequences Of Violation
Non-deterministic binding registration. Already-resolved services missing late-registered bindings. Hard-to-debug inconsistencies.
---

## Rule 5: Do Not Modify Container Bindings in boot()
---
## Category
Reliability
---
## Rule
Avoid rebinding or re-registering an existing binding inside `boot()` — the rebind does not affect already-resolved instances.
---
## Reason
Services resolved in another provider's `boot()` are cached in the container. Rebindings in `boot()` apply only to future resolutions. Classes already injected with the old implementation will not see the new binding, leading to inconsistent behavior.
---
## Bad Example
```php
public function boot()
{
    $this->app->bind(PaymentGateway::class, PayPalGateway::class);
    // StripeGateway was already resolved in another provider's boot() — this has no effect on that instance
}
```
---
## Good Example
```php
public function register()
{
    // Register the correct implementation from the start
    if (config('services.payment.gateway') === 'paypal') {
        $this->app->bind(PaymentGateway::class, PayPalGateway::class);
    } else {
        $this->app->bind(PaymentGateway::class, StripeGateway::class);
    }
}
```
---
## Exceptions
Using `$app->instance()` or `$app->forgetInstance()` to replace an already-resolved singleton — but prefer doing this in `register()`.
---
## Consequences Of Violation
Inconsistent implementations in play simultaneously. Some parts of the application use the old binding while others use the new one.
---

## Rule 6: Split Large Providers by Phase
---
## Category
Code Organization
---
## Rule
Split a service provider into separate providers for binding registration and boot initialization when either phase becomes large or complex.
---
## Reason
A provider that does extensive container configuration AND heavy boot initialization violates single-responsibility. Separating by phase makes the provider list in `config/app.php` more readable and allows independent deferral of the binding provider.
---
## Bad Example
```php
class MonolithicProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(ServiceA::class, ConcreteA::class);
        $this->app->bind(ServiceB::class, ConcreteB::class);
        $this->app->bind(ServiceC::class, ConcreteC::class);
        $this->app->bind(ServiceD::class, ConcreteD::class);
    }

    public function boot()
    {
        Route::middleware('web')->group(base_path('routes/web.php'));
        Event::listen(EventA::class, ListenerA::class);
        Event::listen(EventB::class, ListenerB::class);
        $this->loadViewsFrom(__DIR__.'/views', 'package');
    }
}
```
---
## Good Example
```php
// Binding provider — can be deferred
class ServiceBindingProvider extends ServiceProvider implements DeferrableProvider
{
    public function register()
    {
        $this->app->bind(ServiceA::class, ConcreteA::class);
        $this->app->bind(ServiceB::class, ConcreteB::class);
    }

    public function provides() { return [ServiceA::class, ServiceB::class]; }
}

// Boot provider — always eager
class ServiceBootProvider extends ServiceProvider
{
    public function boot()
    {
        Route::middleware('web')->group(base_path('routes/web.php'));
        Event::listen(EventA::class, ListenerA::class);
    }
}
```
---
## Exceptions
Small providers with minimal binding and boot logic fit well in a single class.
---
## Consequences Of Violation
Deferred providers cannot have boot logic — a combined provider with boot logic cannot be deferred. Mixed concerns make testing and debugging harder.
