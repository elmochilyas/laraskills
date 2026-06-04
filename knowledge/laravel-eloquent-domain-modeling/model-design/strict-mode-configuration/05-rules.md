# Phase 5: Rules — Strict Mode Configuration

## Rule: Enable `Model::shouldBeStrict()` in Non-Production Environments
---
## Category
Reliability
---
## Rule
Always call `Model::shouldBeStrict()` in non-production environments (local, staging, testing) to enable lazy loading prevention, silent discarding prevention, and missing attribute prevention.
---
## Reason
Convenience-oriented defaults silently hide data-integrity issues: lazy loading masks N+1 queries, silently discarded attributes cause data loss, and missing attribute access produces nulls without warnings. Strict mode surfaces these as exceptions immediately.
---
## Bad Example
```php
// In AppServiceProvider::boot():
// No strict mode — all three protections are disabled
```
---
## Good Example
```php
// In AppServiceProvider::boot():
Model::shouldBeStrict(! $this->app->isProduction());
```
---
## Exceptions
Production should not use `shouldBeStrict()` indiscriminately due to performance and compatibility concerns; use individual controls instead.
---
## Consequences Of Violation
N+1 queries silently degrade performance; mass-assignment data loss goes undetected; missing attribute access produces subtle null-propagation bugs.
---

## Rule: Use Individual Controls for Fine-Grained Production Configuration
---
## Category
Scalability
---
## Rule
Configure `preventLazyLoading`, `preventSilentlyDiscardingAttributes`, and `preventAccessingMissingAttributes` individually in production instead of using `shouldBeStrict()`.
---
## Reason
Each protection has different performance and compatibility tradeoffs in production. Individual controls allow enabling only the protections that are acceptable for production traffic, tuning per deployment phase.
---
## Bad Example
```php
// Production — monolithic shouldBeStrict():
Model::shouldBeStrict(true);
// No flexibility to disable individual protections
```
---
## Good Example
```php
// Production — granular control:
Model::preventLazyLoading();
Model::preventSilentlyDiscardingAttributes();
// preventAccessingMissingAttributes omitted — minor overhead tradeoff accepted
```
---
## Exceptions
A production environment that has finished monitoring and accepts all three protections may use `shouldBeStrict()` for simplicity.
---
## Consequences Of Violation
Cannot selectively disable protections for performance or compatibility; forced all-or-nothing tradeoff between safety and overhead.
---

## Rule: Use Custom Handler for Admin Panel Lazy Loading
---
## Category
Reliability
---
## Rule
Pass a custom throw callback to `preventLazyLoading()` that logs the violation instead of throwing for admin panel requests.
---
## Reason
Admin panels (Nova, Filament, custom dashboards) commonly use lazy loading for table columns and detail views. Throwing exceptions on these pages breaks admin functionality. Logging violations captures the problem for later optimization without disrupting admin workflows.
---
## Bad Example
```php
// Admin panel lazy loading throws exceptions:
Model::preventLazyLoading();
// Admin pages crash when accessing unloaded relations
```
---
## Good Example
```php
Model::preventLazyLoading(
    throw: fn () => request()->is('admin/*') ? false : true
);
// Optionally log for non-admin too:
Model::preventLazyLoading(
    throw: function () {
        Log::warning('Lazy loading detected', ['url' => request()->url()]);
        return false;
    }
);
```
---
## Exceptions
Admin panels that eager-load all relationships upstream may not need the exception.
---
## Consequences Of Violation
Admin pages throw 500 errors; lazy loading is disabled entirely in admin context, forcing developers to choose between broken UIs and disabled protection.
---

## Rule: Enable Strict Mode in Test Environment
---
## Category
Testing
---
## Rule
Enable `Model::shouldBeStrict()` in the test environment configuration or base test case `setUp()` to catch violations during CI before they reach production.
---
## Reason
Tests exercise more code paths than manual QA. Strict mode in tests surfaces N+1 queries, silently discarded attributes, and missing attribute access in CI, preventing these bugs from reaching production.
---
## Bad Example
```php
// In phpunit.xml — no strict mode:
<env name="APP_ENV" value="testing"/>
// Tests pass but N+1 queries and silent discarding go undetected
```
---
## Good Example
```php
// In AppServiceProvider::boot():
Model::shouldBeStrict(app()->environment('testing', 'local', 'staging'));

// Or in tests/TestCase.php:
protected function setUp(): void
{
    parent::setUp();
    Model::shouldBeStrict();
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Strict-mode violations reach production undetected; debugging requires production log analysis or customer reports instead of CI feedback.
---

## Rule: Never Deploy Without `preventSilentlyDiscardingAttributes`
---
## Category
Security
---
## Rule
Always enable `preventSilentlyDiscardingAttributes` in every environment including production.
---
## Reason
Silently discarded attributes cause data loss — mass-assigning attributes not in `$fillable` produces no error but the data is gone. This makes debugging nearly impossible because the operation appears to succeed. The runtime cost is negligible.
---
## Bad Example
```php
// No silent discarding prevention:
// $order->update(['status' => 'paid', 'internal_note' => 'fraud review']);
// internal_note silently discarded — no error, no data
```
---
## Good Example
```php
// In AppServiceProvider::boot():
Model::preventSilentlyDiscardingAttributes();

