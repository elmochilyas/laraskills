# Facade Aliases Registration Rules

## Rule 1: Register Aliases in config/app.php, Not Dynamically
---
## Category
Framework Usage
---
## Rule
Always register facade aliases in the `config/app.php` `aliases` array. Never register aliases dynamically via `AliasLoader::alias()` in service providers.
---
## Reason
The `aliases` array is the centralized, discoverable registry for all facade aliases. Dynamic alias registration scatters alias declarations across providers, making them hard to find, audit, and cache. After `config:cache`, only the `config/app.php` aliases are preserved.
---
## Bad Example
```php
public function register()
{
    AliasLoader::getInstance()->alias('Payment', App\Facades\Payment::class);
}
```
---
## Good Example
```php
// config/app.php
'aliases' => [
    'Payment' => App\Facades\Payment::class,
],
```
---
## Exceptions
Package bootstrapping scenarios where the alias target depends on runtime configuration that cannot be determined at config-cache time.
---
## Consequences Of Violation
Aliases lost after `config:cache`. Dynamic aliases scattered across providers — hard to audit. Alias collisions missed during code review.
---

## Rule 2: Import Facades Explicitly in Production Code
---
## Category
Code Organization
---
## Rule
Prefer explicit `use Illuminate\Support\Facades\Cache` imports over relying on `config/app.php` aliases.
---
## Reason
Explicit imports make dependencies visible at the file level, enable IDE autocompletion without alias resolution, prevent alias collisions, and work in all contexts (including console where `RegisterFacades` bootstrapper is omitted).
---
## Bad Example
```php
// Relies on alias — breaks in console; unclear where Cache comes from
class ReportService
{
    public function generate()
    {
        return Cache::remember('report', 3600, fn() => $this->build());
    }
}
```
---
## Good Example
```php
use Illuminate\Support\Facades\Cache;

class ReportService
{
    public function generate()
    {
        return Cache::remember('report', 3600, fn() => $this->build());
    }
}
```
---
## Exceptions
Blade templates and views where alias-based facades reduce verbosity and are conventionally acceptable.
---
## Consequences Of Violation
Class not found errors in console commands. Hidden facade dependencies. Alias collisions between packages producing silent overrides.
---

## Rule 3: Avoid Facade Aliases for Business Logic Classes
---
## Category
Architecture
---
## Rule
Use constructor injection for business logic classes. Reserve facade aliases for framework-level service access in views and templates.
---
## Reason
Facade aliases create hidden global dependencies that are not visible in method signatures. Constructor injection makes dependencies explicit, testable, and IDE-inspectable. Facades should not be the primary dependency injection mechanism for domain services.
---
## Bad Example
```php
class OrderProcessor
{
    public function process(Order $order)
    {
        Payment::charge($order); // Hidden global dependency on Payment facade
        Analytics::track('order_placed', $order); // Hidden global dependency
    }
}
```
---
## Good Example
```php
class OrderProcessor
{
    public function __construct(
        private PaymentGateway $payment,
        private AnalyticsService $analytics,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order);
        $this->analytics->track('order_placed', $order);
    }
}
```
---
## Exceptions
Facade usage in Blade templates, event listeners, or route callbacks where constructor injection is impractical.
---
## Consequences Of Violation
Hard-to-test classes that require mock setup of facades. Hidden coupling between domain logic and global state.
---

## Rule 4: Check Alias Uniqueness Across Packages
---
## Category
Maintainability
---
## Rule
Verify that custom facade aliases do not collide with aliases from framework packages or installed packages.
---
## Reason
PHP's `class_alias()` does not warn on redefinition. When two packages register the same alias, the last one registered silently overrides the first. One package's facade stops working without any error.
---
## Bad Example
```php
// Package A registers 'Analytics' alias
// Package B also registers 'Analytics' alias — no warning
// Depending on boot order, one silently overrides the other
```
---
## Good Example
```php
// Use a vendor-prefixed alias to prevent collisions
'aliases' => [
    'AcmeAnalytics' => Acme\AnalyticsFacade::class,
];

// Or check before registering
if (! AliasLoader::getInstance()->alias('Analytics', Acme\AnalyticsFacade::class)) {
    throw new RuntimeException('Alias collision: Analytics already registered');
}
```
---
## Exceptions
Application-level aliases that intentionally override a package alias.
---
## Consequences Of Violation
One facade silently stops working. Users get unexpected results or errors from the wrong facade class. Debugging is difficult because the error points to valid facade code.
---

## Rule 5: Know That Console Boot Skips RegisterFacades
---
## Category
Framework Usage
---
## Rule
Always import facades with explicit `use` statements in Artisan commands — never rely on `config/app.php` aliases.
---
## Reason
The Console kernel's bootstrapper list does NOT include `RegisterFacades`. Facade aliases registered in `config/app.php` are never created during console boot. Any code that uses alias-only facade references in console commands will throw a class-not-found error.
---
## Bad Example
```php
use Illuminate\Console\Command;

class ProcessReports extends Command
{
    public function handle()
    {
        Cache::get('report_key'); // Class not found — alias unavailable in console
    }
}
```
---
## Good Example
```php
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache; // Explicit import

class ProcessReports extends Command
{
    public function handle()
    {
        Cache::get('report_key'); // Works — explicit import resolves facade class
    }
}
```
---
## Exceptions
Console commands that add `RegisterFacades` to the kernel's bootstrapper list — but this is rarely appropriate.
---
## Consequences Of Violation
Class-not-found errors when running artisan commands. Scheduler commands fail silently.
---

## Rule 6: Keep the Aliases Array Minimal
---
## Category
Performance
---
## Rule
Only register aliases for facades that are genuinely used in Blade templates or non-injectable contexts.
---
## Reason
Each alias entry adds autoloader overhead on first use. While individual alias registration is fast (~0.5-2µs), 100+ aliases add measurable overhead. More importantly, aliases create implicit dependencies that make code harder to refactor.
---
## Bad Example
```php
'aliases' => [
    'App' => Illuminate\Support\Facades\App::class,
    'Artisan' => Illuminate\Support\Facades\Artisan::class,
    'Auth' => Illuminate\Support\Facades\Auth::class,
    'Blade' => Illuminate\Support\Facades\Blade::class,
    'Broadcast' => Illuminate\Support\Facades\Broadcast::class,
    'Bus' => Illuminate\Support\Facades\Bus::class,
    'Cache' => Illuminate\Support\Facades\Cache::class,
    // ... 80+ aliases, many unused
],
```
---
## Good Example
```php
'aliases' => [
    // Only aliases actually used in Blade templates or non-injectable code
    'Cache' => Illuminate\Support\Facades\Cache::class,
    'Auth' => Illuminate\Support\Facades\Auth::class,
],
```
---
## Exceptions
Framework default aliases that are part of Laravel's core distribution — they can be left in place.
---
## Consequences Of Violation
Unnecessary autoloader overhead. Larger `config/app.php` file that is harder to audit. Encourages facade usage instead of constructor injection.
