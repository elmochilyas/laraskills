# Route Model Binding — Explicit

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Route Model Binding — Explicit
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-01

---

## Executive Summary

Explicit route model binding gives developers direct control over how route parameters are resolved into models — bypassing the convention-based implicit binding system. Three mechanisms exist: `Route::model()` for global binding by parameter name, `Route::bind()` for custom callbacks, and `resolveRouteBinding()`/`resolveChildRouteBinding()` overrides on the model class itself.

The critical tradeoff with explicit binding is that it sacrifices convention for control. `Route::model()` applies globally — every `{user}` parameter in every route resolves through the same binding. This is fine for simple overrides (changing the column) but dangerous when different routes need different binding logic for the same parameter name. `Route::bind()` provides per-parameter custom logic but requires knowing the specific parameter name at registration time. Model-level overrides (`resolveRouteBinding()`) provide the most targeted control without changing the route definition.

Explicit binding runs BEFORE implicit binding in the `SubstituteBindings` middleware. This ordering means explicit bindings can establish context (resolve a tenant, load a configuration, authenticate via a token) that subsequent implicit bindings depend on. This makes explicit binding the correct choice for "enrichment" scenarios where one parameter's resolution affects how other parameters are resolved.

---

## Core Concepts

### Route::model() — Global Parameter Binding
`Router::model($key, $class, $closure)` registers a binding for all routes with a parameter named `$key`:
```php
Route::model('user', User::class);
```
Every `{user}` in every route resolves to a User model. The optional `$closure` provides custom "not found" behavior instead of the default 404.

Internally, `Route::model()` stores the binding in `Router::$binders[$key]` via `RouteBinding::forModel()`:
```php
$this->binders['user'] = function ($value) use ($class) {
    return (new $class)->resolveRouteBinding($value) ?? throw new ModelNotFoundException;
};
```

### Route::bind() — Custom Callback Binding
`Router::bind($key, $binder)` registers a custom resolution callback:
```php
Route::bind('user', function (string $value) {
    return User::where('slug', $value)->where('active', true)->firstOrFail();
});
```

The `$binder` can be:
- A Closure: receives `($value, $route)`, returns the model or throws
- A `Class@method` string: resolved from the container, called with `($value, $route)`

`RouteBinding::forCallback()` wraps the binder in a Closure. `RouteBinding::createClassBinding()` handles `Class@method` resolution:
```php
function ($value, $route) use ($class, $method) {
    return app($class)->$method($value, $route);
}
```

### Model-Level Resolution Override
The `UrlRoutable` contract defines overridable methods on the model:
- `resolveRouteBinding($value, $field = null)` — Called during implicit AND explicit (`Route::model()`) binding. Default: `where($field ?? $this->getRouteKeyName(), $value)->firstOrFail()`
- `resolveChildRouteBinding($childType, $value, $field)` — Called for scoped child resolution
- `resolveRouteBindingQuery($query, $value, $field)` — Called by the default `resolveRouteBinding()` to customize the query

Overriding `resolveRouteBindingQuery()` is the most surgical approach — it modifies the query without changing how the model is resolved:
```php
protected function resolveRouteBindingQuery($query, $value, $field = null)
{
    return $query->where($field ?? $this->getRouteKeyName(), $value)
                 ->where('tenant_id', app('currentTenant')->id)
                 ->whereNull('deleted_at');
}
```

---

## Mental Models

### Explicit as Escape Hatch
Implicit binding works for 80% of cases — standard `where-id` resolution with a clean parameter name match. Explicit binding is the escape hatch for the 20% that don't fit: custom columns, multi-tenant scoping, soft delete handling, conditional resolution. Using explicit binding unnecessarily adds ceremony without benefit.

### Global vs Local Registration
`Route::model()` is global — it affects every route with that parameter name. `Route::bind()` can be scoped within a route group. Model-level overrides (`resolveRouteBinding()`) affect every resolution of that model regardless of route type. The choice is about scope of effect:
- Global across all routes for any model of this type → `resolveRouteBinding()`
- Global across all routes for this parameter name → `Route::model()`
- Scoped to a specific parameter in a specific context → `Route::bind()`

### Execution Order as Dependency
Explicit binding runs first in `SubstituteBindings`. This means an explicit binding for `{team}` can resolve the team and store it on the container. A subsequent implicit binding for `{post}` can then use scoped resolution through the team relationship. The ordering transforms explicit binding from a simple resolver into a context provider.

---

## Internal Mechanics

### SubstituteBindings Middleware Execution
```php
class SubstituteBindings
{
    public function handle($request, $next)
    {
        $route = $request->route();
        
        // PASS 1: Explicit bindings
        $this->router->substituteBindings($route);
        // Iterates $route->parameters() keys
        // For each key in $this->binders:
        //   Calls performBinding($key, $value, $route)
        //   Stores result back to route parameter
        
        // PASS 2: Implicit bindings
        $this->router->substituteImplicitBindings($route);
        // Resolves type-hinted models and enums
        
        return $next($request);
    }
}
```

