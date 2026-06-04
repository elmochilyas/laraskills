# ECC Anti-Patterns — Route Registration Order

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Route Registration Order |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Alphabetical Route Ordering
2. Routes Registered in register()
3. Duplicate Route Definitions
4. Fallback Route Registered Before Other Routes
5. Closure-Only Routes Blocking Caching

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — routes that trigger controller resolution with eager loading in `register()`
- Premature Caching — route caching before all route files are finalized

---

## Anti-Pattern 1: Alphabetical Route Ordering

### Category
Reliability

### Description
Organizing route definitions alphabetically rather than by specificity, causing wildcard routes to shadow specific routes.

### Why It Happens
Developers apply generic file organization rules to routes without understanding Laravel's first-match-wins routing semantics.

### Warning Signs
- Routes sorted alphabetically in route files
- `/users/{user}` defined before `/users/create` (alphabetically: "user" < "users")
- Wildcard routes matched unexpectedly for specific URLs

### Why It Is Harmful
The Router returns the first matching route in registration order. An alphabetically-earlier wildcard route like `/users/{user}` matches "create" before the specific `/users/create` route is reached. The specific route is shadowed and never matched.

### Real-World Consequences
A developer alphabetically sorts routes in `web.php`. `/users/{user}` (show) appears before `/users/create` (create). Users navigating to `/users/create` see the show action for a user named "create" — a 404 or wrong page. The create page is unreachable.

### Preferred Alternative
Order routes by specificity: literal routes before parameterized routes, specific patterns before broad patterns, fallback routes last.

### Refactoring Strategy
1. Review all route files and identify parameterized routes (`{param}`)
2. Ensure literal routes at the same URI position are defined before parameterized routes
3. Place `Route::fallback()` as the very last definition
4. Document the ordering convention in the team's coding standards

### Detection Checklist
- [ ] Routes sorted alphabetically
- [ ] Wildcard route before specific route (e.g., `/{user}` before `/create`)
- [ ] `/users/create` returns wrong handler or 404

### Related Rules
Route Registration Order Rule 1 (05-rules.md): Define Specific Routes Before Wildcard Routes.

### Related Skills
Order Routes Correctly for First-Match Routing (06-skills.md).

### Related Decision Trees
Route Ordering Strategy (07-decision-trees.md).

---

## Anti-Pattern 2: Routes Registered in register()

### Category
Framework Usage

### Description
Registering routes inside a service provider's `register()` method instead of `boot()`.

### Why It Happens
Developers are not aware of the two-phase provider lifecycle and treat `register()` as the initialization method for all provider logic.

### Warning Signs
- `Route::get()`, `Route::post()`, `Route::resource()` in `register()`
- `$this->loadRoutesFrom()` in `register()`
- Route definitions in `AppServiceProvider::register()`

### Why It Is Harmful
Route registration often depends on services that may not be available during `register()`. The `register()` phase should contain only container bindings. Routes registered in `boot()` have access to all provider bindings and services.

### Real-World Consequences
A developer calls `Route::middleware('auth')->group(...)` in `register()`. The `auth` middleware's binding may not be resolved yet. Route registration fails silently or throws an exception depending on provider ordering. Routes that should work return 404 or unexpected errors.

### Preferred Alternative
Always register routes in a provider's `boot()` method, typically in `RouteServiceProvider::boot()`.

### Refactoring Strategy
1. Move all route definitions from `register()` methods to `boot()` methods
2. Ensure `RouteServiceProvider` handles all route file loading in its `boot()`
3. Verify no `Route::` calls remain in any `register()` method

### Detection Checklist
- [ ] `Route::get()`, `post()`, etc. in `register()`
- [ ] `$this->loadRoutesFrom()` in `register()`
- [ ] Routes that work intermittently depending on provider order

### Related Rules
Route Registration Order (04-standardized-knowledge.md): Do not register routes in `register()` methods.

### Related Skills
Order Routes Correctly for First-Match Routing (06-skills.md).

### Related Decision Trees
Route Handler Type Selection (07-decision-trees.md).

---

## Anti-Pattern 3: Duplicate Route Definitions

### Category
Reliability

### Description
Defining two routes with the same HTTP method and URL pattern, relying on first-match behavior rather than eliminating the duplicate.

### Why It Happens
Routes accumulate over time. Developers add new routes without checking if similar routes exist, or add fallback routes that shadow existing ones.

### Warning Signs
- Two `GET /users/{id}` definitions with different handlers
- A `Route::fallback()` that shadows specific routes defined after it
- Confusion about which handler actually serves a given URL

