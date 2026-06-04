# Contextual Binding Timing Rules

## Rule 1: Register Contextual Bindings in register() Only
---
## Category
Framework Usage
---
## Rule
Always register contextual bindings (`$app->when()->needs()->give()`) inside a service provider's `register()` method, never in `boot()`.
---
## Reason
Contextual bindings must be registered before the consumer class is first resolved. If registered in `boot()`, another provider's `boot()` may resolve the consumer first, making the contextual binding ineffective on that already-resolved instance.
---
## Bad Example
```php
public function boot()
{
    // Consumer may already be resolved by another provider's boot()
    $this->app->when(ReportController::class)
        ->needs(ReportGenerator::class)
        ->give(PdfReportGenerator::class);
}
```
---
## Good Example
```php
public function register()
{
    $this->app->when(ReportController::class)
        ->needs(ReportGenerator::class)
        ->give(PdfReportGenerator::class);
}
```
---
## Exceptions
Contextual bindings registered in `boot()` are safe if you are certain the consumer has never been resolved before. Registering in `register()` is always safer.
---
## Consequences Of Violation
Contextual binding silently has no effect. The consumer receives the default binding instead. Hard-to-debug issues where "the wrong implementation" is injected.
---

## Rule 2: Use Primitive Contextual Binding for Named Parameters
---
## Category
Architecture
---
## Rule
Use `$app->when(Consumer::class)->needs('$parameterName')->give($value)` for injecting primitive values that vary per consumer.
---
## Reason
Primitive contextual binding resolves named constructor parameters without changing the consumer class, adding a `config()` call, or creating factory classes. It keeps the consumer clean and the binding declaration centralized.
---
## Bad Example
```php
class PaymentService
{
    public function __construct()
    {
        $this->apiKey = config('services.stripe.secret'); // Hidden config dependency
    }
}
```
---
## Good Example
```php
class PaymentService
{
    public function __construct(
        private string $apiKey // Explicit dependency — injected by container
    ) {}
}

// In provider register():
$this->app->when(PaymentService::class)
    ->needs('$apiKey')
    ->give(config('services.stripe.secret'));
```
---
## Exceptions
Values that change per request (use middleware or request-scoped services instead).
---
## Consequences Of Violation
Hidden configuration dependencies. Hard-to-test classes that call `config()` directly. Reduced clarity about what each class depends on.
---

## Rule 3: Register Contextual Bindings in the Same Provider as the Consumer
---
## Category
Code Organization
---
## Rule
Place contextual bindings in the same service provider that registers the consumer class or its interface.
---
## Reason
Co-locating the binding with the consumer makes the specialization visible and maintainable. A developer modifying the consumer can immediately see its contextual bindings without searching across multiple providers.
---
## Bad Example
```php
// ProviderA registers the consumer
class PaymentProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(StripePayment::class);
    }
}

// ProviderB defines contextual binding — disconnected from consumer
class BillingProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->when(StripePayment::class)
            ->needs('$apiKey')
            ->give(config('services.stripe.key'));
    }
}
```
---
## Good Example
```php
class PaymentProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(StripePayment::class);

        // Contextual binding co-located with consumer
        $this->app->when(StripePayment::class)
            ->needs('$apiKey')
            ->give(config('services.stripe.key'));
    }
}
```
---
## Exceptions
When a contextual binding spans multiple consumers from different architectural layers — use a dedicated binding provider with documentation.
---
## Consequences Of Violation
Contextual bindings scattered across providers. Hard to discover what specializations exist for a given consumer. Maintenance overhead when consumers change.
---

## Rule 4: Never Use Contextual Binding as a Default Pattern
---
## Category
Architecture
---
## Rule
Use global `bind()` for the default implementation and contextual binding only for consumers that need specialization.
---
## Reason
Using contextual binding for every consumer instead of a single global binding with reasonable defaults creates unnecessary complexity. Each contextual binding adds lookup overhead on every resolution of the consumer and makes the default path harder to understand.
---
## Bad Example
```php
// Every consumer gets its own binding — no default
$this->app->when(UserController::class)->needs(Logger::class)->give(FileLogger::class);
$this->app->when(AdminController::class)->needs(Logger::class)->give(DatabaseLogger::class);
$this->app->when(ApiController::class)->needs(Logger::class)->give(CloudLogger::class);
// No global Logger binding
```
---
## Good Example
```php
// Default binding
$this->app->bind(Logger::class, FileLogger::class);

// Only specialize where needed
$this->app->when(AdminController::class)
    ->needs(Logger::class)
    ->give(DatabaseLogger::class);
```
---
## Exceptions
When there is no sensible default and every consumer genuinely requires a different implementation.
---
## Consequences Of Violation
Hundreds of contextual bindings that are hard to audit. High cognitive load to understand which implementation each consumer gets.
---

## Rule 5: Document Why Contextual Bindings Exist
---
## Category
Maintainability
---
## Rule
Add a comment explaining why a specific consumer gets a different implementation via contextual binding.
---
## Reason
The reason for a contextual specialization is often non-obvious to future developers. Without documentation, a developer may remove or change a contextual binding, breaking the specialization without understanding the consequence.
---
## Bad Example
```php
$this->app->when(ReportController::class)
    ->needs(ReportGenerator::class)
    ->give(PdfReportGenerator::class);
// No comment — why does this consumer get a different implementation?
```
---
## Good Example
```php
$this->app->when(ReportController::class)
    ->needs(ReportGenerator::class)
    ->give(PdfReportGenerator::class);
// ReportController generates PDF downloads — needs PdfReportGenerator
// All other controllers use the default CsvReportGenerator
```
---
## Exceptions
Self-documenting cases where the consumer name or interface name makes the specialization obvious.
---
## Consequences Of Violation
Contextual binding removed or changed accidentally during refactoring. Specialization silently lost.
---

## Rule 6: Avoid Contextual Binding for Singleton Consumers
---
## Category
Reliability
---
## Rule
Register contextual bindings before any singleton consumer is resolved — register them as early as possible in the provider list.
---
## Reason
Singleton consumers are resolved once and cached. If a contextual binding is registered after the singleton is already resolved, the binding has no effect on the cached instance. The singleton continues using the original (non-contextual) implementation.
---
## Bad Example
```php
// Provider A (registered first)
class EarlyProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(ReportController::class);
        app(ReportController::class); // Consumer resolved — cached
    }
}

// Provider B (registered later)
class LateProvider extends ServiceProvider
{
    public function register()
    {
        // Too late — ReportController already resolved as singleton
        $this->app->when(ReportController::class)
            ->needs(ReportGenerator::class)
            ->give(PdfReportGenerator::class);
    }
}
```
---
## Good Example
```php
// Register contextual binding before resolving the singleton
class Provider extends ServiceProvider
{
    public function register()
    {
        $this->app->when(ReportController::class)
            ->needs(ReportGenerator::class)
            ->give(PdfReportGenerator::class);

        $this->app->singleton(ReportController::class);
        // Safe — contextual binding registered before resolution
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Contextual binding silently has no effect on singleton consumers. The consumer receives the global default. Hard-to-detect behavioral issues where a singleton uses the wrong implementation.