// Now $order->update(['status' => 'paid', 'internal_note' => 'fraud review']);
// Throws MassAssignmentException — developer knows the attribute is not fillable
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent data loss on mass-assignment operations; debugging impossible because errors are swallowed; data integrity compromised.
---

## Rule: Combine `preventAccessingMissingAttributes` with Strict Typing
---
## Category
Reliability
---
## Rule
Enable `preventAccessingMissingAttributes` and pair it with a strict attribute access pattern that never relies on null defaults for non-existent columns.
---
## Reason
Accessing a non-existent attribute returns `null` by default. This silently masks typos in column names, casting errors, and schema-model mismatches. `preventAccessingMissingAttributes` surfaces the mismatch immediately.
---
## Bad Example
```php
// No missing attribute prevention:
$price = $order->total_cents; // Typo — should be 'total_cents'
// Returns null, no error — downstream code breaks subtly
```
---
## Good Example
```php
Model::preventAccessingMissingAttributes();

// In AppServiceProvider::boot():

$price = $order->total_cents; // Typo — throws MissingAttributeException
// Error surfaces immediately, developer fixes column name
```
---
## Exceptions
Models with dynamic attributes (JSON columns, EAV patterns) must disable this protection or handle missing attributes explicitly.
---
## Consequences Of Violation
Typo-caused null propagation produces bugs that are difficult to trace; schema-model mismatches go undetected until data flows through the application.
---

## Rule: Log Instead of Silently Allow Lazy Loading in Production
---
## Category
Performance
---
## Rule
Configure the `LazyLoadingViolationException` handler to log violations in production rather than silently permitting or unconditionally throwing.
---
## Reason
Silent lazy loading in production degrades performance through N+1 queries but goes undetected. Logging violations creates an audit trail that the development team can use to identify and fix eager-loading gaps.
---
## Bad Example
```php
// No lazy loading prevention at all in production:
// N+1 queries degrade performance with no visibility
```
---
## Good Example
```php
// In AppServiceProvider::boot():
Model::preventLazyLoading(
    throw: function () {
        Log::warning('Lazy loading violation', [
            'url' => request()->url(),
            'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 5),
        ]);
        return false; // Do not throw — log and continue
    }
);
```
---
## Exceptions
High-throughput endpoints where the logging overhead itself becomes a performance concern may selectively disable logging for specific models.
---
## Consequences Of Violation
N+1 queries degrade production performance invisibly; performance regression is only noticed when infrastructure metrics alert, losing the query context needed for a fix.
---

## Rule: Create a Dedicated Service Provider for Strict Mode
---
## Category
Code Organization
---
## Rule
Place all strict mode configuration in a dedicated `App\Providers\ModelStrictServiceProvider` instead of the `AppServiceProvider`.
---
## Reason
`AppServiceProvider` is a catch-all that grows over time. A dedicated provider for Eloquent strict mode is self-documenting — its purpose is clear from the class name alone — and keeps `AppServiceProvider` focused on application-level concerns.
---
## Bad Example
```php
// AppServiceProvider::boot() — crowded with unrelated concerns:
public function boot(): void
{
    Model::shouldBeStrict();
    Paginator::useBootstrapFive();
    Validator::extend(...);
    Mail::alwaysTo(...);
}
```
---
## Good Example
```php
// App\Providers\ModelStrictServiceProvider.php
class ModelStrictServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Model::shouldBeStrict(app()->isProduction() === false);

        if (app()->isProduction()) {
            Model::preventLazyLoading(
                throw: fn () => Log::warning(...) && false
            );
        }
    }
}
```
---
## Exceptions
Small applications with minimal boot configuration may keep strict mode in `AppServiceProvider`.
---
## Consequences Of Violation
`AppServiceProvider` accumulates unrelated concerns; strict mode configuration is buried among pagination, validation, and mail configuration.
---

## Rule: Enable Strict Mode in CI Pipeline
---
## Category
Testing
---
## Rule
Configure the CI pipeline to use a `testing` environment that has `Model::shouldBeStrict()` enabled and fails the build on any strict mode violation.
---
## Reason
Strict mode violations caught in CI never reach production. A CI gate that fails on lazy loading, silent discarding, or missing attributes enforces data integrity as a non-negotiable standard across all contributors.
---
## Bad Example
```php
// CI runs tests without strict mode — violations pass CI:
//  - N+1 queries pass tests
//  - Silently discarded attributes don't cause test failures
//  - Missing attribute access produces null, not exceptions
```
---
## Good Example
```php
// .env.ci or phpunit.xml:
APP_ENV=testing

// AppServiceProvider:
Model::shouldBeStrict(app()->environment('testing'));

// CI build fails on any strict mode violation
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Strict mode violations accumulate in the codebase; the first time someone enables strict mode locally, dozens of violations surface, creating a painful clean-up sprint.
