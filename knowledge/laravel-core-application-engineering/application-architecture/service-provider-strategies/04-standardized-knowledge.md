# ECC Standardized Knowledge — Service Provider Strategies

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Service Provider Strategies |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Service Registration |
| **Last Updated** | 2026-06-02 |

---

## Overview

Service providers are the registration mechanism through which all Laravel services — framework and application — are bound into the container. Every class, configuration, event listener, route, and command that a package or application contributes passes through a service provider. Understanding provider strategy means understanding three dimensions: **timing** (eager vs deferred), **phase** (register vs boot), and **organization** (single provider per domain vs per package).

The most important architectural insight: providers are composition roots — the single location where dependency injection wiring decisions are made. Keeping providers as thin binding registries (register phase only) and moving complex initialization to dedicated classes is the dominant expert recommendation.

---

## Core Concepts

### Eager Providers
Instantiated on every request's bootstrap cycle. Listed in `config/app.php` `providers` array (Laravel 10-) or loaded via `bootstrap/app.php` (Laravel 11+). Necessary when services must be available on every request.

### Deferred Providers
Not instantiated during bootstrap. Bindings are registered in a manifest (`bootstrap/cache/services.php`). When a deferred binding is resolved at runtime, the manifest is looked up, provider instantiated, and `register()`/`boot()` called. Set `protected $defer = true` and implement `provides()`.

### register() Phase
Only container bindings. No service resolution, no facades, no side effects. Runs before any provider's `boot()`.

### boot() Phase
Interaction with resolved services, event listeners, route registration, model observers. Dependencies may be injected via method injection — type-hinted `boot()` parameters are resolved from the container.

### Provider Manifest
Compiled by `Illuminate\Foundation\ProviderRepository` during `php artisan optimize`. Maps each deferred service abstract to its provider class.

### Package Auto-Discovery
Composer's `installed.json` is scanned for packages with `extra.laravel.providers` entries. Results are cached in `bootstrap/cache/packages.php`.

---

## When To Use

- **Application service registration** — all bindings go through providers
- **Package integration** — every Laravel package exposes a service provider
- **Domain module registration** — modular monoliths use one provider per domain
- **Conditional service loading** — environment-gated providers (debug toolbars, profilers)
- **Deferred provider for expensive services** — queue, mail, broadcasting that aren't used on every request

---

## When NOT To Use

- **Business logic** — providers are composition roots, not business logic containers
- **Database queries** — never query the database in `register()` or `boot()`
- **Hardcoded configuration** — use config files, not provider code, for configurable values
- **Controller placement** — controllers should not be registered or configured in providers

---

## Best Practices

### Keep register() Thin
Only `$this->app->bind()`, `$this->app->singleton()`, `$this->app->instance()`, `$this->app->tag()` calls.

**Why:** Thin `register()` makes container bindings easy to audit and avoids the temptation to resolve services during registration. Complex registration logic should be extracted to dedicated classes.

### Use Method Injection in boot()
Declare dependencies as type-hinted parameters in `boot()`.

**Why:** The container resolves dependencies at call time via `call()`. This is cleaner than calling `$this->app->make()` manually and makes dependencies explicit.

### Defer Expensive Providers
Set `$defer = true` for providers whose services are not used on every request.

**Why:** Deferred providers avoid instantiation, register, and boot cost until first resolution. This can reduce bootstrap time by 30-70% for large applications.

### Organize by Domain
One provider per domain/bounded context in modular applications.

**Why:** Domain providers provide clear ownership boundaries, enable selective registration, and scale to large teams.

---

## Architecture Guidelines

### Provider Order
1. Core framework providers (cache, config, auth, session)
2. Third-party package providers
3. Application domain providers
4. Application bootstrap provider (AppServiceProvider)

### Deferred Provider Contract
- Set `protected $defer = true`
- Implement `provides()` returning all bound abstracts
- Never resolve services in `register()` (deferred providers also follow the register/boot contract)

### Registration Gateway Pattern
```php
public function register()
{
    if ($this->app->environment('production')) {
        $this->app->register(ProductionServiceProvider::class);
    }
}
```
`$this->app->register()` inside `register()` causes immediate sub-provider registration within the current phase.

---

## Performance Considerations

### Provider Instantiation Cost
20 eager providers add 2-5ms to bootstrap time. Deferred providers avoid this entirely until first resolution.

### Manifest Lookup
Deferred resolution adds a hash map lookup (O(1), <0.1ms). Negligible overhead.

