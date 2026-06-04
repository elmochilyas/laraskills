# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Caching
**Generated:** 2026-06-03

---

# Decision Inventory

* Controller-Based Routes vs Closure Routes (Cacheable vs Non-Cacheable)
* Route Caching on Every Deployment vs Conditional/Optional Caching
* Route Caching in CI/CD Pipeline vs Manual Cache on Server
* Caching in Development vs Always Running route:clear

---

# Architecture-Level Decision Trees

---

## Decision 1: Controller-Based Routes vs Closure Routes (Cacheable vs Non-Cacheable)

---

## Decision Context

Whether to use controller classes (cacheable) or Closure handlers (non-cacheable) for route definitions.

---

## Decision Criteria

* Whether route caching is desired in production
* Whether the route is trivial (single-line redirect)
* Whether the team prefers Closure routes for simplicity

---

## Decision Tree

Is route caching desired in production?
↓
YES → ALWAYS use controller-based routes — a single Closure blocks caching for ALL routes
    ↓
    YES → Is the route a trivial redirect (e.g., `/home` → `/dashboard`)?
        ↓
        YES → Use an invokable controller — `RedirectController` or dedicated invokable class
        NO → Use a full controller — standard controller class with named methods
    YES → Is the route a health-check or simple response?
        ↓
        YES → Use an invokable controller — `HealthController::class` is cleaner than a Closure
        NO → Use a full controller — standard controller class
NO → Is the application in development with no caching requirement?
    ↓
    YES → Closure routes are acceptable for development — but use controllers anyway for consistency
    NO → Closure routes are acceptable — but be aware the application cannot be cached until converted

---

## Rationale

Closure routes cannot be serialized because Closures capture external scope and cannot be reliably serialized by `SerializableClosure`. The framework errors on ANY Closure route, blocking caching for the ENTIRE application. There is no opt-out or selective caching. Converting a Closure to an invokable controller is the fix — the controller class name is serializable.

---

## Recommended Default

**Default:** ALWAYS use controller-based routes. Never use Closure routes in any route that runs in production.
**Reason:** A single Closure route blocks caching for all routes, losing a 5x performance improvement. The cost of creating a controller class is minimal.

---

## Risks Of Wrong Choice

* Single Closure route: Entire application loses route caching; 5-15ms route matching on every request
* Closure route in API with 200 routes: All 200 routes are uncacheable because of one Closure
* Closure route in `routes/web.php`: All web routes uncacheable; admin routes also affected
* Controller route with dynamic constructor: Route caching serializes the controller class name; if the controller has required constructor params, route resolution may fail

---

## Related Rules

* Enforce Controller-Based Routes for All Production Code (Ban Closure Routes)
* Enforce route:cache in Deployment Scripts
* Enforce route:clear Before Route Modifications in Development

---

## Related Skills

* Convert Closure Routes to Invokable Controllers for Caching
* Run route:cache in Deployment Pipeline

---

---

## Decision 2: Route Caching on Every Deployment vs Conditional/Optional Caching

---

## Decision Context

Whether to run `php artisan route:cache` on every deployment or only when routes change.

---

## Decision Criteria

* Whether routes change frequently between deployments
* Whether the deployment script can handle cache generation failures
* Whether the application has Closure routes that block caching

---

## Decision Tree

Do routes change frequently (multiple times per week)?
↓
YES → Cache on every deployment — routes change often; cache must reflect latest state
NO → Do routes change infrequently (monthly or less)?
    ↓
    YES → Cache on every deployment — always cache regardless of change frequency; consistency
    NO → Cache on every deployment — the cost of caching is negligible; the risk of stale cache is high
YES → Are there any Closure routes that would block caching?
    ↓
    YES → Fix Closure routes FIRST — caching will fail with LogicException; deployment will break
    NO → Cache on every deployment — no blockers
NO → Does the deployment script handle cache generation failures gracefully?
    ↓
    YES → Cache on every deployment — if caching fails, the fallback is uncached (slower but functional)
    NO → Add failure handling — `php artisan route:cache || true` or check route:cache --verbose

---

## Rationale

Route caching should be a standard step in every deployment, regardless of whether routes changed. The cache generation takes 2-5 seconds for most applications. The risk of a stale cache (missing new routes, exposing old middleware) is far greater than the cost of regenerating. Always caching ensures the cache is always fresh.

---

## Recommended Default

**Default:** `php artisan route:cache` on every deployment, always.
**Reason:** Caching is fast; stale cache is dangerous. Always caching eliminates the risk of forgetting to cache after route changes.

---

## Risks Of Wrong Choice

* Cache only when routes change: Deployment script skips caching; routes changed but cache wasn't regenerated — 404 on new routes
* Cache on every deployment with Closure routes: Deployment fails; pipeline must handle the error gracefully
* No caching at all: Route matching is O(n) on every request; unnecessary server load
* Cache only on major deployments: Hotfix that adds routes doesn't trigger cache — 404 errors on production

---

