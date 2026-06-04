# Controller Organization by Version

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Organization by Version
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

As APIs evolve, breaking changes are inevitable. Versioned controller directories—`Controllers/Api/V1/`, `Controllers/Api/V2/`—provide a structural mechanism for maintaining backward compatibility while introducing new behavior. Each version gets its own directory of controllers that implement the same endpoints but with different internal logic, request validation, or response formats.

This pattern enables parallel development: V1 controllers remain stable for existing clients while V2 controllers are built and tested. Route files point to the appropriate version namespace, and a `Route::prefix('v1')` scopes the entire set. The approach trades some code duplication for a clear, auditable separation between API versions.

---

## Core Concepts

- **Namespace-per-Version**: Each API version lives in its own PHP namespace and directory: `App\Http\Controllers\Api\V1\*`.
- **Versioned Route Files**: Typically `routes/api/v1.php` and `routes/api/v2.php`, each loaded with a namespace prefix.
- **Granular Overrides**: V2 controllers can extend V1 controllers to inherit behavior while overriding only what changed.
- **Deprecation Lifecycle**: V1 controllers are deprecated but remain in the codebase until the deprecation window expires.
- **Parallel Route Registration**: Both versions are registered simultaneously; the client chooses via URL or header.

---

## Mental Models

- **Time Capsule**: Each version directory is a snapshot of the API at a point in time. V1 does not change; V2 is the active development target.
- **Parallel Tracks**: V1 and V2 run on parallel tracks. New clients use V2; old clients stay on V1 until they migrate.
- **Overlay Architecture**: V2 overlays V1, inheriting what has not changed and overriding what has.

---

## Internal Mechanics

Versioned controller organization is a naming convention, not a framework feature. The structure relies on:

1. **Route Namespace Registration**:
   ```php
   Route::prefix('v1')->namespace('App\Http\Controllers\Api\V1')->group(base_path('routes/api/v1.php'));
   Route::prefix('v2')->namespace('App\Http\Controllers\Api\V2')->group(base_path('routes/api/v2.php'));
   ```

2. **Autoloading via PSR-4**: The `App\Http\Controllers\Api\V1` namespace maps to `app/Http/Controllers/Api/V1/`. Composer's PSR-4 autoloading handles this without extra configuration.

3. **Version-Specific Route Files**: Separate route files prevent cross-version route collisions and make the version boundary explicit.

4. **Route Caching with Versions**: `php artisan route:cache` compiles all registered routes, regardless of version. Both versions are cached together.

---

## Patterns

- **Full Duplication (Simple)**:
  ```php
  // Controllers/Api/V1/PhotoController.php
  class PhotoController extends Controller
  {
      public function index() { return PhotoResource::collection(Photo::all()); }
  }

  // Controllers/Api/V2/PhotoController.php
  class PhotoController extends Controller
  {
      public function index() { return V2PhotoResource::collection(Photo::with('tags')->get()); }
  }
  ```
- **Extend-and-Override**:
  ```php
  // Controllers/Api/V2/PhotoController.php
  class PhotoController extends V1PhotoController
  {
      public function index()
      {
          return V2PhotoResource::collection(Photo::with('tags')->get());
      }
      // show, store, update, destroy inherited from V1
  }
  ```
- **Version-Specific Route Loading**:
  ```php
  // routes/api.php
  Route::prefix('v1')->group(base_path('routes/api/v1.php'));
  Route::prefix('v2')->group(base_path('routes/api/v2.php'));

  // routes/api/v1.php
  Route::apiResource('photos', 'App\Http\Controllers\Api\V1\PhotoController');

  // routes/api/v2.php
  Route::apiResource('photos', 'App\Http\Controllers\Api\V2\PhotoController');
  ```

---

## Architectural Decisions

- **Why directory-based versioning over header-based?** Directory/URL versioning (`/v1/photos`) is explicit, cacheable, and testable. Header-based versioning complicates caching and debugging.
- **Why duplicate instead of transform?** Full duplication of V2 controllers avoids the risk of regressions in V1 when refactoring shared code.
- **Why inherit from V1?** When the changes are minimal (e.g., response format only), inheritance reduces duplication. When the changes are structural, composition or full rewrite is cleaner.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear, auditable version history | Code duplication increases with each version | Archive old versions after deprecation period |
| Parallel development without regression risk | Larger codebase to maintain | Deletion of old versions is a manual, scheduled process |
| Simple URL routing (`/v1/`, `/v2/`) | Route cache includes all versions | Version bloat impacts route cache size linearly |

