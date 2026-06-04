# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Definition
**Generated:** 2026-06-03

---

# Decision Inventory

* Controller Array Syntax vs Closure Routes
* Named Routes vs Unnamed Routes
* Feature-Based Route Files vs Single File
* Fallback Routes vs Per-Method 404 Handling

---

# Architecture-Level Decision Trees

---

## Decision 1: Controller Array Syntax vs Closure Routes

---

## Decision Context

Whether to define route handlers using controller array syntax (`[Controller::class, 'method']`) or inline closures.

---

## Decision Criteria

* Whether the route handler is simple enough for a closure
* Whether the application needs route caching
* Whether the handler needs to be testable in isolation

---

## Decision Tree

Will the application be deployed to production?
↓
NO → Closure routes are acceptable for development/prototyping
YES → Do you need `route:cache` for performance?
    ↓
    YES → Controller array syntax — a single closure route blocks caching for ALL routes
    NO → Does the route handler have more than 3 lines of logic?
        ↓
        YES → Controller array syntax — logic belongs in a controller, not a route file
        NO → Does the handler need to be tested in isolation?
            ↓
            YES → Controller array syntax — testable via controller tests
            NO → Closure route — acceptable for trivial redirects or view returns

---

## Rationale

A single Closure-based route blocks `route:cache` for the entire application. The framework throws `LogicException` when serializing closures because `SerializableClosure` cannot guarantee successful serialization for all closures. Without caching, route matching degrades from O(log n) to O(n), a 5x performance difference.

---

## Recommended Default

**Default:** Controller array syntax (`[Controller::class, 'method']`) for ALL production routes. Never use Closure-based route handlers.
**Reason:** A single Closure route blocks caching for the entire application. All routes lose the 5x performance benefit of `route:cache`.

---

## Risks Of Wrong Choice

* Closure route in production: Blocks `route:cache`; ALL routes use uncached O(n) matching
* Closure with business logic: Untestable inline code; cannot be refactored or reused
* String syntax (`'Controller@method'`): IDE cannot resolve class references; no refactoring support
* Mixed closure and controller: Inconsistent style; caching blocked despite most routes being cacheable

---

## Related Rules

* Always Use Controller Array Syntax
* Never Use Closure Routes in Production

---

## Related Skills

* Define Routes Using Controller Array Syntax
* Name Every Route for URL Generation

---

---

## Decision 2: Named Routes vs Unnamed Routes

---

## Decision Context

Whether to call `->name()` on every route definition or leave routes unnamed.

---

## Decision Criteria

* Whether the route URL is referenced anywhere (views, controllers, tests)
* Whether the application is likely to change URIs over time
* Whether the team uses `route()` helper for URL generation

---

## Decision Tree

Is the route's URL referenced in any view, controller, test, or email?
↓
NO → Consider naming anyway — future references will need it
YES → Does the team use `route()` for URL generation?
    ↓
    YES → Name the route — `route('name')` is the standard way to generate URLs
    NO → Should they use `route()`?
        ↓
        YES → Name the route and migrate to `route()` — hardcoded URLs are brittle
        NO → Is there any chance the URI will change?
            ↓
            YES → Name the route — changing the URI requires only one change in route definition
            NO → Hardcoded URL is acceptable — but document the decision
NO → Is the route a fallback or health check?
    ↓
    YES → Name it anyway — used in tests, monitoring, and potential future references
    NO → Name it — there is no valid reason to skip naming

---

## Rationale

Named routes decouple URL references from URI patterns. Changing a URI requires updating only the route definition, not every view, controller, test, and email that references it. The `route()` helper provides O(1) named route lookup via the `$nameList` hash table. Unnamed routes force hardcoded URLs throughout the application.

---

## Recommended Default

**Default:** Call `->name()` on every route definition. There is no valid reason to skip naming.
**Reason:** Unnamed routes create hardcoded URL dependencies. Changing a URI requires searching and updating every reference. Named routes make URI changes a single-line operation.

---

## Risks Of Wrong Choice

* Unnamed route referenced in 10 views: URI change requires updating all 10 references
* Hardcoded URL in test: Test fails when URI changes even though route behavior is identical
* Duplicate route names: Later registration overwrites earlier; first route is unreachable by name
* Wrong name format: `admin` instead of `admin.` produces `adminusers.index` instead of `admin.users.index`

---

## Related Rules

* Always Name Routes
* Use Dot Notation Names

---

## Related Skills

* Define Routes Using Controller Array Syntax
* Name Every Route for URL Generation

---

---

