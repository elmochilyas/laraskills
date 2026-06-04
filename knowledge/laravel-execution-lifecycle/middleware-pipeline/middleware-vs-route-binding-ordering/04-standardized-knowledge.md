# Middleware vs Route Binding Ordering

## Metadata
- **ID:** ku-08-middleware-priority
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
The execution order of middleware relative to route model binding is one of the most common sources of subtle bugs in Laravel applications. Route model binding (via `SubstituteBindings`) replaces route parameters with Eloquent model instances before the controller runs. If middleware that accesses route model bindings runs *before* `SubstituteBindings`, the route parameters are still raw IDs — the model has not been resolved yet. This ordering dependency is controlled by the `$middlewarePriority` array.

## Core Concepts
- **`SubstituteBindings` Middleware**: Converts `{user}` in a route URI to an actual `User` model instance using implicit or explicit binding.
- **Ordering Dependency**: Middleware that expects model instances must run *after* `SubstituteBindings`.
- **Priority Control**: The default priority list places `SubstituteBindings` after session and auth middleware but before route handler middleware.
- **Default Position**: `SubstituteBindings` runs after `Authenticate` but before the controller — auth runs first, then bindings are resolved, then the controller receives models.
- **Group Placement**: `SubstituteBindings` is in both `web` and `api` groups — it's a required middleware for route model binding to work.

## When To Use
- **Custom middleware accessing route models**: If your middleware inspects `$request->route('user')` or uses `$request->user()`, ensure it runs after `SubstituteBindings`.
- **Authorization middleware**: `can:update,post` uses route binding to get `$post` model — must run after `SubstituteBindings`.
- **Multi-tenant middleware**: Resolving the current tenant from a route parameter must happen after binding.
- **Resource ownership checks**: Verifying a user owns a resource requires the resource model to be bound.

## When NOT To Use
- **Middleware that doesn't use route bindings**: If middleware only inspects request headers, IP, or method — ordering relative to SubstituteBindings doesn't matter.
- **Authentication-only middleware**: `auth` middleware should run *before* `SubstituteBindings` so unauthenticated requests skip model loading.
- **Request normalization middleware**: `TrimStrings`, `ConvertEmptyStringsToNull` — these modify request input and should run before binding.

## Best Practices (WHY)
- **Place middleware after `SubstituteBindings` in the group array if it accesses route models**: The group array order matters — entries after `SubstituteBindings` run after binding. *Why: This is the simplest way to ensure correct ordering without modifying the global priority list.*
- **Use the priority list for cross-source ordering**: If middleware comes from a different source (global vs group vs route), use priority to ensure it runs after `SubstituteBindings`. *Why: Priority overrides merge order — necessary when middleware sources differ.*
- **Test with both authenticated and unauthenticated requests**: Verify binding-aware middleware works in both scenarios. *Why: Auth middleware before SubstituteBindings means authenticated requests bind; unauthenticated requests skip binding — both paths must be tested.*
- **Never assume `$request->route('param')` is a model**: Before SubstituteBindings runs, it's a raw ID string. Always handle both cases. *Why: Middleware running before binding receives raw parameters — accessing them as models causes errors.*

## Architecture Guidelines
- **`SubstituteBindings` as middleware, not pre-pipeline step**: Allows auth to run before model loading — saves DB queries on unauthenticated requests.
- **Auth before binding**: Unauthenticated requests skip model binding entirely — significant performance optimization.
- **Priority position**: `SubstituteBindings` after `Authenticate` but before `Authorize` — auth first, then bind, then authorize.
- **Performance**: Placing auth before binding means unauthenticated requests never trigger binding DB queries.

## Performance
- **Auth-before-binding optimization**: Unauthenticated requests never load models — saves database queries for every rejected request.
- **Binding cost**: Each route parameter with implicit binding triggers a database query. Auth-first reduces this to authenticated routes only.
- **Priority sort overhead**: Sorting happens once per request — negligible.

## Security
- **Null model in middleware**: Binding hasn't run — `$request->route('model')` returns raw ID instead of model instance.
- **Authorization before bindings**: `can:update,post` fails because `$post` is null.
- **Partial execution risk**: Exception in `SubstituteBindings` (model not found) happens after middleware that already accessed the route — inconsistent state.
- **Silent failures**: Middleware expecting a model receives a string — may produce unexpected behavior without throwing an error.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Adding resource-check middleware before SubstituteBindings | Not understanding order | $request->route('post') returns null or string ID | Place middleware after SubstituteBindings in group/priority |
| Assuming all middleware has model bindings available | Not knowing binding happens mid-pipeline | Silent null references | Always verify binding ran before accessing route models |
| Priority change without testing | Adding custom middleware to priority list | Breaks auth-before-binding optimization | Test both auth and unauth paths |
| Over-relying on implicit binding order | Implicit binding follows same SubstituteBindings order | Same ordering constraints apply | Same position rules for implicit binding |

## Anti-Patterns
- **Manually resolving bindings in middleware**: Duplicating `SubstituteBindings` logic because order isn't managed. Use proper ordering instead.
- **Accessing route parameters as models without checking**: Assuming `$request->route('post')` is always a model instance rather than raw ID.
- **Placing ALL custom middleware before binding**: Auth should be before, but resource-checking middleware should be after. One-size-fits-all ordering doesn't work.
- **Ignoring the priority list**: Adding middleware to groups without considering where `SubstituteBindings` falls in the priority order.

## Examples

```php
// Default priority: SubstituteBindings position
protected $middlewarePriority = [
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Illuminate\Auth\Middleware\Authorize::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class, // After auth
];

// WRONG: Resource middleware before SubstituteBindings
Route::get('/posts/{post}', [PostController::class, 'show'])
    ->middleware('check-owner'); // $request->route('post') is still a string ID!

// RIGHT: Resource middleware after SubstituteBindings
// In group definition, place after SubstituteBindings
protected $middlewareGroups = [
    'web' => [
        // ... other middleware
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \App\Http\Middleware\CheckPostOwner::class, // After binding — receives model
    ],
];

// Or use priority
->withMiddleware(function (Middleware $middleware) {
    $middleware->priority([
        \App\Http\Middleware\CheckPostOwner::class,
        // If CheckPostOwner must run before SubstituteBindings, order here
    ]);
})
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Execution order in pipeline.
- **Middleware Priority**: Global sort affecting SubstituteBindings position.
- **Route Middleware**: Where binding middleware fits in group definitions.
- **Route Model Binding**: Implicit and explicit binding mechanics.
- **Middleware Groups**: SubstituteBindings placement in web/api groups.

## AI Agent Notes
- `SubstituteBindings` is a middleware class at `Illuminate\Routing\Middleware\SubstituteBindings.php`.
- The position of `SubstituteBindings` in `$middlewarePriority` determines when route models become available. It's intentionally after auth but before authorization.
- This ordering has been stable since Laravel 5.x. Laravel 11 maintains the same priority arrangement.
- Implicit binding (type-hinted model in controller) and explicit binding both depend on `SubstituteBindings` middleware.

## Verification
- [ ] Create a route with `{user}` parameter — access `$request->route('user')` in middleware before and after SubstituteBindings
- [ ] Observe that before binding, `$request->route('user')` is a string ID; after binding, it's a User model
- [ ] Add custom middleware that checks resource ownership — place it correctly relative to SubstituteBindings
- [ ] Test with unauthenticated request — verify auth middleware rejects before model binding runs
- [ ] Add middleware to priority list — verify correct ordering
- [ ] Test authorization middleware `can:update,post` — verify it receives bound model
