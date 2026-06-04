# Feature-Based Structure Foundations

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Foundations
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Feature-based structure organizes Laravel application code by business domain (feature) rather than by technical layer (controller, model, view). Instead of `app/Http/Controllers/`, `app/Models/`, `app/Http/Requests/`, each feature has its own directory containing all layers relevant to that feature: `app/Features/Billing/Controllers/`, `app/Features/Billing/Models/`, `app/Features/Billing/Requests/`.

The engineering value is improved cohesion — code that changes together lives together. When adding a new billing feature, all related files are in one directory, not scattered across 6+ top-level directories. This scales better for medium-to-large Laravel applications with multiple bounded contexts.

---

## Core Concepts

### Layer-Based (Traditional) Structure

```
app/
  Http/
    Controllers/
      BillingController.php
      UserController.php
      TeamController.php
    Requests/
      BillingRequest.php
      UserRequest.php
    Middleware/
      ...
  Models/
    Billing.php
    User.php
    Team.php
  Services/
    BillingService.php
    UserService.php
  Exceptions/
    BillingException.php
```

### Feature-Based Structure

```
app/
  Features/
    Billing/
      Controllers/
        InvoiceController.php
        SubscriptionController.php
      Models/
        Invoice.php
        Subscription.php
      Requests/
        StoreInvoiceRequest.php
      Services/
        InvoiceService.php
      Exceptions/
        BillingException.php
      Providers/
        BillingServiceProvider.php
      routes.php
    Users/
      Controllers/
        UserController.php
      Models/
        User.php
      Requests/
        StoreUserRequest.php
      Services/
        UserService.php
    Teams/
      Controllers/
        TeamController.php
      Models/
        Team.php
        TeamMember.php
```

---

## Mental Models

### The Bounded Context

Each feature is a bounded context (from Domain-Driven Design). The `Billing` feature owns its models, controllers, requests, and services. No feature directly accesses another feature's models — it goes through a service layer or interface. This prevents coupling spiraling out of control as the app grows.

### The Co-location Principle

Code that changes together lives together. When you modify billing logic, you change files in `app/Features/Billing/`. You don't jump between `app/Models/Billing.php`, `app/Services/BillingService.php`, `app/Http/Controllers/BillingController.php`. Everything is in one place.

---

## Internal Mechanics

### Autoloading

Laravel's PSR-4 autoloader handles feature-based directories automatically if they're under the `App\` namespace:

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/"
        }
    }
}
```

`App\Features\Billing\Controllers\InvoiceController` maps to `app/Features/Billing/Controllers/InvoiceController.php` automatically.

### Service Provider Registration

Each feature can have its own service provider registered in `config/app.php`:

```php
'providers' => [
    // ...
    App\Features\Billing\Providers\BillingServiceProvider::class,
    App\Features\Users\Providers\UsersServiceProvider::class,
],
```

### Route Loading

Routes can be defined per feature:

```php
// app/Features/Billing/routes.php
Route::middleware(['auth'])->prefix('/billing')->group(function () {
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
});
```