## Decision 3: Feature-Based Route Files vs Single File

---

## Decision Context

Whether to organize routes in a single `web.php` file or split into feature-based files.

---

## Decision Criteria

* Number of routes in the application
* Team size and ownership boundaries
* Need for independent feature deployment

---

## Decision Tree

Does the application have more than 50 routes?
↓
NO → Single `routes/web.php` — manageable navigation for small applications
YES → Does the team have distinct feature ownership boundaries?
    ↓
    YES → Feature-based files — each team owns their route file
    NO → Does the application have distinct domains (admin, API, webhooks)?
        ↓
        YES → Domain-based files — separate files per domain
        NO → Feature-based files — split by feature for navigation and merge conflict reduction
NO → Is the application a large monolith with 200+ routes?
    ↓
    YES → Feature-based files with domain subdirectories — `routes/web/admin.php`, `routes/web/api.php`
    NO → Feature-based files — the 50-route threshold is the industry standard for splitting

---

## Rationale

A single `web.php` file becomes impractical beyond 50 routes. Navigation degrades, merge conflicts increase, and ownership is unclear. Feature-based files provide clear ownership boundaries, reduce merge conflicts, and improve navigation. Laravel supports loading any route file via `Route::group()` or `require`.

---

## Recommended Default

**Default:** Single `web.php` for <50 routes. Feature-based files for 50+ routes. Domain subdirectories for 200+ routes.
**Reason:** Route count is the primary driver for file organization. At 50 routes, single-file navigation becomes slow. At 200+, domain grouping is essential.

---

## Risks Of Wrong Choice

* Single file with 200 routes: Slow navigation; frequent merge conflicts; unclear ownership
* Feature files for 20 routes: Premature organization; unnecessary navigation overhead
* Inconsistent file loading: Some route files not loaded; routes silently missing (404 without indication)
* Missing route caching: Feature-based files are fully compatible with `route:cache`

---

## Related Rules

* Always Use Controller Array Syntax
* Name Every Route for URL Generation

---

## Related Skills

* Define Routes Using Controller Array Syntax
* Organize Routes by Feature for Large Applications

---

---

## Decision 4: Fallback Routes vs Per-Method 404 Handling

---

## Decision Context

Whether to use `Route::fallback()` for custom 404 handling or handle 404 responses in each controller method.

---

## Decision Criteria

* Whether the 404 response is uniform across the application
* Whether API and web routes need different 404 formats
* Whether fallback is needed for unmatched routes

---

## Decision Tree

Does the application need a custom 404 response for unmatched routes (no route matched)?
↓
YES → `Route::fallback()` — handles routes that don't match any defined route
NO → Are different 404 formats needed for web and API routes?
    ↓
    YES → Multiple fallback routes — define one per middleware group with different responses
    NO → Is the 404 response uniform across all routes?
        ↓
        YES → Single `Route::fallback()` — uniform 404 handling for all unmatched routes
        NO → Does the application need per-endpoint 404 handling?
            ↓
            YES → Controller-level 404 — `abort(404)` or model binding 404 in individual endpoints
            NO → Single fallback — uniform handling is sufficient
NO → Is the application an API?
    ↓
    YES → JSON fallback — `Route::fallback(fn () => response()->json(['message' => 'Not Found'], 404))`
    NO → View fallback — `Route::fallback(fn () => response()->view('errors.404', [], 404))`

---

## Rationale

`Route::fallback()` creates a special route deferred to last priority — it only activates when no explicit route matches. It can be defined multiple times with different middleware for different 404 formats. Controller-level 404 handling (via `abort(404)` or `ModelNotFoundException`) handles matched routes with invalid model IDs.

---

## Recommended Default

**Default:** `Route::fallback()` for unmatched routes. `abort(404)` in controllers for matched routes with invalid parameters. Use the exception handler for custom 404 rendering.
**Reason:** Fallback handles the "no route matched" case. Controller 404 handles "route matched but resource not found." Both are needed.

---

## Risks Of Wrong Choice

* No fallback: Unmatched routes return the default Symfony 404 page — unstyled, unprofessional
* Fallback only: Invalid model IDs return unhandled exceptions instead of 404
* Fallback with web middleware on API: Fallback returns HTML when API clients expect JSON
* Fallback returning 200: `Route::fallback(fn () => 'Not found')` without status code returns 200

---

## Related Rules

* Always Use Controller Array Syntax
* Name Every Route for URL Generation

---

## Related Skills

* Define Routes Using Controller Array Syntax
* Implement Fallback Routes for Custom 404 Handling
