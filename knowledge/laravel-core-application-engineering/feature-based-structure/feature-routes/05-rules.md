## Never Use Route Closures In Feature Files

Route closures break route caching and must not be used in feature route files.

---

## Category

Performance

---

## Rule

Define every route using a controller class or an invokable single-action controller. Route closures (`Route::get('/path', function () { ... })`) are forbidden in feature route files.

---

## Reason

PHP route closures cannot be serialized. When `php artisan route:cache` runs, it skips routes with closures, preventing them from being cached. This degrades performance and causes inconsistent behavior between cached and uncached environments.

---

## Bad Example

```php
// Cannot be cached — uses closure
Route::get('/billing/health', function () {
    return response()->json(['status' => 'ok']);
});
```

---

## Good Example

```php
// Cacheable — uses controller
Route::get('/billing/health', [HealthController::class, 'check']);

// Or invokable
Route::get('/billing/health', HealthController::class);
```

---

## Exceptions

No exceptions. Route closures must always be replaced with controller classes in feature-based projects.

---

## Consequences Of Violation

Route caching silently skips closure-based routes. Production routes may differ from local routes. Performance degradation on uncached routes.

---

## Use Consistent Prefix And Name Conventions

Every feature must use a unique route prefix and a unique route name prefix.

---

## Category

Code Organization

---

## Rule

Define route groups with a feature-unique `prefix()` and `->name()` in every feature route file. The prefix must be a lower-case, hyphenated version of the feature name. The name prefix must be the feature name followed by a dot.

---

## Reason

Without unique prefixes, two features could define the same URL path (e.g., `/settings`) and collide. Named route prefixes prevent `route('index')` from being ambiguous. Consistent conventions make routes predictable across all features.

---

## Bad Example

```php
// Billing routes — no prefix
Route::get('/invoices', [InvoiceController::class, 'index']);

// User routes — also no prefix, same path
Route::get('/invoices', [UserInvoiceController::class, 'index']);
```

---

## Good Example

```php
// Billing routes
Route::prefix('/billing')->name('billing.')->group(function () {
    Route::get('/invoices', [InvoiceController::class, 'index'])->name('invoices.index');
});

// User routes
Route::prefix('/users')->name('users.')->group(function () {
    Route::get('/invoices', [UserInvoiceController::class, 'index'])->name('invoices.index');
});
```

---

## Exceptions

API versions (`/api/v1/billing/`) should use an outer group handled by a service provider or global route file, not by individual features.

---

## Consequences Of Violation

Route collisions between features. Ambiguous named route references. 404 errors when routes are loaded in unpredictable order.

---

## Always Use Named Routes For URLs

Reference URLs via named routes using the `route()` helper, never as hardcoded strings.

---

## Category

Maintainability

---

## Rule

Use `route('billing.invoices.show', $invoice)` for every URL reference in controllers, views, and tests. Hardcoded URL strings like `/billing/invoices/123` are forbidden.

---

## Reason

Hardcoded URLs break when route prefixes change, when routes are restructured, or when features are extracted. Named routes provide a stable reference that survives structural changes and enables route parameter handling.

---

## Bad Example

```php
// Hardcoded — breaks if prefix changes
return redirect('/billing/invoices/' . $invoice->id);
```

---

## Good Example

```php
// Named — survives structural changes
return redirect()->route('billing.invoices.show', $invoice);
```

---

## Exceptions

External URLs (third-party redirect URLs, payment gateway return URLs) may require hardcoded paths. Validate them with tests.

---

## Consequences Of Violation

404 errors after prefix changes. Brittle redirects that require manual updates during restructuring. Silent breakage if routes are reorganized.

---

## Verify Feature Routes With `php artisan route:list`

After adding or modifying feature routes, verify they are registered and correctly namespaced.

---

## Category

Reliability

---

## Rule

Run `php artisan route:list` after any route changes to confirm that feature routes appear with the expected URI, name, and controller. Add this to the PR checklist.

---

## Reason

Feature routes are loaded by service providers. A misconfigured `loadRoutesFrom()` path, a missing provider registration, or an incorrect file path causes silent 404 errors. `route:list` provides an authoritative inventory of all registered routes.

---

## Bad Example

A developer adds a new route file but forgets to add `loadRoutesFrom()` in the service provider. No error is thrown. The route silently returns 404.