### performBinding Implementation
`Router::performBinding($key, $value, $route)`:
1. Look up `$this->binders[$key]` — if no explicit binding registered, return (let implicit handle it)
2. Call the binder callback with `$value` and `$route`
3. If the binding returns null (not found), throw `ModelNotFoundException` (or call custom error closure from `Route::model()`)
4. Set the resolved value on the route: `$route->setParameter($key, $result)`

### Route::model() Storage
`Route::model('user', User::class)` stores:
```php
$this->binders['user'] = RouteBinding::forModel($this->app, User::class, $closure);
```

`RouteBinding::forModel()` creates:
```php
function ($value) use ($app, $class) {
    $model = $app->make($class);
    $instance = $model->resolveRouteBinding($value);
    if (!$instance) {
        throw (new ModelNotFoundException)->setModel($class, [$value]);
    }
    return $instance;
}
```

Note: `resolveRouteBinding()` is called — this means model-level overrides of `resolveRouteBinding()` affect explicit binding too.

---

## Patterns

### Custom Query with Eager Loading
```php
Route::bind('user', function (string $value) {
    return User::with('profile', 'roles')
        ->where('uuid', $value)
        ->firstOrFail();
});
```
Benefits: Eager loads relationships before the controller. Tradeoff: This query runs on every route with `{user}`.

### Tenant-Scoped Resolution
```php
Route::bind('post', function (string $value, $route) {
    $tenantId = $route->parameter('tenant');
    return Post::where('tenant_id', $tenantId)
        ->where('id', $value)
        ->firstOrFail();
});
```
Ensures posts are always scoped to the tenant from the URL. No reliance on global scopes.

### Class@Method Pattern for Testable Binding
```php
Route::bind('user', UserBinding::class . '@find');
```
`UserBinding` can be tested independently of the router. The class is resolved from the container, enabling constructor injection.

### Conditional Resolution Based on Auth
```php
Route::bind('company', function (string $value) {
    if (auth()->user()->isAdmin()) {
        return Company::withTrashed()->findOrFail($value);
    }
    return Company::findOrFail($value);
});
```

---

## Architectural Decisions

### Why Explicit Runs First
Explicit bindings run before implicit because they often establish context that implicit bindings depend on. A common pattern: an explicit binding resolves a `{tenant}` and sets a global scope ID, then implicit binding for `{user}` naturally resolves within that tenant scope. If implicit ran first, it would resolve the user without tenant context.

### Why Route::model() Is Global
`Route::model()` is registered on the router instance, not on specific routes. This means it applies to every route with a matching parameter name, regardless of whether that route intended to use it. This is a deliberate simplicity tradeoff: global application is easier to reason about than per-route registration, but it can cause unexpected behavior when packages or modules register conflicting bindings.

### Why the Model's resolveRouteBinding() Is Called
When `Route::model('user', User::class)` is registered without a custom closure, it calls the model's `resolveRouteBinding()` method — the same method used by implicit binding. This means model-level overrides affect both explicit and implicit binding consistently. The resolution path is unified, not duplicated.

---

## Tradeoffs

### Route::model() vs Route::bind()

| Benefit | Cost | Consequence |
|---------|------|-------------|
| model(): Simple registration, one line | Global scope, no per-route control | Package conflicts if two packages bind the same parameter |
| bind(): Full control, Closure or class | More code, must be scoped to correct group | Fine-grained control prevents unintended side effects |
| model(): Uses model's resolveRouteBinding() | Cannot customize query beyond model's override | Must override model method for query control |
| bind(): Custom query directly in Closure | Query logic lives in RouteServiceProvider, not on model | Can include eager loading, scopes, and complex joins |

### Explicit vs Implicit

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Explicit: Controllable, transparent, testable wrappers | More code, manual registration | Every route parameter must be explicitly bound |
| Implicit: Zero-config, works by convention | No query control from the route layer | Must revert to explicit for any customization |

### Global vs Scoped Explicit Binding

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Global (Route::model()): Apply everywhere automatically | Collisions with package bindings | Debugging "why is this parameter resolving differently?" can take hours |
| Scoped (Route::bind() in group): Only affects intended routes | Must remember to bind in every group | Consistent but verbose |

---

## Performance Considerations

### Explicit Binding Query Overhead
Explicit bindings can include eager loading (`with()`) that implicit binding would not include. This is a performance optimization when the relationships are always needed, but a performance cost if the relationships are conditionally accessed.

### Reflection Avoidance
Explicit binding does NOT use reflection — the binding is a Closure or class method that receives the raw parameter value. This avoids the `Route::signatureParameters()` reflection that implicit binding requires. For routes with multiple bound parameters, explicit binding is marginally faster.

### Global Binder Lookup
`Router::substituteBindings()` iterates `$route->parameters()` keys and checks each key against the `Router::$binders` hash map. The lookup is O(1) per parameter. The iteration cost is negligible.

---

## Production Considerations

### Package Binding Conflicts
When two packages both register `Route::model()` for the same parameter name (e.g., `{user}`), the later registration overwrites the earlier. The first package's binding silently stops working. This is a known pain point in modular applications.

