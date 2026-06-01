---
paths:
  - "**/*.php"
---

# Laravel 13 Service Provider Rules

> This file extends [common/patterns.md](../common/patterns.md) with Service Provider-specific rules.

## Register vs Boot

- `register()` — container bindings ONLY
- `boot()` — runtime configuration (events, routes, views, middleware)

**Forbidden in `register()`:**

```php
public function register(): void
{
    // FORBIDDEN:
    Route::get(...);
    DB::table(...)->get();
    auth()->user();
    View::share(...);
    Event::listen(...);
}
```

## Deferred Providers

Implement `DeferrableProvider` for expensive services loaded only when needed:

```php
use Illuminate\Contracts\Support\DeferrableProvider;

class AIServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function provides(): array
    {
        return [AIClient::class];
    }
}
```

Use for: AI clients, payment SDKs, search engines, heavy integrations.

## Provider Organization

Small apps: `AppServiceProvider`, `EventServiceProvider`.

Large apps — one provider per domain:

```
Providers/
├── BillingServiceProvider.php
├── NotificationServiceProvider.php
├── ReportingServiceProvider.php
└── SearchServiceProvider.php
```

## Dynamic Loading

```php
if ($this->app->environment('production')) {
    $this->app->register(ProductionOptimizationProvider::class);
}
```

## See Also

- Skill: `laravel-core-internals` for provider lifecycle
- Skill: `laravel-tdd` for testing providers
- Rule: `rules/laravel/service-container.md` for container bindings
