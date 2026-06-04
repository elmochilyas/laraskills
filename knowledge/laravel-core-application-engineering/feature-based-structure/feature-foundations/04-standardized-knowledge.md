# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Modular Monolith Basics |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Feature-based structure organizes Laravel application code by business domain (feature) rather than by technical layer (controller, model, view). Instead of `app/Http/Controllers/`, each feature has its own directory containing all layers relevant to that feature. The engineering value is improved cohesion — code that changes together lives together. This scales better for medium-to-large Laravel applications with multiple bounded contexts.

---

## Core Concepts

- **Feature directory**: `app/Features/Billing/` contains Controllers, Models, Requests, Services, Exceptions for billing
- **Bounded context**: Each feature is a bounded context owning its models, controllers, requests, and services
- **Co-location principle**: Code that changes together lives together — all billing files in one directory
- **PSR-4 autoloading**: `App\Features\Billing\Controllers\InvoiceController` maps automatically without config changes
- **Service provider per feature**: Each feature registers its routes, views, migrations via its own provider
- **Route loading**: Per-feature `routes.php` loaded via `loadRoutesFrom()` in the feature's service provider

---

## When To Use

- Applications with 10+ models across distinct business domains
- Multi-developer or multi-team projects requiring clear ownership boundaries
- Complex business logic that goes beyond simple CRUD
- Projects expected to grow significantly over time
- Monorepo or multi-team environments needing team ownership per feature

## When NOT To Use

- Small projects (<10 models) where layer-based simplicity outweighs cohesion benefits
- Single-developer projects with simple CRUD requirements
- Rapid prototypes and MVPs where speed to delivery is the priority
- Teams unfamiliar with namespace customization and custom Artisan stubs

---

## Best Practices

- **Start with default structure, then organize by domain** — custom structures are earned by complexity, not chosen by preference
- **Each feature is a bounded context** — no feature directly accesses another feature's models; go through a service layer
- **Granularity matters** — coarse features (Billing, Users) for small teams, fine features (Invoicing, Subscriptions) for complex domains
- **Use a shared directory** — `app/Shared/` for cross-cutting code (helpers, base classes, truly shared models)
- **Avoid circular dependencies** between feature service providers
- **Document feature boundary criteria** for the team to ensure consistency

---

## Architecture Guidelines

- Feature directories follow Laravel conventions internally (Controllers/, Models/, Services/)
- Service provider registers feature: `$this->loadRoutesFrom(__DIR__.'/../routes.php')`
- View namespacing: `$this->loadViewsFrom(__DIR__.'/../views', 'billing')` enables `billing::invoices.index`
- Migration loading: `$this->loadMigrationsFrom(__DIR__.'/../Database/Migrations')`
- Autoloading in `composer.json` stays as `"App\\": "app/"` — no changes needed
- Feature namespace: `App\Features\{FeatureName}\{Layer}\{Class}`

---

## Performance

Zero runtime performance impact. All resolution happens at the autoloader level. In production, `composer dump-autoload -o` generates a classmap that eliminates filesystem overhead. View namespacing adds negligible overhead.

---

## Security

Feature-based structure does not change the security model. Authentication, authorization policies, middleware, and validation all function identically. Feature boundaries are organizational, not security boundaries.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Over-splitting | Every concept gets its own feature | Directory overhead without benefit | Feature = business domain boundary |
| Mixing structures | Some code in `app/Http/`, some in features | Confusion about where to put new code | Commit fully to one approach |
| Tight cross-feature coupling | Direct model access across features | Feature boundaries become meaningless | Expose services, not models |
| Feature boundary creep | Feature accumulates unrelated code | 50+ files in one feature | Extract sub-features at ~20 files |
| Shared model ownership confusion | Two features need same model | Both features modify the same file | Put shared models in `app/Models/` |

---

## Anti-Patterns

- **Direct cross-feature model access**: `App\Features\Billing\Models\Invoice::find($id)` from another feature
- **Feature as dumping ground**: Every new file goes in the root of the feature directory
- **Empty feature directories**: `Events/`, `Listeners/`, `Jobs/` even when not needed

---

## Examples

**Feature service provider:**
```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
        $this->loadViewsFrom(__DIR__.'/../views', 'billing');
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
    }
}
```

**Feature route file:**
```php
// app/Features/Billing/routes.php
Route::middleware(['auth'])->prefix('/billing')->group(function () {
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
});
```

**Registration in config/app.php:**
```php
'providers' => [
    App\Providers\AppServiceProvider::class,
    App\Features\Billing\Providers\BillingServiceProvider::class,
],
```

---

## Related Topics

- technical-vs-domain-grouping — Detailed comparison of organizational approaches
- bounded-contexts — Structuring code within a feature
- module-auto-discovery — Registering feature components
- inter-module-communication — Keeping features decoupled
- vertical-slice-architecture — Scaling feature-based apps

---

## AI Agent Notes

- Feature-based structure is also called "domain-oriented," "modular," or "package-by-feature"
- Laravel's default is layer-based; feature-based is a deliberate deviation
- No artisan generators support feature-based structure natively — custom stubs or packages needed
- `nwidart/laravel-modules` is the most popular package for modular Laravel structure
- The approach scales well to 100+ features with clear ownership boundaries

---

## Verification

- [ ] Each feature has its own service provider
- [ ] Routes loaded per-feature via `loadRoutesFrom()`
- [ ] Views loaded with namespace prefix via `loadViewsFrom()`
- [ ] Migrations loaded per-feature via `loadMigrationsFrom()`
- [ ] No direct cross-feature model imports (enforced via static analysis)
- [ ] Shared models in `app/Models/` not duplicated across features
- [ ] `composer dump-autoload -o` runs in deployment
- [ ] Artisan stubs customized for feature namespaces