Loaded from the feature's service provider:

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
    }
}
```

---

## Patterns

### Feature Discovery

Use a `composer dump-autoload` friendly pattern — no need to manually register each feature:

```php
// AppServiceProvider
foreach (glob(app_path('Features/*'), GLOB_ONLYDIR) as $feature) {
    $featureName = basename($feature);
    $provider = "App\\Features\\{$featureName}\\Providers\\{$featureName}ServiceProvider";
    if (class_exists($provider)) {
        $this->app->register($provider);
    }
}
```

### Feature Namespace Configuration

Customize the namespace in `composer.json` if needed:

```json
{
    "autoload": {
        "psr-4": {
            "App\\Features\\": "app/Features/"
        }
    }
}
```

---

## Architectural Decisions

### Feature vs Layer: Project Size Threshold

| Project Size | Recommended Structure | Rationale |
|---|---|---|
| < 10 models | Layer-based | Simple navigation; less ceremony |
| 10-50 models | Feature-based or Hybrid | Cohesion benefits outweigh overhead |
| 50+ models | Feature-based | Essential for maintainability |
| Monorepo / multi-team | Feature-based | Team ownership per feature |

### Feature Granularity

| Granularity | Example | When |
|---|---|---|
| Coarse | `Billing`, `Users`, `Teams` | Small team, simple domains |
| Fine | `Invoicing`, `Subscriptions`, `Payments` | Complex domain, dedicated teams |
| Too fine | `InvoiceGeneration`, `InvoicePDF`, `InvoiceEmail` | Over-engineering; too many directories |

---

## Tradeoffs

| Concern | Feature-Based | Layer-Based |
|---|---|---|
| Navigation | Feature directory == all related files | Need to know which layer a concern lives in |
| Cross-feature refactoring | Move directory | Move across many directories |
| New dev onboarding | Learn one feature at a time | Learn the full stack at once |
| Framework conventions | Deviates from Laravel defaults | Follows Laravel defaults |
| Tool compatibility | Most tools work (IDE, static analysis) | All tools work natively |

---

## Performance Considerations

Feature-based structure has zero runtime performance impact. All resolution happens at the autoloader level (composer's optimized autoloader maps classes to files). In production, `composer dump-autoload -o` generates a classmap that eliminates filesystem overhead.

---

## Production Considerations

- Run `composer dump-autoload -o` in production for optimal autoloading
- Use a consistent directory convention within each feature (Controllers/, Models/, etc.)
- Document the feature boundary criteria for your team
- Keep a top-level `app/Shared/` directory for truly cross-cutting code (helpers, base classes)
- Avoid circular service dependencies between features
- Consider `laravel-modules` or `nwidart/laravel-modules` if you need a structured package approach

---

## Common Mistakes

### Over-Splitting

Every new concept does not need its own feature. A feature should represent a business domain boundary, not a technical grouping. If two features always change together, they're one feature.

### Mixing Structures

Don't keep some code in `app/Http/Controllers/` while also having `app/Features/Billing/Controllers/`. Commit fully to feature-based or don't start. Partial adoption creates confusion about where to put new code.

### Tight Cross-Feature Coupling

```php
// Bad — Feature A directly accesses Feature B's model
$invoice = App\Features\Billing\Models\Invoice::find($id);

// Good — Feature B exposes a service
$invoice = app(InvoiceService::class)->find($id);
```

---

## Failure Modes

### Feature Boundary Creep

A feature grows beyond its original scope, accumulating unrelated code. The `Billing` feature now includes notification templates, user preferences, and audit logs. Solution: extract sub-features when a single feature exceeds ~20 files.

### Shared Model Ownership

Two features need the same model (e.g., `User` is used by `Billing` and `Teams`). Put shared models in `app/Models/` (or `app/Shared/Models/`) — they don't belong to any single feature. Each feature may have feature-specific pivot models or view models.

---

## Ecosystem Usage

Laravel's PSR-4 autoloading natively supports feature-based namespaces. The `ServiceProvider` class provides `loadRoutesFrom()`, `loadViewsFrom()`, and `loadMigrationsFrom()` for per-feature registration. Packages like `nwidart/laravel-modules` provide structured module support. Custom Artisan stubs can generate feature-based files.

---

## Related Knowledge Units

- **Module Organization** (this workspace) — structuring code within a feature
- **Feature vs Layer** (this workspace) — detailed comparison
- **Feature Service Providers** (this workspace) — registering feature components
- **Cross-Feature Communication** (this workspace) — keeping features decoupled
- **Large Project Structure** (this workspace) — scaling feature-based apps

---

## Research Notes

- Feature-based structure is not Laravel-specific — it's used in Rails (engines), Symfony (bundles), and Go (packages)
- Laravel's default structure is layer-based; feature-based is a deliberate deviation
- The approach is also called "domain-oriented," "modular," or "package-by-feature"
- No artisan generators support feature-based structure natively — custom stubs or packages needed
- `nwidart/laravel-modules` is the most popular package for modular Laravel structure
- The approach scales well to 100+ features with clear ownership boundaries
