# Feature Routes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Routes
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Feature routes co-locate route definitions with the feature they belong to. Instead of a single `routes/web.php` containing all routes, each feature has its own `routes.php` file loaded by the feature's service provider. This keeps route definitions close to the controllers they reference.

The engineering value is modular route management: removing a feature means deleting its directory (and unregistering its provider). Routes for a single feature are found in one place, not scattered across multiple route files.

---

## Core Concepts

### Per-Feature Route File

```php
// app/Features/Billing/routes.php
use Illuminate\Support\Facades\Route;
use App\Features\Billing\Controllers\InvoiceController;
use App\Features\Billing\Controllers\SubscriptionController;

Route::middleware(['auth', 'verified'])->prefix('/billing')->name('billing.')->group(function () {
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');

    Route::get('/subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::post('/subscriptions/plan', [SubscriptionController::class, 'changePlan'])->name('subscriptions.change-plan');
});
```

### Loading from Service Provider

```php
// app/Features/Billing/Providers/BillingServiceProvider.php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
    }
}
```

---

## Mental Models

### The Self-Contained Module

Each feature's `routes.php` is the entry point for all HTTP endpoints in that feature. The routes file, together with the controllers it references, defines the feature's public API boundary.

### The Separation by Domain

Instead of dividing routes by HTTP method (all GETs in one section, all POSTs in another) or by file (`web.php` vs `api.php`), routes are divided by business domain. All billing routes are in one file because they belong to the same domain.

---

## Internal Mechanics

### Route Loading Order

`loadRoutesFrom()` uses Laravel's `RouteRegistrar` to include the file. The routes are registered in the order providers are listed in `config/app.php`. Routes from providers listed first register first (and take precedence in case of conflicts).

### Route Caching

Route caching works with feature routes:

```bash
php artisan route:cache
```

Laravel serializes all registered routes into a single file. Feature-provider-loaded routes are included in the cache. The cache is invalidated and rebuilt when route files change.

### Prefix and Name Collisions

If two features define the same route prefix (`/admin`), the provider loaded last wins (overwrites the first). Use unique prefixes per feature. If routes must share a prefix, use a top-level route file for the shared prefix and include feature routes within it:

```php
// routes/admin.php — loaded from AppServiceProvider
Route::prefix('/admin')->group(function () {
    require app_path('Features/Billing/routes.php');
    require app_path('Features/Users/routes.php');
});
```

---

## Patterns

### API Routes

```php
// Features/Billing/routes.php
Route::prefix('/api/billing')->middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('subscriptions/cancel', [SubscriptionController::class, 'cancel']);
});
```

### Web Routes with Inertia

```php
// Features/Billing/routes.php
Route::middleware(['auth'])->group(function () {
    Route::get('/billing', [BillingController::class, 'index']);
    Route::get('/billing/invoices/{invoice}', [InvoiceController::class, 'show']);

    Route::prefix('/api/invoices')->group(function () {
        Route::post('/', [InvoiceController::class, 'store']);
        Route::patch('/{invoice}/pay', [InvoiceController::class, 'markPaid']);
    });
});
```

### Livewire Routes

```php
// Features/Billing/routes.php
use App\Features\Billing\Livewire\InvoicesList;
use App\Features\Billing\Livewire\InvoiceForm;

Route::middleware(['auth'])->group(function () {
    Route::get('/billing/invoices', InvoicesList::class)->name('billing.invoices');
    Route::get('/billing/invoices/create', InvoiceForm::class)->name('billing.invoices.create');
    Route::get('/billing/invoices/{invoice}/edit', InvoiceForm::class)->name('billing.invoices.edit');
});
```

### Route Model Binding in Features

```php
// AppServiceProvider or FeatureServiceProvider
public function boot(): void
{
    Route::model('invoice', App\Features\Billing\Models\Invoice::class);
}
```

Or use explicit binding:

```php
// Features/Billing/routes.php
Route::bind('invoice', function (string $value) {
    return App\Features\Billing\Models\Invoice::findOrFail($value);
});
```

---

## Architectural Decisions

### Feature routes.php vs Centralized Files

