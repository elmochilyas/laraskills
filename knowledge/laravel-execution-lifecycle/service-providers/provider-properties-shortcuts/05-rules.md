# Rules

## Rule 1: Always Call `parent::register()` When Overriding `register()`
---
## Category
Reliability
---
## Rule
Call `parent::register()` at the top of any `register()` override to ensure `$bindings` and `$singletons` properties are processed.
---
## Reason
The base `ServiceProvider::register()` method processes `$bindings` and `$singletons` into actual container bindings via `registerBindings()`. Overriding `register()` without calling `parent::register()` silently disables these shortcuts — they appear correct but register nothing.
---
## Bad Example
```php
class PaymentServiceProvider extends ServiceProvider
{
    protected $singletons = [
        PaymentLogger::class => PaymentLogger::class,
    ];

    public function register(): void
    {
        // parent::register() not called — $singletons ignored!
        $this->app->bind(Gateway::class, StripeGateway::class);
    }
}
```
---
## Good Example
```php
class PaymentServiceProvider extends ServiceProvider
{
    protected $singletons = [
        PaymentLogger::class => PaymentLogger::class,
    ];

    public function register(): void
    {
        parent::register(); // Processes $bindings and $singletons
        $this->app->bind(Gateway::class, StripeGateway::class);
    }
}
```
---
## Exceptions
Providers that use NO declarative shortcuts (no `$bindings`, no `$singletons` properties) may omit `parent::register()`, though calling it defensively has negligible overhead.
---
## Consequences Of Violation
Silent dead code — `$bindings` and `$singletons` appear to work but have no effect; services silently unavailable; hours of debugging time wasted.

## Rule 2: Use `$bindings` and `$singletons` Only for Simple Mappings Without Factory Logic
---
## Category
Code Organization
---
## Rule
Use the `$bindings` and `$singletons` declarative properties only for direct interface-to-class or class-to-class mappings that need no factory closures, contextual binding, or tagging.
---
## Reason
These properties accept flat key-value arrays. Factory closures, contextual `when()->needs()->give()` chains, and tagged bindings cannot be expressed declaratively — they require explicit code in `register()`.
---
## Bad Example
```php
protected $bindings = [
    PaymentGateway::class => StripeGateway::class, // OK — simple mapping
];

// Cannot express contextual binding with properties:
// $this->app->when(InvoiceController::class)
//     ->needs(PaymentGateway::class)
//     ->give(StripeGateway::class);
```
---
## Good Example
```php
protected $bindings = [
    PaymentGateway::class => StripeGateway::class, // Simple — uses property
];

public function register(): void
{
    parent::register();

    // Complex — needs explicit code
    $this->app->when(InvoiceController::class)
        ->needs(PaymentGateway::class)
        ->give(StripeGateway::class);
}
```
---
## Exceptions
No common exceptions. If the binding requires any runtime logic, use `register()` explicitly.
---
## Consequences Of Violation
Ineffective property declarations that don't apply; confusion about why contextual bindings aren't working; mixing declarative and imperative styles inconsistently.

## Rule 3: Use `mergeConfigFrom()` for Package Config Defaults in `register()`
---
## Category
Architecture
---
## Rule
Call `mergeConfigFrom()` inside `register()` to merge package configuration files with the application's published configuration.
---
## Reason
`mergeConfigFrom()` uses recursive `array_merge` to add new configuration keys from package updates without overriding user customizations. Placing it in `register()` ensures the merge happens before config caching.
---
## Bad Example
```php
public function boot(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config/analytics.php', 'analytics');
    // Too late — config may already be cached
}
```
---
## Good Example
```php
public function register(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config/analytics.php', 'analytics');
    // Correct — runs before config caching
}
```
---
## Exceptions
When config caching is not used (local development), the placement matters less — but always place in `register()` for correctness.
---
## Consequences Of Violation
Config merge may not work correctly with `php artisan config:cache`; new config keys from package updates may not be available; users may see unexpected config values.

## Rule 4: Never Redeclare `$bindings` in a Subclass Expecting Array Merge
---
## Category
Maintainability
---
## Rule
Do not assume that redeclaring `$bindings` or `$singletons` in a subclass merges with the parent class — it replaces entirely.
---
## Reason
PHP class properties do not merge across inheritance — a subclass redeclaration replaces the parent's array. If a subclass provider extends a base provider, the subclass must manually merge arrays if parent bindings should be preserved.
---
## Bad Example
```php
class BaseServiceProvider extends ServiceProvider
{
    protected $bindings = [
        Logger::class => FileLogger::class,
    ];
}

class ExtendedProvider extends BaseServiceProvider
{
    protected $bindings = [
        Mailer::class => SmtpMailer::class, // Logger binding is lost!
    ];
}
```
---
## Good Example
```php
class ExtendedProvider extends BaseServiceProvider
{
    public function register(): void
    {
        $this->bindings = array_merge(
            [Logger::class => FileLogger::class], // Preserve parent
            [Mailer::class => SmtpMailer::class]  // Add new
        );
        parent::register();
    }
}
```
---
## Exceptions
No common exceptions. Always explicitly merge if you intend to preserve parent bindings.
---
## Consequences Of Violation
Parent bindings silently lost; services that worked with the base provider stop working when extended; difficult-to-trace bugs in provider hierarchies.
