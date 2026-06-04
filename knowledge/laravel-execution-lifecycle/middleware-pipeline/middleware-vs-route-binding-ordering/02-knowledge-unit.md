# Middleware vs Route Binding Ordering
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
The execution order of middleware relative to route model binding is one of the most common sources of subtle bugs in Laravel applications. Route model binding (via `SubstituteBindings`) replaces route parameters with Eloquent model instances before the controller runs. If middleware that accesses route model bindings runs *before* `SubstituteBindings`, the route parameters are still raw IDs — the model has not been resolved yet. This ordering dependency is controlled by the `$middlewarePriority` array.

## Core Concepts
`SubstituteBindings` middleware is responsible for converting `{user}` in a route URI to an actual `User` model instance using implicit or explicit binding. Middleware that expects to receive model instances (e.g., checking if a user can access a resource) must run *after* `SubstituteBindings`. The default priority list places `SubstituteBindings` early, but custom middleware may accidentally be placed before it, causing null model references.

## Mental Models
**Assembly Line:** Route model binding is the assembly station that turns part numbers (IDs) into actual parts (models). Middleware that needs the assembled parts must be placed after this station. Putting middleware before it means the parts are still just numbers.

**Baking Order:** You can't frost a cake before it's baked. Middleware that requires model instances is the frosting; `SubstituteBindings` is the oven. Order matters.

## Internal Mechanics
`SubstituteBindings` is registered as a middleware class in the `web` group and typically in the priority list. When the router gathers middleware, it builds the complete list and then applies priority sorting. If custom middleware is added to the `web` group but not listed in `$middlewarePriority`, its position relative to `SubstituteBindings` depends on the order of entries in the group array. Middleware before `SubstituteBindings` in the priority list runs first; middleware after it runs second.

```php
// Priority ensures SubstituteBindings runs after session middleware
// but before route handler middleware
protected $middlewarePriority = [
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Illuminate\Auth\Middleware\Authorize::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
];
```

## Patterns
- **Prerequisite Pipeline:** `SubstituteBindings` is a prerequisite for any middleware that inspects route models.
- **Priority-Based Ordering:** The global priority list enforces correct ordering across group boundaries.
- **Late Binding:** Route model binding intentionally happens late in the pipeline to maximize middleware context before model resolution.

## Architectural Decisions
Laravel chose to make `SubstituteBindings` a middleware rather than a pre-pipeline step to allow middleware (like `StartSession` and `Authenticate`) to run before models are loaded. This means authentication can happen without loading every route model — saving database queries on unauthenticated requests. However, this design places the burden on developers to understand the ordering constraint.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Authentication before model binding saves queries | Developers must manage ordering carefully | Common source of bugs when custom middleware accesses route bindings |
| Models are only bound when the pipeline reaches SubstituteBindings | Middleware before binding receives raw parameters | Must call `$request->route('id')` instead of `$request->user` |
| Flexible — allows middleware to modify request before binding | Priority list must be maintained by developers | Outdated priority causes silent failures |

## Performance Considerations
Placing `SubstituteBindings` after authentication means unauthenticated requests skip model binding entirely — a significant performance optimization. For protected routes, auth can reject the request before any database queries for route binding are made.

## Production Considerations
When adding custom middleware that accesses route models, explicitly set its position relative to `SubstituteBindings` in the priority list. Test with both authenticated and unauthenticated requests to verify behavior. Use `php artisan route:list -v` to confirm middleware ordering.

## Common Mistakes
**Why it happens:** A developer adds a middleware to check resource ownership but places it before `SubstituteBindings` in the group definition. **Why it's harmful:** `$request->route('post')` returns `null` (or returns a string ID) because the binding hasn't run yet. The middleware fails silently or throws an unexpected error. **Better approach:** Add the middleware after the `SubstituteBindings` entry in the group array, or add it to the priority list after `SubstituteBindings`.

## Failure Modes
- **Null model in middleware:** Binding hasn't run yet — `$request->route('model')` returns raw ID.
- **Authorization middleware before SubstituteBindings:** The `Authorize` middleware (`can:update,post`) fails because `$post` is `null`.
- **Binding resolution failure:** An exception in `SubstituteBindings` (model not found) happens after middleware that already accessed the route — partial execution.

## Ecosystem Usage
- **Laravel Authorization:** `can:update,post` uses route binding to get the `$post` model — must run after `SubstituteBindings`.
- **Laravel Nova:** Resource authorization middleware depends on route model binding.
- **Spatie Laravel Permission:** Permission checking on specific models requires binding to have run.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (execution order in pipeline)
- Middleware Priority (global sort affecting SubstituteBindings position)
- Route Middleware (where binding middleware fits in group definitions)

### Related Topics
- Route Model Binding (implicit and explicit binding mechanics)
- Middleware Groups (SubstituteBindings placement in web/api groups)

### Advanced Follow-up Topics
- Implicit vs Explicit Route Binding (binding resolution strategies)
- Route Parameter Customization (custom binding resolvers)
- Boot Order Timing (when model binding occurs relative to auth middleware)
- Kernel Architecture (SubstituteBindings role in request lifecycle)

## Research Notes
**Source Analysis:** `Illuminate\Routing\Middleware\SubstituteBindings` (vendor/laravel/framework/src/Illuminate/Routing/Middleware/SubstituteBindings.php).
**Key Insight:** The position of `SubstituteBindings` in `$middlewarePriority` determines when route models become available. It's intentionally after auth but before authorization.
**Version-Specific Notes:** The ordering has been stable since Laravel 5.x. Laravel 11 maintains the same priority arrangement.
