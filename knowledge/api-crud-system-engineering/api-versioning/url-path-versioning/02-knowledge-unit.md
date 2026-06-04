# URL Path Versioning — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
URL path versioning embeds the version identifier directly in the URI path (e.g., `/api/v1/users`, `/api/v2/users`). Phase 2 focuses on implementing route groups, versioned controllers, middleware, and testing strategies for this approach in a Laravel codebase.

## Core Concepts
- **URI Segment Versioning:** The version is the first path segment after the API prefix (`/api/v{number}`).
- **Route Grouping:** Each version gets its own route group with a common prefix.
- **Parallel Routes:** Multiple versions coexist in the same application, each resolving independently.
- **Default Version Fallback:** Optional redirect or 404 for unversioned requests.

## Mental Models
- **Building Floors:** Each `/api/v{floor}` is a separate floor. The elevator (router) takes you to the correct floor. Floors can be under renovation independently.
- **Namespace Tree:** Versions as top-level namespace branches — `Api\V1\UsersController` and `Api\V2\UsersController` coexist without collision.

## Internal Mechanics
- Laravel `Route::prefix('api/v1')` applies the version segment to every route in the group.
- Route caching works across versions; each group is cached independently.
- Middleware can inspect the version segment for conditional logic.
- The router performs O(1) lookup per group after route caching.

## Patterns
- Dedicated route file per version (`routes/api-v1.php`, `routes/api-v2.php`).
- Version detection middleware for shared pre/post processing.
- Base URL generator that accepts a version parameter.
- Redirect middleware for deprecated versions.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Version prefix format | `/api/v{major}` | Industry standard, simple to regex |
| Route file strategy | Separate files per version | Cleaner diff, easier code review |
| Unversioned request handling | 404 vs redirect to latest | 404 avoids silent assumption |
| Controller directory | `app/Http/Controllers/Api/V1/` | PSR-4 compatible, clear hierarchy |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Visibility | Versions obvious in URL | URL bloat, uglier endpoints |
| Caching | Per-version route cache | Cache invalidation per version |
| Discovery | No content negotiation needed | Harder to version by consumer type |
| SEO | Distinct endpoints per version | Link rot on version removal |

## Performance Considerations
- Route caching reduces all version overhead to a single O(1) hash lookup.
- Each additional version adds ~1 KB to cached route file — negligible.
- Controller resolution follows standard Laravel service container — no measurable overhead.

## Production Considerations
- Add a version redirect for requests to `/api/` without a version.
- Monitor 404 rates on deprecated versions to know when consumers have migrated.
- Use consistent version prefix regex to avoid route conflicts.
- Set up monitoring for version-specific error rates.

## Common Mistakes
- Using `/api/v1.0/` instead of `/api/v1/` (major version only in path).
- Mixing multiple versions in the same route file.
- Forgetting to register new version routes in the RouteServiceProvider.
- Caching routes without clearing when adding a new version.

## Failure Modes
- **Accidental fallthrough:** No `->where('version', 'v[0-9]+')` on route params leading to collisions.
- **Stale cache:** Route cache not rebuilt after adding a version, causing 404s.
- **Wrong base URL:** Frontend builds with hardcoded `/api/v1/` that misses `/api/v2/`.

## Ecosystem Usage
- **Stripe:** `/v1/charges`, `/v2/charges` — uses URL path as primary versioning.
- **GitHub:** `/api/v3/` — longstanding URL-path versioning.
- **Twilio:** `/2010-04-01/Accounts/...` — date-based URL versioning variant.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Header-based versioning
- Media-type versioning

### Advanced Follow-up Topics
- Version negotiation middleware
- API gateway version routing

## Research Notes
### Source Analysis
Drawing on Stripe (2015) and GitHub (2012) v3 API designs as primary reference implementations.

### Key Insight
URL path versioning is the simplest to implement and debug because the version is visible in every log, exception, and curl command.

### Version-Specific Notes
Laravel 11 still uses `Route::prefix()` identically to Laravel 10. No breaking changes in route grouping.