### Binding Scope Isolation
Register explicit bindings inside route groups, not globally in `RouteServiceProvider::boot()`, to limit their scope:
```php
Route::prefix('admin')->group(function () {
    Route::bind('user', fn ($value) => User::adminScoped()->findOrFail($value));
});
```

### Testing Explicit Bindings
Explicit bindings are tested by making requests to routes that use them. Unit testing a binding callback (especially a `Class@method` binder) is straightforward — instantiate the class, call the method with a value, assert the expected model is returned.

---

## Common Mistakes

### Using Route::model() When Custom Keys Are Needed
Why it happens: `Route::model()` is the most visible explicit binding method. Why it's harmful: `Route::model()` calls `resolveRouteBinding()` which respects custom route keys, BUT the custom key is determined by the model's `getRouteKeyName()`, not the route. If different routes need different keys for the same model, `Route::bind()` must be used instead. Better approach: Use `Route::bind()` for per-route key customization.

### Expecting Route::model() to Be Scoped to a Group
Why it happens: Registering `Route::model()` inside a route group Closure. Why it's harmful: `Route::model()` is registered on the global Router instance — the group Closure does not scope it. The binding applies to ALL routes with that parameter name. Better approach: Use `Route::bind()` with the scoping mechanism, or move model registration to a service provider.

### Overriding resolveRouteBinding() Without Calling Parent
Why it happens: Customizing the resolution query. Why it's harmful: The override may not handle `$field = null` correctly, breaking inline key syntax (`{user:slug}`). Better approach: Use the three-parameter `resolveRouteBinding($value, $field)` to accept the field parameter.

### Complex Logic in bind() Closures
Why it happens: The Closure has full access to the container and application state. Why it's harmful: Binding logic (database queries, API calls, cached lookups) in `RouteServiceProvider` is difficult to test and profile. Better approach: Move complex binding logic to a dedicated class used via `Class@method` syntax.

---

## Failure Modes

### Global Binding Collisions
Package A registers `Route::model('user', PackageA\User::class)`. Package B registers `Route::model('user', PackageB\User::class)`. Package A's routes now receive wrong model type. Detection: routes return unexpected model types. Fix: Explicit namespace prefix route parameters or manual `Route::bind()` per group.

### Binding Returns Wrong Type
A `Route::bind()` callback returns an object that doesn't match the controller's type hint. PHP 8+ throws a TypeError when the controller receives an unexpected type. The error message identifies the type mismatch.

### Missing Binding for Known Parameter
A parameter `{token}` is used in routes but no explicit or implicit binding exists. The controller receives the raw string. The error manifests downstream when the controller tries to call methods on a string as if it were a model.

---

## Ecosystem Usage

### Laravel Framework
Laravel's first-party packages generally avoid `Route::model()` due to global scope concerns. They use `Route::bind()` scoped within their route groups. Horizon and Telescope register their own route bindings within prefix groups.

### Spatie Packages
Spatie packages that register routes use explicit binding for parameters that require non-standard resolution. Their providers register bindings within the package's route group, using `Route::bind()` to limit scope.

### Jetstream
Jetstream uses both implicit binding (for Team, User models) and explicit binding where needed. Team member resolution uses model-level `resolveRouteBinding()` overrides for tenant scoping.

---

## Related Knowledge Units

### Prerequisites
- Route Model Binding Implicit — The default binding mechanism that explicit binding overrides
- Custom Route Keys — Inline syntax and model-level key customization

### Related Topics
- Scoped Bindings — Validates parent-child relationship, uses `resolveChildRouteBinding()` on the parent model
- Route Groups — Scoping explicit bindings within route groups
- Service Container Basics — Class@method binder resolution via container

### Advanced Follow-up Topics
- Route Caching — How explicit bindings interact with cached route serialization
- Middleware System — Explicit binding runs before middleware (SubstituteBindings middleware position)

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\Router.php` — `bind()`, `model()`, `substituteBindings()`, `performBinding()` methods
- `Illuminate\Routing\RouteBinding.php` — `forModel()`, `forCallback()`, `createClassBinding()` factories
- `Illuminate\Routing\ImplicitRouteBinding.php` — Implicit pass that runs second
- `Illuminate\Routing\Middleware\SubstituteBindings.php` — Explicit-first ordering
- `Illuminate\Contracts\Routing\UrlRoutable.php` — `resolveRouteBinding()`, `resolveChildRouteBinding()` contracts

### Key Insight
The ordering of SubstituteBindings (explicit → implicit) is the most important architectural detail for understanding how contextual resolution works. An explicit binding that resolves `{organization}` and stores it in the container can be followed by an implicit binding for `{user}` that uses a global scope set by the explicit binding. This "dependency chain" across binding types is an intentional design feature, not an implementation detail.

### Version-Specific Notes
- Explicit binding behavior is unchanged across Laravel 10-13
- `Route::bind()` with `Class@method` syntax works identically across all versions
- Model-level `resolveRouteBindingQuery()` was formalized in Laravel 8 and is stable through Laravel 13