## Related Rules

* Enforce Controller-Based Routes for All Production Code (Ban Closure Routes)
* Enforce route:cache in Deployment Scripts
* Enforce route:clear Before Route Modifications in Development

---

## Related Skills

* Convert Closure Routes to Invokable Controllers for Caching
* Run route:cache in Deployment Pipeline

---

---

## Decision 3: Route Caching in CI/CD Pipeline vs Manual Cache on Server

---

## Decision Context

Whether to run `route:cache` as part of the automated deployment pipeline or manually on the server after deployment.

---

## Decision Criteria

* Whether the deployment uses CI/CD automation
* Whether the build environment matches the production environment
* Whether the route cache is included in the build artifact

---

## Decision Tree

Is the deployment fully automated (CI/CD pipeline)?
↓
YES → Run `route:cache` in the pipeline — automated, consistent, auditable
NO → Is the deployment manual (rsync, git pull on server)?
    ↓
    YES → Run `route:cache` in the post-deployment script or manually after each deploy
    NO → Automate caching — any production environment should automate caching
YES → Does the build environment have the same PHP version and extensions as production?
    ↓
    YES → Cache is safe to generate in CI — the serialized route collection is compatible
    NO → Cache on the target server — incompatible PHP versions may produce incompatible serialized routes
NO → Is the route cache included in the deployment artifact (Docker image, build package)?
    ↓
    YES → Run in CI if environment matches; otherwise run at container startup
    NO → Run at deployment time in the pipeline or post-deployment script

---

## Rationale

Running `route:cache` in CI ensures consistency — every deployment goes through the same build process. Manual caching on the server is error-prone (forgotten steps, different developers, different environments). The route cache is PHP-version-specific in rare cases, so if the CI environment differs from production, cache on the target server.

---

## Recommended Default

**Default:** Run `php artisan route:cache` in the CI/CD pipeline. Run `php artisan route:list` to verify.
**Reason:** Automated caching is consistent, auditable, and eliminates the risk of forgetting to cache.

---

## Risks Of Wrong Choice

* Manual caching: Developer deploys but forgets to cache — stale routes; 404 errors
* CI caching with different PHP version: Serialized route collection may not deserialize correctly on production
* CI caching without verification: Cache generation succeeds but produces incomplete cache — `route:list` catches this
* Caching at container startup: Every container startup regenerates the cache — added latency per instance

---

## Related Rules

* Enforce Controller-Based Routes for All Production Code (Ban Closure Routes)
* Enforce route:cache in Deployment Scripts
* Enforce route:clear Before Route Modifications in Development

---

## Related Skills

* Convert Closure Routes to Invokable Controllers for Caching
* Run route:cache in Deployment Pipeline

---

---

## Decision 4: Caching in Development vs Always Running route:clear

---

## Decision Context

Whether to use route caching in development environments or always clear the cache when working on routes.

---

## Decision Criteria

* Whether route modifications are frequent during development
* Whether the developer understands the caching behavior
* Whether the team has been burned by stale cache in development

---

## Decision Tree

Is the developer actively modifying route files?
↓
YES → ALWAYS clear the cache — `php artisan route:clear` — stale cache masks route changes
    ↓
    YES → Does the developer need to test route caching behavior?
        ↓
        YES → Cache explicitly for the test, then clear immediately after
        NO → Do NOT cache — it hides route file changes; every route modification requires a cache clear
    YES → Is the application running in `APP_ENV=local`?
        ↓
        YES → route:clear on every environment start — add to a dev setup script
        NO → route:clear before each route modification session
NO → Is the environment shared (vagrant, sail, docker)?
    ↓
    YES → route:clear in the environment setup script — prevent stale cache from shared image
    NO → route:clear on git pull — if routes changed, clear cache before testing

---

## Rationale

Route caching in development masks route file changes. A developer adding a new route will see a 404 because the cache loads old routes. The framework silently falls back to cached routes without warning. This causes confusion and wasted debugging time. Development environments should never have route caching active.

---

## Recommended Default

**Default:** NEVER cache routes in development. Clear cache (`route:clear`) at the start of any session involving route modifications.
**Reason:** Stale cache silently masks route changes. Developers waste time debugging 404s that are just stale cache.

---

## Risks Of Wrong Choice

* Cache active during development: New route returns 404; developer wastes 30 minutes debugging middleware, controllers, and auth
* Forgetting to clear after pull: Team member adds routes; you pull their changes but cache still has old routes — 404
* `route:clear` at environment shutdown: Next environment start has no cache — routes load from files (expected behavior in dev)
* `route:cache` in dev for performance: Premature optimization; route matching speed is irrelevant in development

---

## Related Rules

* Enforce Controller-Based Routes for All Production Code (Ban Closure Routes)
* Enforce route:cache in Deployment Scripts
* Enforce route:clear Before Route Modifications in Development

---

## Related Skills

* Convert Closure Routes to Invokable Controllers for Caching
* Run route:cache in Deployment Pipeline