---

## Performance Considerations

- Route cache size grows linearly with the number of versions x routes per version. With 10 versions and 20 routes each, the cache still fits in memory comfortably.
- PHP opcode cache handles the increased file count without significant impact.
- Autoloading only loads the controller class for the requested version, so unused version controllers are never loaded per request.
- Database query differences between versions (if V2 adds eager loads) have a far larger performance impact than the organizational structure.

---

## Production Considerations

- Set a clear deprecation policy: "V1 controllers may be deleted 6 months after V2 is stable."
- Use a `Deprecated` PHP attribute or interface on controllers to mark version status.
- Maintain a changelog per version directory to document what each controller changed.
- Monitor error rates per version prefix to detect version-specific regressions.
- Archive old version directories to a `_archive` folder rather than deleting immediately.

---

## Common Mistakes

- **Sharing model logic between version controllers implicitly**: V2 controller uses V1's repository, which was modified to support V2 queries, accidentally changing V1 behavior.
  - *Why it happens:* DRY obsession; refactoring shared code without version awareness.
  - *Why it's harmful:* V1 API breaks because the shared service changed.
  - *Better approach:* If sharing is necessary, create a version-agnostic `Internal` service layer that neither version controls.

- **Not using inheritance for minor changes**: Rewriting the entire V2 controller when only one method changed.
  - *Why it happens:* Suspicion of inheritance ("favor composition over inheritance" over-applied).
  - *Why it's harmful:* Massive duplication, harder diff reviews.
  - *Better approach:* Extend V1 and override only the changed methods.

- **Unversioned dependencies in the constructor**: A V1 controller injects a service that was changed to support V2.
  - *Why it happens:* Shared service layer modified for V2, inadvertently affecting V1.
  - *Why it's harmful:* V1 behavior changes without notice.
  - *Better approach:* Pin V1 controllers to V1-specific service bindings; use contextual binding.

---

## Failure Modes

- **Accidental V1 regression from shared service**: A service used by V1 and V2 is changed for V2 but breaks V1. *Detection:* V1 test suite fails. *Mitigation:* Run V1 and V2 test suites separately in CI; pin V1 controllers to dedicated services.

- **Route namespace collision**: `V2/PhotoController` registers a route name that conflicts with `V1/PhotoController`. *Detection:* `route('photos.index')` returns the V2 URL instead of V1. *Mitigation:* Use versioned route name prefixes: `route('v1.photos.index')`.

- **Incomplete V2 implementation**: V2 controller misses some methods, causing 404s for clients selectively using V2. *Detection:* V2 integration tests fail. *Mitigation:* Enforce that V2 controllers implement the same interface or extend V1 to inherit unmodified methods.

---

## Ecosystem Usage

- **Laravel Spark (API)**: Spark's billing API uses versioned controller directories for Stripe API upgrades.
- **Laravel Nova (Internal API)**: Nova's internal API uses version-prefixed routes for backward compatibility across major releases.
- **Stripe API**: While not Laravel, Stripe's API versioning strategy (URL-based, `v1`/`v2`) is the reference pattern that Laravel projects emulate.

---

## Related Knowledge Units

### Prerequisites
- API Resource Controllers

### Related Topics
- Controller Organization by Domain
- Controller Code Limits

### Advanced Follow-up Topics
- Controller Testing Strategies
- Controller Middleware Assignment

---

## Research Notes

### Source Analysis
- Laravel documentation on route groups and prefixes
- PSR-4 autoloading — namespace-to-directory mapping

### Key Insight
Versioned controller directories are a convention, not a framework feature. Laravel provides the route grouping and namespace tools; the directory structure is entirely up to the team.

### Version-Specific Notes
- Laravel 8+ supports `Route::prefix()->namespace()->group()` for clean version loading.
- Laravel 9+ supports PHP 8 attributes for namespace registration, but prefix+namespace groups remain the standard approach.
- No Laravel-level changes to versioning patterns in recent versions.