### Why It Is Harmful
Only the first matching route is used. The second route is dead code — it never matches. This wastes maintenance effort and leads to confusion when developers update the wrong route definition.

### Real-World Consequences
A developer adds `GET /reports/{id}` to a new route file. An existing route file already defines `GET /reports/{id}` pointing to a different controller. The first definition wins. The developer modifies the second (dead) controller for weeks before discovering it is never invoked.

### Preferred Alternative
Ensure each URL + HTTP method combination has exactly one route definition. Use route naming to distinguish different purposes.

### Refactoring Strategy
1. Run `php artisan route:list` to see all registered routes
2. Identify duplicate method + URL patterns
3. Remove the duplicate that is never matched (or merge them)
4. Use route names (`->name()`) for disambiguation

### Detection Checklist
- [ ] Same HTTP method and URL defined twice
- [ ] Route never matched in `route:list` output
- [ ] Dead code in controllers that are never reached

### Related Rules
Route Registration Order (04-standardized-knowledge.md): Do not register duplicate routes with different handlers.

### Related Skills
Order Routes Correctly for First-Match Routing (06-skills.md).

### Related Decision Trees
Route Ordering Strategy (07-decision-trees.md).

---

## Anti-Pattern 4: Fallback Route Registered Before Other Routes

### Category
Reliability

### Description
Placing `Route::fallback()` before other route definitions, causing the fallback to intercept requests that should match later routes.

### Why It Happens
Developers add fallback routes at the top of the file for visibility, not realizing order determines behavior.

### Warning Signs
- `Route::fallback()` appears before other route definitions
- Routes added after `fallback()` are unreachable
- 404 responses for valid URLs

### Why It Is Harmful
`Route::fallback()` catches all requests that no other route matches. If any route is registered after it, that route is never tried — the fallback intercepts all unmatched requests first. Fallback must be the final entry.

### Real-World Consequences
A developer places `Route::fallback()` at line 5 of `web.php` for "easy discovery." All routes defined at lines 6+ are unreachable — the fallback catches every request before they are tried. The entire application returns custom 404 responses.

### Preferred Alternative
Always register `Route::fallback()` as the very last route definition, after all other routes.

### Refactoring Strategy
1. Move `Route::fallback()` to the end of the last route file
2. Ensure no route definitions exist after `fallback()`
3. Verify with `php artisan route:list` that fallback appears last

### Detection Checklist
- [ ] `Route::fallback()` not at the end of route definitions
- [ ] Routes defined after `fallback()` in any file
- [ ] Valid URLs returning 404

### Related Rules
Route Registration Order Rule 3 (05-rules.md): Register Fallback Routes Last.

### Related Skills
Order Routes Correctly for First-Match Routing (06-skills.md).

### Related Decision Trees
Route Ordering Strategy (07-decision-trees.md).

---

## Anti-Pattern 5: Closure-Only Routes Blocking Caching

### Category
Performance

### Description
Using PHP closure handlers for all or most routes, preventing `php artisan route:cache` from working.

### Why It Happens
Closures are convenient for quick development. Developers use them for simplicity without planning for production route caching.

### Warning Signs
- `Route::get('/url', function () { ... })` patterns across route files
- `php artisan route:cache` throws `LogicException`
- No controller classes used for route handlers

### Why It Is Harmful
`php artisan route:cache` serializes the route collection. Closures cannot be serialized — the command throws a `LogicException` if any route uses a closure handler. Without route caching, every request pays 20-40ms extra route registration time.

### Real-World Consequences
An application with 500 routes uses closures for all of them. `route:cache` fails with `LogicException`. The production deployment cannot use route caching. Each request spends 30ms registering routes. At 500 req/s, that's 15 seconds of cumulative route registration time per second.

### Preferred Alternative
Use controller class strings for all route handlers. Reserve closures for development-only route files excluded from caching.

### Refactoring Strategy
1. Replace each `Route::get('/url', function () { ... })` with a controller method
2. Create controllers for grouped route handlers
3. Run `php artisan route:cache` to verify all closures are eliminated
4. For simple view routes, use `Route::view()` instead

### Detection Checklist
- [ ] Closure-based route handlers in production route files
- [ ] `php artisan route:cache` fails with `LogicException`
- [ ] No controller classes used for route handlers

### Related Rules
Route Registration Order Rule 2 (05-rules.md): Always Use Controller Classes, Not Closures, With Route Caching.

### Related Skills
Order Routes Correctly for First-Match Routing (06-skills.md).

### Related Decision Trees
Route Handler Type Selection (07-decision-trees.md).