| Concern | Feature routes.php | Centralized web.php |
|---|---|---|
| Co-location | Routes near controllers | Routes far from controllers |
| File count | N routes files | 1-3 route files |
| Merge conflicts | Lower (separate files) | Higher (single file, many edits) |
| Route overview | Need to search across files | Single file = full view |
| Refactoring | Delete feature directory | Hunt for route group |

### Route File Granularity

| Approach | When |
|---|---|
| Single routes.php per feature | Feature has <15 routes |
| Split routes (web + api) | Feature has both web and API routes |
| Split by controller | Feature has multiple controllers with distinct route groups |

---

## Tradeoffs

| Concern | Feature Routes | Global Routes |
|---|---|---|
| Discoverability | Search per feature | One file to search |
| Route Caching | Works identically | Works identically |
| Testing Route Existence | Test per feature | Test one file |
| URL Convention Consistency | May diverge per feature | Centralized control |
| Middleware Grouping | Per-feature middleware | Global middleware groups |

---

## Performance Considerations

Route caching eliminates any performance difference between feature routes and global routes. On cached requests, Laravel reads all routes from a single compiled file — there is no per-feature loading overhead.

```bash
# Always cache routes in production
php artisan route:cache
```

---

## Production Considerations

- Always use route caching in production (`php artisan route:cache`)
- Use consistent prefix and name conventions across features (`billing.*`, `users.*`)
- Cross-reference route names in the feature's documentation
- Avoid route conflicts by implementing a naming convention check in CI
- Use `php artisan route:list` to verify all feature routes are loaded
- Consider a route manifest (e.g., `routes/features.php`) that requires all feature route files for a bird's-eye view
- When route caching fails (due to closures), refactor to controller classes

---

## Common Mistakes

### Route Closures in Feature Files

```php
// Bad — closures break route caching
Route::get('/health', function () { return 'ok'; });

// Good — controller or invokable class
Route::get('/health', HealthCheckController::class);
```

### Hardcoded URLs in Feature Code

Feature routes use prefix `/billing`, but feature controllers hardcode URLs without the prefix:

```php
// Bad
return redirect('/invoices'); // 404 if prefix is /billing

// Good
return redirect()->route('billing.invoices.index');
```

### Route Name Collisions

Feature `Billing` defines `route('invoices.index')`. Feature `Users` also defines `route('invoices.index')`. The second registration overwrites the first. Use feature-specific name prefixes (`billing.invoices.*`, `users.invoices.*`).

---

## Failure Modes

### Feature Route Not Loaded

The service provider is registered but `loadRoutesFrom()` path is wrong. The route file silently doesn't load — no error is thrown. Result: requests to `/billing/invoices` return 404. Verify with `php artisan route:list`.

### Cached Routes Stale

After adding a new feature route file, `php artisan route:cache` was not re-run. The old cache is served, the new route returns 404. Always run `route:cache` as part of the deploy process.

---

## Ecosystem Usage

Laravel's route caching (`php artisan route:cache`) fully supports feature-loaded routes. The `Route` facade and route groups work identically in feature route files. Route model binding with explicit binding or `Route::model()` supports feature-namespaced models. `php artisan route:list` displays all feature routes in a single view.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — overall structure
- **Feature Service Providers** (this workspace) — how routes are loaded
- **Module Organization** (this workspace) — where the routes file lives
- **Feature vs Layer** (this workspace) — comparing route organization approaches
- **Large Project Structure** (this workspace) — managing routes across many features

---

## Research Notes

- `loadRoutesFrom()` calls PHP's `require` internally — the route file has access to the `Route` facade
- Route caching serializes all routes into `bootstrap/cache/routes-v7.php`
- Route cache is invalidated when the cache file's modification time changes
- Features can have multiple route files (`routes-web.php`, `routes-api.php`) for different middleware groups
- Named routes should include a feature-specific prefix to avoid collisions
- `php artisan route:list` shows the feature path in the "Action" column (e.g., `App\Features\Billing\Controllers\InvoiceController@index`)
- Route caching does NOT work with route closures (callable closures)
