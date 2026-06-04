# Phase 5: Rules — Route File Organization

## Use Separate Route File Per API Version
---
## Category
Code Organization
---
## Rule
Always maintain a separate route file for each API version (`routes/api-v1.php`, `routes/api-v2.php`) — never put all versions in a single route file.
---
## Reason
A single route file with version conditionals creates messy diffs, noisy code reviews, and version boundary violations.
---
## Bad Example
```php
// routes/api.php — all versions mixed
Route::prefix('api/v1')->group(function () { /* ... */ });
Route::prefix('api/v2')->group(function () { /* ... */ });
```
---
## Good Example
```
// routes/api-v1.php — v1 routes only
// routes/api-v2.php — v2 routes only
```
---
## Exceptions
Single-version APIs that are guaranteed not to have a second version.
---
## Consequences Of Violation
Accidental cross-version route pollution; confusing diffs; difficult to add/remove versions.
---

## Load Versioned Routes From RouteServiceProvider
---
## Category
Code Organization
---
## Rule
Always load versioned route files from the `RouteServiceProvider` using `Route::prefix('api/{version}')->group()` — never load them from `web.php` or `api.php`.
---
## Reason
The RouteServiceProvider is the designated route configuration class — loading routes elsewhere bypasses the provider's middleware and prefix configuration.
---
## Bad Example
```php
// api.php — directly defines version routes
```
---
## Good Example
```php
// RouteServiceProvider
public function boot(): void {
    foreach (['v1', 'v2'] as $version) {
        Route::prefix("api/{$version}")->name("api.{$version}.")->group(base_path("routes/api-{$version}.php"));
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent middleware application; route prefix mismatches; hard-to-find route registration bugs.
---

## Run `route:cache` After Every Route Change
---
## Category
Performance
---
## Rule
Always run `php artisan route:cache` as part of the deployment pipeline after any route file change.
---
## Reason
Without route caching, routes are registered on every request — the least efficient route loading mode in Laravel.
---
## Bad Example
```bash
# Deploys without route:cache
```
---
## Good Example
```bash
php artisan route:cache && php artisan route:list --json > route-manifest.json
```
---
## Exceptions
Local development environments where route changes are frequent (route caching is a deployment concern).
---
## Consequences Of Violation
Route resolution overhead on every request; accidental 404s if the deployment process clears cache but regenerates with errors.
---

## Use Config-Gated Route Loading For Version Toggle
---
## Category
Reliability
---
## Rule
Always wrap versioned route loading with a configuration gate so each version can be toggled on/off without code changes.
---
## Reason
A configuration toggle enables emergency version deactivation, gradual rollout, and per-environment version control.
---
## Bad Example
```php
// Route files always loaded — no toggle
Route::prefix('api/v1')->group(...);
```
---
## Good Example
```php
if (config("api.versions.v1.active", true)) {
    Route::prefix('api/v1')->group(base_path('routes/api-v1.php'));
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Emergency version deactivation requires a code deploy; environment-specific version management impossible.
---

## Load Oldest Version First To Prevent Route Shadowing
---
## Category
Reliability
---
## Rule
Always load versioned route files in oldest-first order to prevent a newer version's catch-all route from shadowing an older version's routes.
---
## Reason
If routes are registered newest-first, a wildcard route in v2 could catch requests intended for v1.
---
## Bad Example
```php
foreach (['v2', 'v1'] as $version) { ... } // newer first
```
---
## Good Example
```php
foreach (['v1', 'v2'] as $version) { ... } // oldest first
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Intermittent 404 errors for older versions when new versions register catch-all routes.
---

## Remove Retired Version Route Registration, Keep File
---
## Category
Maintainability
---
## Rule
Never delete retired version route files from the repository — disable them by removing the registration in RouteServiceProvider.
---
## Reason
Retired version route files serve as documentation and can be re-enabled for emergency rollback without git archaeology.
---
## Bad Example
```bash
git rm routes/api-v1.php # permanently lost
```
---
## Good Example
```php
// RouteServiceProvider: v1 registration removed, file remains
// routes/api-v1.php still in repo for reference and recovery
```
---
## Exceptions
When the route file contains no useful documentation value (e.g., simple CRUD that is fully replaced).
---
## Consequences Of Violation
Emergency version recovery requires digging through git history; lost route documentation.
---

## Name Routes With Version Prefix To Avoid Collisions
---
## Category
Reliability
---
## Rule
Always prefix route names with the version identifier (`api.v1.posts.index`, `api.v2.posts.index`) to prevent naming collisions when using `route()`.
---
## Reason
Two routes with the same name in different versions cause `route()` to return the wrong URL — whichever was registered last wins.
---
## Bad Example
```php
Route::prefix('api/v1')->name('posts.')->group(...);
Route::prefix('api/v2')->name('posts.')->group(...); // collision
```
---
## Good Example
```php
Route::prefix('api/v1')->name('api.v1.posts.')->group(...);
Route::prefix('api/v2')->name('api.v2.posts.')->group(...);
```
---
## Exceptions
APIs that never use `route()` for URL generation (all consumers use absolute URLs).
---
## Consequences Of Violation
`route('posts.index')` generates URLs pointing to the wrong version; email links send consumers to wrong API version.
