# ECC Standardized Knowledge — Route File Organization

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Route File Organization |
| Difficulty | Intermediate |
| Category | Implementation |
| Last Updated | 2026-06-02 |

## Overview

Route files define the mapping between HTTP requests and controllers. Versioned route file organization ensures clean separation, clear diffs, and maintainable routing as new API versions are added. This KU covers directory structure, file naming, route caching, and RouteServiceProvider configuration. Each version gets its own route file (`routes/api-v1.php`, `routes/api-v2.php`) loaded with `Route::prefix('api/v1')->group()` in the RouteServiceProvider. Route file organization is the cheapest place to invest in API versioning — it costs nothing to split files, and the payoff in code review clarity is immediate.

## Core Concepts

- **Per-Version Route Files**: `routes/api-v1.php`, `routes/api-v2.php` — one file per API version
- **Versioned Prefix**: `Route::prefix('api/v1')->group()` applied in RouteServiceProvider
- **Versioned Route Names**: `name('api.v1.')` for consistent URL generation
- **Route Caching**: All route files merge into a single cached file — O(1) lookup
- **Config-Gated Loading**: `config('api.versions.v1.active')` controls if route file is loaded
- **Route Manifest**: Auto-generated list of all registered routes by version prefix

## When To Use

- Any API project with more than one version
- When adding a new API version to an existing project
- As part of standard Laravel API project setup
- When deploying to multiple environments with different version configurations

## When NOT To Use

- Single-version APIs (standard `routes/api.php` is sufficient)
- Prototypes with minimal routing
- APIs with a single endpoint

## Best Practices

- **Separate route files per version**: Clean diffs, easy code review, clear version boundary.
- **Load files in RouteServiceProvider** with version prefix, middleware, and name prefix.
- **Run `php artisan route:cache`** in every deployment that touches routes.
- **Verify routes after cache** with `php artisan route:list`.
- **Remove retired version route files from loading** to prevent dead code.
- **Use config-gated loading** for version on/off toggle: `config('api.versions.v1.active')`.
- **Maintain a route manifest** — auto-generated list of registered routes per version.

## Architecture Guidelines

- Route file count does NOT affect route resolution speed (cached routes are one file).
- Each additional version adds ~1-2 KB to the cached route file — negligible.
- Loading order: oldest version first to prevent accidental route shadowing.
- Shared routes (health, auth) should be in a separate file loaded before versioned files.
- Retired version route files can remain in the repo for historical reference but must not be loaded.

## Performance Considerations

- Route file count does NOT affect route resolution speed (cached routes are one file).
- Each additional version adds ~1-2 KB to the cached route file.
- Route caching should be part of the deployment pipeline for all version changes.
- Config-gated route loading adds one `config()` call per version — negligible.

## Security Considerations

- Ensure middleware applied to route groups includes auth/rate-limiting for all versions.
- Route caching can mask missing middleware if not verified after generation.
- Removed version routes should be confirmed inaccessible from production via monitoring.

## Common Mistakes

- Loading all route files in `web.php` or `api.php` instead of `RouteServiceProvider`.
- Forgetting to run `route:cache` after adding a new version — routes return 404.
- Naming collisions: two versions having the same route name with different prefixes.
- Not removing old version route files from `RouteServiceProvider` when retired.

## Anti-Patterns

- **Monolithic route file**: All versions in a single `routes/api.php` — messy diffs, hard to review.
- **No route caching**: Routes regenerated on every request in production — unnecessary overhead.
- **Dead route registration**: Route file exists but no longer loaded — confusing for developers.

## Examples

```php
// RouteServiceProvider
public function boot(): void
{
    // Shared routes (health, auth)
    Route::prefix('api')
        ->middleware('api')
        ->group(base_path('routes/api-shared.php'));

    // Versioned routes (oldest first)
    foreach (['v1', 'v2'] as $version) {
        if (config("api.versions.{$version}.active", true)) {
            Route::prefix("api/{$version}")
                ->middleware('api')
                ->name("api.{$version}.")
                ->group(base_path("routes/api-{$version}.php"));
        }
    }
}

// routes/api-v1.php
Route::get('/posts', [V1\PostController::class, 'index'])->name('posts.index');
Route::post('/posts', [V1\PostController::class, 'store'])->name('posts.store');

// routes/api-v2.php
Route::get('/posts', [V2\PostController::class, 'index'])->name('posts.index');
Route::post('/posts', [V2\PostController::class, 'store'])->name('posts.store');
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: url-path-versioning, controller-inheritance
- **Advanced**: Route caching strategies, API gateway route distribution

## AI Agent Notes

- Route file organization is the cheapest place to invest in API versioning — it costs nothing to split files.
- Laravel 11's `RouteServiceProvider` is auto-discovered. Route caching behavior is identical to Laravel 10.
- Config-gated route loading enables feature flag-style version deployment.

## Verification

- [ ] Separate route file per version in `routes/` directory
- [ ] RouteServiceProvider loads versioned files with prefix/name
- [ ] `php artisan route:cache` runs in deployment pipeline
- [ ] Route manifest exists with expected routes per version
- [ ] Config-gated loading controls version activation
- [ ] Retired versions removed from loading but files may remain in repo