### Boot Phase Cost
The `boot()` phase iterates all loaded providers. Heavy `boot()` methods (model observation, route building) dominate bootstrap time.

### Optimize Command
`php artisan optimize` compiles: deferred manifest, package discovery, facade aliases. Without it, deferred providers fall back to eager loading.

---

## Security Considerations

### Environment Gating
Debug/profiler providers should only register in non-production environments. Use `$this->app->environment('production')` gating.

### Package Discovery Integrity
If `bootstrap/cache/packages.php` is corrupted, package providers may not load. Verify with `php artisan package:discover`.

### Provider Order Exploitation
An attacker who can modify `config/app.php` provider order can change application behavior. Protect the config file with filesystem permissions.

---

## Common Mistakes

### Business Logic in Providers
Desc: Database queries, API calls, complex calculations in `register()` or `boot()`.
Cause: Using providers as a convenient place for initialization logic.
Consequence: Logic runs on every request, coupling behavior to registry timing, untestable without booting the provider.
Better: Extract initialization logic to dedicated service classes.

### Service Resolution in register()
Desc: Calling `$this->app->make()` during `register()`.
Cause: Not understanding the two-phase contract.
Consequence: Resolved service may be partially initialized — `boot()` hasn't run yet.
Better: Move service resolution to `boot()`.

### Over-Deferring
Desc: Making a provider deferred when its service is used on 80%+ of requests.
Cause: Assuming deferred is always better.
Consequence: Adds complexity without benefit — the provider is loaded on most requests anyway.
Better: Profile usage; if service is resolved on >80% of requests, make it eager.

### Forgetting provides() for Deferred
Desc: Deferred provider without `provides()`.
Cause: Implementing `$defer` but forgetting the method.
Consequence: Service not found when resolved — `BindingResolutionException`.
Better: Always implement `provides()` returning all bound abstracts.

---

## Anti-Patterns

### God Provider
A single provider that registers everything — all bindings, all events, all routes, all commands. Violates single responsibility, makes selective deferral impossible, and creates a monolithic registration point.

### Provider as Service Locator
Using the provider as a place to call `$this->app->make()` and start using services. Providers wire dependencies; they don't use them (except in `boot()`).

### Hardcoded Dependencies
Registering implementation classes directly instead of binding interfaces. This defeats polymorphic substitution and makes testing harder.

---

## Examples

### Deferred Provider
```php
class MailServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function register()
    {
        $this->app->singleton(Mailer::class, MailManager::class);
    }

    public function provides(): array
    {
        return [Mailer::class, MailManager::class];
    }
}
```

### Domain Provider Pattern
```php
class SalesServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(OrderRepository::class, EloquentOrderRepository::class);
        $this->app->singleton(InventoryService::class);
    }

    public function boot(OrderObserver $observer)
    {
        Order::observe($observer);
    }
}
```

---

## Related Topics

### Prerequisites
- **Service Container Basics** — Providers populate the container
- **Bootstrapping Lifecycle** — Provider execution during bootstrap

### Closely Related
- **Directory Conventions** — Provider file location in `app/Providers/`
- **Configuration Management** — Config files consumed by providers

### Advanced
- **Feature Service Providers** — Module auto-discovery and registration
- **Deferred Provider Manifest** — Internal mechanics of manifest compilation

### Cross-Domain
- **Package Development** — Creating providers for distributable packages

---

## AI Agent Notes

### Important Decisions
- Laravel 11+ introduced `bootstrap/app.php` provider registration outside `config/app.php`
- `$defer` property is deprecated in Laravel 11+ but functional for backward compatibility
- Package auto-discovery was introduced in Laravel 5.5 and is stable since

### Important Constraints
- `register()` must not resolve services — only bind them
- `boot()` may declare dependencies via method injection
- Provider order determines both register and boot order
- Deferred providers cannot be partially deferred — all their bindings are deferred together

### Rules Generation Hints
- Enforce thin `register()` — only binding calls, no resolution
- Enforce `provides()` for all deferred providers
- Enforce environment gating for debug/profiler providers

---

## Verification

This document has been validated against:
- `Illuminate\Support\ServiceProvider` — base class, `register()`, `boot()`, `provides()`
- `Illuminate\Foundation\ProviderRepository` — manifest compilation and deferred management
- `Illuminate\Foundation\PackageManifest` — package auto-discovery scanning
- Default provider list from `config/app.php` (24 total)
