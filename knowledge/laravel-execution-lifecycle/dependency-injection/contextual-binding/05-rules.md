# Register Contextual Bindings in register(), Not boot()
---
## Category
Reliability
---
## Rule
Always register contextual bindings in a service provider's `register()` method, never in `boot()`.
---
## Reason
Contextual bindings are stored in the container's `$contextual` array and checked during resolution. If a binding is registered after a consumer has already been resolved, it has no effect. The `register()` method runs before any class is resolved.
---
## Bad Example
```php
public function boot(): void
{
    $this->app->when(ReportController::class)
        ->needs(ReportGenerator::class)
        ->give(PdfReportGenerator::class); // May be too late
}
```
---
## Good Example
```php
public function register(): void
{
    $this->app->when(ReportController::class)
        ->needs(ReportGenerator::class)
        ->give(PdfReportGenerator::class);
}
```
---
## Exceptions
No common exceptions. All bindings, including contextual, must be registered in `register()`.
---
## Consequences Of Violation
Binding silently ignored; consumer resolves with global default instead of contextual override.

---

# Use Contextual Binding Over Factory Pattern
---
## Category
Architecture
---
## Rule
Prefer `when()->needs()->give()` over factory classes when different consumers need different implementations of the same interface.
---
## Reason
Contextual binding replaces conditional logic inside factory classes with declarative configuration. The binding declares at registration time which consumer gets which implementation, eliminating runtime conditionals.
---
## Bad Example
```php
class ReportGeneratorFactory
{
    public function make(string $consumer): ReportGenerator
    {
        return match ($consumer) {
            'admin' => new DetailedReportGenerator(),
            default => new SummaryReportGenerator(),
        };
    }
}
```
---
## Good Example
```php
$this->app->when(AdminController::class)
    ->needs(ReportGenerator::class)
    ->give(DetailedReportGenerator::class);

$this->app->when(UserController::class)
    ->needs(ReportGenerator::class)
    ->give(SummaryReportGenerator::class);
```
---
## Exceptions
When the implementation decision depends on runtime request data — use middleware or a factory instead.
---
## Consequences Of Violation
Conditional logic in factories; harder to test consumer-specific behavior; duplicated resolution rules.

---

# Use Contextual Binding to Inject Primitive Config Values
---
## Category
Code Organization
---
## Rule
Use `needs('$parameterName')->give(value)` to inject specific configuration values into constructor parameters instead of injecting the entire `Config` object.
---
## Reason
Injecting specific primitives via contextual binding makes the constructor's needs explicit and avoids coupling the class to Laravel's `Config` repository. Each parameter declares exactly what value it requires.
---
## Bad Example
```php
class PaymentService
{
    public function __construct(private Config $config) {}

    public function charge(float $amount): void
    {
        $key = $this->config->get('services.stripe.secret');
    }
}
```
---
## Good Example
```php
class PaymentService
{
    public function __construct(
        private string $apiKey,
    ) {}
}

// In provider
$this->app->when(PaymentService::class)
    ->needs('$apiKey')
    ->give(config('services.stripe.secret'));
```
---
## Exceptions
When the class needs many config values — consider a dedicated configuration DTO instead.
---
## Consequences Of Violation
Coupling to Config repository; harder to test; less explicit dependency declaration.

---

# Use the $ Prefix for Primitive Parameter Names
---
## Category
Reliability
---
## Rule
Always include the `$` prefix when binding primitive parameters via `needs('$paramName')`.
---
## Reason
The container matches `needs()` strings against constructor parameter names. Without the `$` prefix, the binding is silently ignored and the parameter is not resolved — the container either uses the default or throws.
---
## Bad Example
```php
$this->app->when(PaymentService::class)
    ->needs('apiKey')      // Missing $ prefix — silently ignored
    ->give(config('services.stripe.key'));
```
---
## Good Example
```php
$this->app->when(PaymentService::class)
    ->needs('$apiKey')      // Correct $ prefix
    ->give(config('services.stripe.key'));
```
---
## Exceptions
No common exceptions. The `$` prefix is required syntax.
---
## Consequences Of Violation
Binding silently ignored; parameter resolved with default or throws `BindingResolutionException`.

---

# Document Why a Contextual Binding Exists
---
## Category
Maintainability
---
## Rule
Add a comment above each contextual binding explaining why the consumer gets a different implementation.
---
## Reason
Contextual bindings override global defaults. Without documentation, future developers cannot tell whether the override is intentional or accidental. The rationale helps maintainers understand the architecture decision.
---
## Bad Example
```php
$this->app->when(AdminController::class)
    ->needs(ReportGenerator::class)
    ->give(DetailedReportGenerator::class);
// Why? No explanation
```
---
## Good Example
```php
// Admin controllers need detailed reports with full data exports
$this->app->when(AdminController::class)
    ->needs(ReportGenerator::class)
    ->give(DetailedReportGenerator::class);
```
---
## Exceptions
When the reason is self-evident from naming conventions or nearby code.
---
## Consequences Of Violation
Maintenance confusion; accidental removal or change of intentional overrides.

---

# Avoid Contextual Binding Sprawl
---
## Category
Maintainability
---
## Rule
Keep contextual bindings under a reasonable threshold. If you have 50+ contextual bindings, simplify the architecture instead of adding more.
---
## Reason
A high number of contextual bindings indicates the architecture may need simplification — too many consumers require special treatment. This makes the binding configuration hard to audit and maintain.
---
## Bad Example
```php
// 50+ contextual bindings across multiple providers
$this->app->when(ServiceA::class)->needs(X::class)->give(Y1::class);
$this->app->when(ServiceB::class)->needs(X::class)->give(Y2::class);
// ...
$this->app->when(ServiceN::class)->needs(X::class)->give(Yn::class);
```
---
## Good Example
```php
// Consider whether a shared default or architectural change can reduce the count
$this->app->when(SpecializedService::class)->needs(X::class)->give(Y::class);
// Only the truly exceptional consumers get contextual bindings
```
---
## Exceptions
Plugin architectures where third-party packages legitimately need consumer-specific implementations.
---
## Consequences Of Violation
Hard-to-maintain binding configuration; reduced clarity about which consumer gets which implementation.
