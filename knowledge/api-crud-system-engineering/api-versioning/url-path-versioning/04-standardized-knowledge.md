# ECC Standardized Knowledge — URL Path Versioning

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | URL Path Versioning |
| Difficulty | Intermediate |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

URL path versioning embeds the version identifier directly in the URI path (e.g., `/api/v1/users`, `/api/v2/users`). This KU covers implementing route groups, versioned controllers, middleware, testing strategies, and operational lifecycle for this approach in a Laravel codebase. The version is the first path segment after the API prefix (`/api/v{number}`), with each version getting its own route group. Route caching works across versions; each group is cached independently.

## Core Concepts

- **URI Segment Versioning**: Version in `/api/v{major}` — industry standard
- **Route Grouping**: `Route::prefix('api/v1')` per version
- **Separate route files**: `routes/api-v1.php`, `routes/api-v2.php`
- **Versioned controllers**: `App\Http\Controllers\Api\V1\PostController`
- **Default version fallback**: 404 or redirect for unversioned requests
- **Route caching**: Per-version routes merged into single cached file

## When To Use

- Public APIs where version visibility aids debugging
- APIs consumed by mobile apps (URLs are easy to hardcode)
- APIs with simple versioning needs (major version in URL only)
- Teams that prioritize debuggability and simplicity

## When NOT To Use

- APIs requiring per-representation versioning (use media-type)
- APIs where clean URLs are a hard requirement
- APIs with many minor/patch versions that would clutter URLs

## Best Practices

- **Separate route files per version**: `routes/api-v1.php` loaded in `RouteServiceProvider` with `Route::prefix('api/v1')`.
- **Use major version only in URL**: `/api/v1/`, not `/api/v1.0/` or `/api/v1.0.0/`.
- **Add a version redirect or 404 for `/api/` without version**.
- **Monitor 404 rates on deprecated versions** to know when consumers have migrated.
- **Use consistent version prefix regex** to avoid route conflicts.
- **Run `php artisan route:cache`** in every deployment that touches routes.

## Architecture Guidelines

- Parallel routes: multiple versions coexist in the same application, each resolving independently.
- Controller directory mirrors version: `app/Http/Controllers/Api/V1/`, `app/Http/Controllers/Api/V2/`.
- Route files are the cheapest place to invest in API versioning — split files for clear diffs.
- Version removal is a release note event — announce in changelog.

## Performance Considerations

- Route caching reduces all version overhead to a single O(1) hash lookup.
- Each additional version adds ~1-2 KB to the cached route file.
- Controller resolution follows standard Laravel service container — no measurable overhead.
- Deprecation/sunset header injection adds ~0.1ms per response.

## Security Considerations

- Add `->where('version', 'v[0-9]+')` on route params to prevent version injection.
- Deprecated versions may have known security vulnerabilities — maintain auth/authorization standards.
- When removing a version, coordinate with security team to ensure no unpatched versions remain active.

## Common Mistakes

- Using `/api/v1.0/` instead of `/api/v1/` (major version only in path).
- Mixing multiple versions in the same route file.
- Forgetting to register new version routes in the RouteServiceProvider.
- Caching routes without clearing when adding a new version.

## Anti-Patterns

- **No default version handling**: `/api/` returns 404 without guidance — provide a redirect or help message.
- **Stale route cache**: Old cache served after adding new version, returning 404 for valid routes.
- **Route name collision**: Same route name in two versions breaks `route()` URL generation.

## Examples

```php
// RouteServiceProvider
public function boot(): void
{
    Route::prefix('api/v1')
        ->middleware('api')
        ->name('api.v1.')
        ->group(base_path('routes/api-v1.php'));

    Route::prefix('api/v2')
        ->middleware('api')
        ->name('api.v2.')
        ->group(base_path('routes/api-v2.php'));
}

// routes/api-v1.php
Route::get('/posts', [V1\PostController::class, 'index'])->name('posts.index');

// routes/api-v2.php
Route::get('/posts', [V2\PostController::class, 'index'])->name('posts.index');
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: header-based-versioning, media-type-versioning
- **Advanced**: Version negotiation middleware, API gateway version routing

## AI Agent Notes

- URL path versioning is the simplest to implement and debug because the version is visible in every log, exception, and curl command.
- Laravel 11 uses `Route::prefix()` identically to Laravel 10 — no breaking changes in route grouping.
- Stripe, GitHub, and Twilio all use URL-path versioning for their public APIs.

## Verification

- [ ] Separate route file per version registered in RouteServiceProvider
- [ ] Controllers organized in versioned namespace directories
- [ ] Route caching runs on every deployment
- [ ] Default version handling for unversioned requests
- [ ] Deprecation/sunset headers on old versions
- [ ] Version removal coordinated with monitoring and documentation updates
