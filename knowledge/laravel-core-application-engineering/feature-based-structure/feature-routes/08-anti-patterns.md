# Anti-Patterns: Vertical Slice Architecture

## 1. Route Closures in Feature Files

Using `Route::get('/health', function () { return 'ok'; })` in feature route files, which breaks route caching.

PHP route closures cannot be serialized. When `php artisan route:cache` runs, it skips routes with closures, preventing them from being cached. This degrades performance and causes inconsistent behavior between cached and uncached environments. Always use controller classes or invokable single-action controllers.

## 2. Hardcoded URLs Without Named Routes

Using `return redirect('/billing/invoices/' . $invoice->id)` instead of `redirect()->route('billing.invoices.show', $invoice)`.

Hardcoded URLs break when route prefixes change, when routes are restructured, or when features are extracted. Named routes provide a stable reference that survives structural changes and enables route parameter handling. Always use the `route()` helper for URL references in controllers, views, and tests.

## 3. Route Prefix Collisions

Two features both define routes with the `/admin` prefix without coordination, causing route conflicts.

Without unique prefixes, two features could define the same URL path and collide. Every feature must use a unique route prefix and a unique route name prefix. Use a lower-case, hyphenated version of the feature name as the prefix (`/billing`, `/user-management`) and the feature name followed by a dot as the name prefix (`billing.*`, `users.*`).

## 4. Missing loadRoutesFrom Creating Silent 404s

Adding a new route file but forgetting to add `loadRoutesFrom()` in the service provider — no error is thrown, the route silently returns 404.

Feature routes are loaded by service providers. A misconfigured `loadRoutesFrom()` path, a missing provider registration, or an incorrect file path causes silent 404 errors. Run `php artisan route:list` after any route changes to confirm that feature routes appear with the expected URI, name, and controller.

## 5. No Route Caching in Production

Omitting `php artisan route:cache` from the deployment script, so every request loads all feature route files.

Without route caching, Laravel loads and registers each feature's routes on every request by requiring the route files. For 10 features, this adds ~5-10ms per request. Include `php artisan route:cache` in every production deployment to serialize all routes into a single compiled file.

## 6. Route Closures Breaking Caching Silently

A route file contains some closure-based routes and some controller-based routes. Route caching silently skips the closures, and production behaves differently from local.

Route caching does not report an error for closure routes — it simply skips them. The developer gets no warning that production routes differ from local routes. Scan feature route files for closures in CI and fail the build if any are found. All routes must use controller classes.

## 7. No Route Model Binding for Feature Models

Manually calling `findOrFail()` in every controller method instead of using route model binding.

Eloquent's automatic route model binding resolves models by class name. Feature-namespaced models require explicit binding to ensure Laravel resolves the correct class. Register route model binding for feature models either explicitly in the service provider using `Route::model()` or implicitly using type-hinted parameter names in controller methods.
