# Rules

## Rule 1: Prefer Compile-Time Exclusion Over Runtime Guards
---
## Category
Performance
---
## Rule
Use conditional `$app->register()` in a proxy provider instead of environment checks inside `register()` or `boot()`.
---
## Reason
Compile-time exclusion prevents the provider class from ever being instantiated in non-target environments. Runtime guards still load the file, invoke the constructor, and allocate memory — all wasted overhead.
---
## Bad Example
```php
class DebugServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('local')) {
            $this->app->singleton(Debugbar::class);
        }
    }
    // Provider still instantiated on every request in production
}
```
---
## Good Example
```php
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('local')) {
            $this->app->register(DebugbarServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);
        }
    }
}
```
---
## Exceptions
When you need to conditionally register bindings within a provider that also has boot-time artifacts required in all environments — use a runtime guard on the specific binding only.
---
## Consequences Of Violation
Wasted PHP class loading, memory allocation, and instantiation cost in production for development-only providers; slower bootstrap time in production.

## Rule 2: Use Config-Driven Guards Over Hard-Coded Environment Strings
---
## Category
Maintainability
---
## Rule
Guard conditional provider registration with `config('app.debug')` or a custom config value instead of `$this->app->environment('local')`.
---
## Reason
Environment strings couple logic to specific environment names. Config-driven checks are more flexible — they allow conditional registration based on feature flags or non-environment criteria without changing code.
---
## Bad Example
```php
public function register(): void
{
    if ($this->app->environment('local', 'staging')) {
        $this->app->register(TelescopeServiceProvider::class);
    }
    // Adding a new environment requires changing code
}
```
---
## Good Example
```php
public function register(): void
{
    if (config('telescope.enabled')) {
        $this->app->register(TelescopeServiceProvider::class);
    }
    // Toggle via .env: TELESCOPE_ENABLED=true
}
```
---
## Exceptions
When using a framework-level safeguard that must match `APP_ENV` exactly (e.g., never register debug tools if `APP_ENV=production` regardless of config).
---
## Consequences Of Violation
Code changes required when environment naming changes; reduced flexibility; accidental registration when environment misconfigured.

## Rule 3: Use `dont-discover` for Development Packages, Then Conditionally Register
---
## Category
Security
---
## Rule
Exclude development-only packages using `extra.laravel.dont-discover` in your root `composer.json`, then manually register them in a conditional proxy provider.
---
## Reason
Auto-discovered packages are always registered regardless of environment. Excluding via `dont-discover` prevents their provider from being auto-registered, giving you explicit control over when they load.
---
## Bad Example
```json
{
    "extra": {
        "laravel": {
            // Debugbar auto-discovered — registers in production too
        }
    }
}
```
---
## Good Example
```json
{
    "extra": {
        "laravel": {
            "dont-discover": [
                "barryvdh/laravel-debugbar",
                "laravel/telescope"
            ]
        }
    }
}
```
Then in a proxy provider:
```php
public function register(): void
{
    if (config('app.debug')) {
        $this->app->register(\Barryvdh\Debugbar\ServiceProvider::class);
    }
}
```
---
## Exceptions
Open-source packages intended for all environments should not use `dont-discover`; rely on the consuming application's governance.
---
## Consequences Of Violation
Development tooling registered in production; sensitive data leaked via debug bars; stack traces exposed to end users; wasted bootstrap overhead.

## Rule 4: Audit Production Provider List to Exclude Development Providers
---
## Category
Security
---
## Rule
Validate the production provider list as part of your deployment pipeline — confirm no development-only providers (Debugbar, Telescope, IDE helpers) are registered.
---
## Reason
Development providers can leak config values, stack traces, database queries, and other sensitive information. Automated validation in CI catches accidental inclusions before they reach production.
---
## Bad Example
```bash
# Deploy without checking which providers are registered
# Telescope was accidentally left in production
```
---
## Good Example
```bash
# CI deployment step
php artisan about --json | php -r "
    \$providers = json_decode(file_get_contents('php://stdin'), true);
    \$blocked = ['Debugbar', 'Telescope', 'Clockwork'];
    foreach (\$providers['providers'] ?? [] as \$p) {
        foreach (\$blocked as \$b) {
            if (str_contains(\$p, \$b)) { exit(1); }
        }
    }
"
```
---
## Exceptions
Applications intentionally deploying debug tooling behind IP-restricted middleware in staging environments may allow certain providers — document each exception.
---
## Consequences Of Violation
Sensitive data leaks; security audit findings; compliance violations (GDPR, SOC2); increased attack surface on production servers.

## Rule 5: Never Use Environment Guards Inside Deferred Providers
---
## Category
Reliability
---
## Rule
Do not place environment-dependent logic inside a deferred provider's `register()` or `boot()`.
---
## Reason
Deferred providers load mid-request on first service resolution. The environment at manifest-build time may differ from load time (e.g., during deployment with rolling updates), leading to non-deterministic behavior.
---
## Bad Example
```php
class AnalyticsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            $this->registerProductionAnalytics();
        }
    }
    // Environment may differ between manifest build and load time
}
```
---
## Good Example
```php
// Use eager proxy with environment check, then delegate to deferred
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('production')) {
            $this->app->register(AnalyticsServiceProvider::class);
        }
    }
}
```
---
## Exceptions
Deferred providers using configuration (which is cached and environment-independent) rather than the runtime `environment()` call may use config-driven guards.
---
## Consequences Of Violation
Non-deterministic behavior in production; environment-appropriate code failing to execute; subtle bugs that are difficult to reproduce locally.
