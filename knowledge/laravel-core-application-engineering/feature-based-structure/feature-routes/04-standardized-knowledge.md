# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Vertical Slice Architecture |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Feature routes co-locate route definitions with the feature they belong to. Instead of a single `routes/web.php` containing all routes, each feature has its own `routes.php` file loaded by the feature's service provider. The engineering value is modular route management: removing a feature means deleting its directory (and unregistering its provider). Routes for a single feature are found in one place, not scattered across multiple route files.

---

## Core Concepts

- **Per-feature route file**: `app/Features/Billing/routes.php` with all billing endpoints
- **Loading via service provider**: `$this->loadRoutesFrom(__DIR__.'/../routes.php')`
- **Route loading order**: Determined by provider order in `config/app.php` — first listed, first loaded
- **Route caching**: Works identically with feature routes — `php artisan route:cache` includes all feature routes
- **Prefix and name conventions**: Feature-specific prefixes (`/billing`) and name prefixes (`billing.*`) to prevent collisions

---

## When To Use

- Feature-based structure where routes should live with their feature
- Applications with 5+ features each having multiple routes
- Teams that want route files co-located with controllers
- Projects where features may be extracted into packages

## When NOT To Use

- Small applications with <20 routes where a single `web.php` is simpler
- Teams that prefer a centralized view of all routes
- When route caching is not used and route file organization doesn't matter

---

## Best Practices

- **Always use route caching in production** (`php artisan route:cache`) — eliminates any performance difference
- **Use consistent prefix and name conventions** across features (`billing.*`, `users.*`)
- **Avoid route closures** — they break route caching; use controller classes
- **Use named routes** instead of hardcoded URLs to prevent prefix mismatches
- **Use unique prefixes per feature** to avoid route collisions
- **Verify with `php artisan route:list`** that all feature routes are loaded

---

## Architecture Guidelines

- Route file at `app/Features/{Feature}/routes.php`
- Route groups with middleware, prefix: `Route::middleware(['auth'])->prefix('/billing')`
- API routes with `Route::apiResource()` for RESTful endpoints
- Livewire routes use component class: `Route::get('/billing/invoices', InvoicesList::class)`
- Route model binding in features via explicit binding or `Route::model()` in service provider
- Named routes with feature prefix: `->name('billing.invoices.index')`

---

## Performance

Route caching eliminates any performance difference between feature routes and global routes. On cached requests, Laravel reads all routes from a single compiled file — no per-feature loading overhead. Without caching, `loadRoutesFrom()` internally uses PHP's `require`, which is negligible.

---

## Security

Feature routes are subject to the same middleware, authentication, and CSRF protection as any other route. Route model binding with feature-namespaced models works identically. No special security considerations.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Route closures in feature files | Convenience | Breaks route caching | Use controller or invokable class |
| Hardcoded URLs without prefix | Ignoring route prefix | 404 errors after prefix change | Use `route('name')` helper |
| Route name collisions | No feature-specific prefix | One route overwrites another | Use `billing.invoices.*` namespacing |
| Feature route not loaded | Wrong path in `loadRoutesFrom()` | Silent 404 on feature routes | Verify with `php artisan route:list` |
| Stale cached routes | Forgetting to re-cache after adding routes | New routes return 404 | Run `route:cache` in deployment |

---

## Anti-Patterns

- **Route closures**: `Route::get('/health', function () { return 'ok'; })` — breaks route caching
- **Hardcoded URLs**: `return redirect('/invoices')` instead of `redirect()->route('billing.invoices.index')`
- **No prefix isolation**: Two features both use `/admin` prefix without coordination
- **Wrong load path**: Hardcoded absolute path in `loadRoutesFrom()` that breaks when feature moves

---

## Examples

**Feature route file:**
```php
// app/Features/Billing/routes.php
Route::middleware(['auth', 'verified'])->prefix('/billing')->name('billing.')->group(function () {
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
});
```

**Loading from service provider:**
```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
    }
}
```

**Route model binding in feature:**
```php
// In service provider boot
Route::model('invoice', App\Features\Billing\Models\Invoice::class);

// Or in route file
Route::bind('invoice', function (string $value) {
    return App\Features\Billing\Models\Invoice::findOrFail($value);
});
```

---

## Related Topics

- modular-monolith-basics — Overall structure
- module-auto-discovery — How routes are loaded
- bounded-contexts — Where the routes file lives
- technical-vs-domain-grouping — Comparing route organization approaches
- vertical-slice-architecture — Managing routes across many features

---

## AI Agent Notes

- `loadRoutesFrom()` calls PHP's `require` internally
- Route caching serializes all routes into `bootstrap/cache/routes-v7.php`
- Route cache is invalidated when the cache file's modification time changes
- Features can have multiple route files for different middleware groups
- Route caching does NOT work with route closures (callable closures)
- `php artisan route:list` shows the full feature path in the "Action" column

---

## Verification

- [ ] Each feature has its own route file
- [ ] Routes loaded via `loadRoutesFrom()` in service provider
- [ ] Route caching works: `php artisan route:cache`
- [ ] No route closures in feature files
- [ ] Named routes use feature-specific prefix (`billing.*`)
- [ ] Route prefixes are unique across features
- [ ] `php artisan route:list` shows all feature routes
- [ ] Route caching runs in deployment