---

## Good Example

```bash
php artisan route:list | grep billing
# Expected:
# | GET | /billing/invoices | billing.invoices.index | App\Features\Billing\Controllers\InvoiceController@index
```

---

## Exceptions

Route caching in production means `route:cache` is the authoritative verification. Use `route:list` only on the development environment after cache clear.

---

## Consequences Of Violation

Undiscovered missing routes reach production. Developers waste time debugging 404 errors that are caused by missing provider registrations.

---

## Run `php artisan route:cache` In Every Deployment

Feature route files must be cached in production for consistent performance and behavior.

---

## Category

Performance

---

## Rule

Include `php artisan route:cache` in every production deployment script. Clear the route cache (`php artisan route:clear`) when route files are modified during development.

---

## Reason

Without route caching, Laravel loads and registers each feature's routes on every request by requiring the route files. Caching serializes all routes into a single compiled file, eliminating per-request loading overhead and ensuring deterministic route matching.

---

## Bad Example

Deployment script omits `php artisan route:cache`. Every request requires all feature route files, adding ~5-10ms per 10 features.

---

## Good Example

```bash
# deploy.php
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

---

## Exceptions

Local development environments should not cache routes, as changes require cache clearing. Use `route:cache` only for production/staging.

---

## Consequences Of Violation

Performance degradation proportional to number of features. New feature routes silently return 404 if a stale cache exists.

---

## Use Route Model Binding For Feature Models

Register explicit route model bindings for feature-namespaced models.

---

## Category

Framework Usage

---

## Rule

Register route model binding for feature models either explicitly in the service provider using `Route::model()` or implicitly using type-hinted parameter names in controller methods. Use fully qualified class names.

---

## Reason

Eloquent's automatic route model binding resolves models by class name. Feature-namespaced models (e.g., `App\Features\Billing\Models\Invoice`) require explicit binding to ensure Laravel resolves the correct class.

---

## Bad Example

```php
// In controller — Laravel may not resolve feature model automatically
public function show($invoiceId)
{
    $invoice = Invoice::findOrFail($invoiceId); // Manual resolution
}
```

---

## Good Example

```php
// In service provider
Route::model('invoice', \App\Features\Billing\Models\Invoice::class);

// In controller — automatic binding
public function show(\App\Features\Billing\Models\Invoice $invoice)
{
    return view('billing::invoices.show', compact('invoice'));
}
```

---

## Exceptions

Models in the global `App\Models\` namespace (e.g., `User`) use Laravel's default implicit binding and do not require explicit registration.

---

## Consequences Of Violation

Route model binding fails for feature models. Developers resort to manual `findOrFail()` calls. Inconsistent resolution across controllers.

---

## Organize Multiple Route Files Per Feature Group

Features with distinct middleware groups (web, api, admin) should use separate route files within the feature.

---

## Category

Code Organization

---

## Rule

When a feature has routes with different middleware requirements (e.g., web routes and API routes), split them into multiple files: `routes/web.php`, `routes/api.php`, `routes/admin.php`. Load each from the service provider with appropriate middleware.

---

## Reason

A single route file with mixed middleware groups becomes hard to read and test. Separate files organized by middleware group make it clear which routes belong to which context. Loading each file with its own middleware group prevents accidental exposure.

---

## Bad Example

```php
// Single routes.php with mixed middleware
Route::middleware(['auth'])->group(function () {
    Route::get('/billing/invoices', [InvoiceController::class, 'index']);
});
Route::middleware(['auth:api'])->group(function () {
    Route::get('/api/billing/invoices', [ApiInvoiceController::class, 'index']);
});
```

---

## Good Example

```php
// routes/web.php
Route::middleware(['auth'])->prefix('/billing')->name('billing.')->group(function () {
    Route::get('/invoices', [InvoiceController::class, 'index']);
});

// routes/api.php
Route::middleware(['auth:api'])->prefix('/api/billing')->name('api.billing.')->group(function () {
    Route::get('/invoices', [ApiInvoiceController::class, 'index']);
});
```

---

## Exceptions

Features with only one route or one middleware group should keep a single `routes.php` file. Splitting prematurely adds unnecessary files.

---

## Consequences Of Violation

Mixed middleware logic in a single file. Unclear route organization. API routes accidentally exposed under web middleware.
