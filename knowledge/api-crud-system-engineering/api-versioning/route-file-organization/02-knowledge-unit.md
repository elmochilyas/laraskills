# Route File Organization — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Route files define the mapping between HTTP requests and controllers. Versioned route file organization ensures clean separation, clear diffs, and maintainable routing as new API versions are added. Phase 2 covers directory structure, file naming, route caching, and RouteServiceProvider configuration.

## Core Concepts
- **Per-Version Route Files:** `routes/api-v1.php`, `routes/api-v2.php` — one file per API version.
- **Versioned Prefix:** Each file loaded with `Route::prefix('api/v1')->group()`.
- **RouteServiceProvider:** Central location for registering versioned route files.
- **File Naming Convention:** `api-{version}.php` for REST, `web-{version}.php` for web routes.

## Mental Models
- **Building Wings:** Each route file is a wing of a building. The RouteServiceProvider is the main lobby directory that points to each wing. Build a new wing (version), add a sign in the lobby.
- **Playlist Separation:** Each version is a playlist. `api-v1.php` is "Greatest Hits of 2020". `api-v2.php` is "New Hits of 2024". Same artist (application), different songs (endpoints).

## Internal Mechanics
- `Route::prefix('api/v1')` adds the version segment to every route in the file.
- `Route::name('api.v1.')` applies a consistent route name prefix for URL generation.
- `Route::middleware('api')` applies the API middleware group (throttle, auth).
- Route caching merges all loaded files into a single cached route — O(1) lookup regardless of file count.

## Patterns
- Boot method in `RouteServiceProvider` loads versioned route files.
- Base route file for shared routes (health, auth) loaded before versioned files.
- Route model binding configured per version if binding differs.
- Route file header comment documenting the version's lifecycle status.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| File naming | `api-v1.php` vs `api/v1.php` | Flat is simpler, directory for many versions |
| Loading order | Oldest first | Prevents accidental route shadowing |
| Shared routes | Separate file loaded before versions | Avoid duplication |
| Route names | `api.v1.users.index` | Consistent naming for URL generation |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Separate files | Clean diffs, easy code review | Many files for many versions |
| Single file per version | Contains all endpoints for that version | Large files for big APIs |
| Directory per version | `routes/api/v1/` for sub-grouping | More nesting |
| Flat route files | Simple, discoverable | Harder to split large APIs |

## Performance Considerations
- Route file count does NOT affect route resolution speed (cached routes are one file).
- Each additional version adds ~1-2 KB to the cached route file.
- Route caching should be part of the deployment pipeline for all version changes.
- Unused route files for retired versions should be removed to reduce cache size.

## Production Considerations
- Run `php artisan route:cache` in every deployment that touches routes.
- Always verify routes after cache with `php artisan route:list`.
- Remove retired version route files from loading to prevent dead code.
- Monitor route list output for unexpected version intersections.

## Common Mistakes
- Loading all route files in `web.php` or `api.php` instead of `RouteServiceProvider`.
- Forgetting to run `route:cache` after adding a new version — routes return 404.
- Naming collisions: two versions having the same route name with different prefixes.
- Not removing old version route files from `RouteServiceProvider` when they're retired.

## Failure Modes
- **Missed route registration:** New version route file created but not loaded in `RouteServiceProvider`.
- **Stale route cache:** Old route cache served after new version added, returning 404.
- **Route name clash:** Same route name in two versions breaks `route()` URL generation.
- **Middleware omission:** V2 route group missing the `auth:api` middleware present in V1.

## Ecosystem Usage
- **Laravel Spark:** Organizes route files by version with `RouteServiceProvider` configuration.
- **October CMS:** Plugin route files organized by version in `routes/` directory.
- **Laravel Nova:** Uses versioned route files for Nova API endpoints.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- URL path versioning
- Controller inheritance

### Advanced Follow-up Topics
- Route caching strategies
- API gateway route distribution

## Research Notes
### Source Analysis
Laravel's routing documentation (2024) details RouteServiceProvider usage. Taylor Otwell's "Laravel: Up & Running" (2023) recommends per-version route files for maintainable APIs.

### Key Insight
Route file organization is the cheapest place to invest in API versioning — it costs nothing to split files, and the payoff in code review clarity is immediate.

### Version-Specific Notes
Laravel 11's `RouteServiceProvider` is auto-discovered. Route caching behavior identical to Laravel 10.
