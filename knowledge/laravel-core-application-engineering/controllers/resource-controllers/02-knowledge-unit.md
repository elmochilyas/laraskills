# Resource Controllers

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Controllers Architecture
- **Knowledge Unit:** Resource Controllers
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-01

---

## Executive Summary

Resource controllers are controllers structured to handle the 7 standard RESTful actions that correspond to `Route::resource()`: `index`, `create`, `store`, `show`, `edit`, `update`, and `destroy`. The controller structure mirrors the route registration — every method maps to a specific HTTP verb + URI combination that `ResourceRegistrar` generates.

The critical architectural insight is that resource routes are pure registration convenience, not runtime magic. When `Route::resource('photos', PhotoController::class)` is called, `ResourceRegistrar` generates 7 individual `Route` objects (5 for `apiResource`, 3 for `singleton`). Each route stores `uses: PhotoController@index`, `uses: PhotoController@store`, etc. — standard string references that are dispatched identically to any other controller route. There is no "resource dispatch" path; the controller methods are called through the same `ControllerDispatcher` as any other route.

The controller must have all methods that the resource routes reference. There is no compile-time check — a missing method causes `BadMethodCallException` at runtime when the route is accessed. This is a common production deployment failure when a resource is registered but the corresponding controller method is not yet implemented.

---

## Core Concepts

### The 7 Standard Methods
Resource controllers implement up to 7 methods, each corresponding to a specific HTTP operation:

| Method | HTTP Verb | URI | Purpose |
|--------|-----------|-----|---------|
| `index()` | GET | `/photos` | List all resources |
| `create()` | GET | `/photos/create` | Show creation form |
| `store(Request)` | POST | `/photos` | Persist new resource |
| `show($id)` | GET | `/photos/{photo}` | Display single resource |
| `edit($id)` | GET | `/photos/{photo}/edit` | Show edit form |
| `update(Request, $id)` | PUT/PATCH | `/photos/{photo}` | Update existing resource |
| `destroy($id)` | DELETE | `/photos/{photo}` | Delete resource |

The framework does not enforce exact method signatures. The `$id` parameter receives the route parameter value (which, with route model binding, becomes the resolved model instance).

### apiResource Method Set
`apiResource()` generates 5 routes (excludes `create` and `edit`):
- `index`, `store`, `show`, `update`, `destroy`

The `create` and `edit` routes serve HTML forms, which have no meaning in JSON API contexts. Using `apiResource()` for API endpoints registers only the routes that return data.

### Singleton Resource Methods
`Route::singleton()` generates 3 default methods (no `{id}` parameter):
- `show()`, `edit()`, `update()`

With `->creatable()` adds: `create()`, `store()`, `destroy()`

The methods receive no identifier parameter because there is only one resource — the controller must resolve it from context (typically the authenticated user).

### Partial Resource Methods
`->only(['index', 'show'])` limits the generated routes. The controller should only implement the selected methods. Unselected methods are never called (no route references them). Partial resources are common for entities that should be read-only through the API.

---

## Mental Models

### Resource Controller as RESTful Contract
The 7 methods form a contract with the routing system: for any RESTful resource, the controller provides these 7 operations. `Route::resource()` binds the route side of the contract; the controller class binds the implementation side. Deviating from the 7 methods signals either a missing method (error) or a non-CRUD operation (should use explicit routes).

### No Special Dispatch Path
Resource controllers are not dispatched differently from any other controller. The route stores `Class@method` strings. `ControllerDispatcher::dispatch()` calls the method by name. There is no "resource dispatch" or magic routing — only standard controller dispatch.

### Registration-Time Code Generation
`ResourceRegistrar` is a code generator that runs at route registration time. It produces 7 individual `Route` objects. After registration, the resource declaration has no further effect — the routes are independent objects in the `RouteCollection`.

---

## Internal Mechanics

### ResourceRegistrar Route Generation

```php
ResourceRegistrar::register($name, $controller, $options)
  ├── $base = $this->getResourcePrefix($name)  // Handle nested names
  ├── $wildcard = $this->getResourceWildcard($lastName)  // Singular form
  │
  ├── $this->addResourceIndex($name, $base, $controller, $options)
  │     → GET $base → controller@index → name: $name.index
  ├── $this->addResourceCreate($name, $base, $controller, $options)
  │     → GET $base/create → controller@create → name: $name.create
  ├── $this->addResourceStore($name, $base, $controller, $options)
  │     → POST $base → controller@store → name: $name.store
  ├── $this->addResourceShow($name, $base, $controller, $options)
  │     → GET $base/{wildcard} → controller@show → name: $name.show
  ├── $this->addResourceEdit($name, $base, $controller, $options)
  │     → GET $base/{wildcard}/edit → controller@edit → name: $name.edit
  ├── $this->addResourceUpdate($name, $base, $controller, $options)
  │     → [PUT, PATCH] $base/{wildcard} → controller@update → name: $name.update
  └── $this->addResourceDestroy($name, $base, $controller, $options)
      → DELETE $base/{wildcard} → controller@destroy → name: $name.destroy
```

Each `addResource*` method calls `getResourceAction()` to build the action array:
```php
$action = ['as' => $name, 'uses' => $controller.'@'.$method];
// Additional: middleware, excluded_middleware, wheres, missing
```

### Route Method String Construction
The controller reference is built as a simple string concatenation:
```php
$controller . '@' . $method  // e.g., 'PhotoController@index'
```

This string is stored in the route's `action['uses']` and `action['controller']` keys. No special handling — it is parsed by `RouteAction::parse()` at dispatch time just like any other route.

### PendingResourceRegistration

`Route::resource()` returns a `PendingResourceRegistration` that auto-registers on `__destruct()`:
```php
PendingResourceRegistration
  ├── Stores registrar, resource name, controller, options
  ├── Fluent methods: only(), except(), names(), parameters(), middleware(), scoped()
  ├── __destruct() → $this->registrar->register($this->name, $this->controller, $this->options)
  └── registered flag prevents double-registration on explicit register() call
```

This deferred pattern enables fluent chaining without a terminal method call.

### No Runtime Dispatch Specialization
The dispatch path for a resource method is:
```
Route::run() → runController() → getController() → 
ControllerDispatcher::dispatch(route, controller, 'store') → 
$controller->store(...$resolvedParameters)
```

This is identical to the dispatch path for any explicit route. There is no resource-specific dispatch logic anywhere in the framework.

---

## Patterns

### Full Resource Pattern
```php
class PostController extends Controller
{
    public function index() { /* list posts */ }
    public function create() { /* show create form */ }
    public function store(Request $request) { /* persist */ }
    public function show(Post $post) { /* single post */ }
    public function edit(Post $post) { /* show edit form */ }
    public function update(Request $request, Post $post) { /* update */ }
    public function destroy(Post $post) { /* delete */ }
}
```
Mapped via `Route::resource('posts', PostController::class)`. Full CRUD lifecycle.

### Read-Only Resource Pattern
```php
class ProductController extends Controller
{
    public function index() { /* list products */ }
    public function show(Product $product) { /* single product */ }
}
```
Mapped via `Route::apiResource('products', ProductController::class)->only(['index', 'show'])`. Resources that should be publicly visible but not modifiable.

### Singleton with Creations
```php
class ProfileController extends Controller
{
    public function show() { /* display profile */ }
    public function edit() { /* show edit form */ }
    public function update(Request $request) { /* update profile */ }
    public function create() { /* show create form */ }
    public function store(Request $request) { /* create profile */ }
    public function destroy() { /* delete profile */ }
}
```
Mapped via `Route::singleton('profile', ProfileController::class)->creatable()`. One resource per user.

---

## Architectural Decisions

### Why Dispatch Is Not Specialized
Resource routes generate standard `Route` objects with standard `Class@method` action strings. No specialization means:
- One dispatch path to test and debug
- All middleware features work identically
- Route caching serializes standard action strings
- Resource and non-resource routes are interchangeable

### Why No Compile-Time Method Verification
Missing resource methods throw `BadMethodCallException` at runtime rather than being caught at registration time because:
- PHP cannot check method existence at route registration time for string references
- The controller may be resolved from the container with dynamic method resolution
- Checking at compile time would require loading every controller class during route registration

### Why Deferred Registration Exists
`PendingResourceRegistration` uses `__destruct()` to allow fluent chaining (`->only()->middleware()->names()`). If routes were registered immediately on `Route::resource()` call, the fluent methods would have no effect. The destructor pattern ensures all configuration is applied before registration.

---

## Tradeoffs

### Resource vs Explicit Routes

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Resource: 1 line registers 7 routes | Hidden routes: can't see individual registrations | Developer must know the 7-method convention |
| Resource: Consistent naming (`photos.index`) | Method mismatch: missing method = runtime error | No compile-time detection of incomplete controllers |
| Explicit: Each route visible in the file | 7 lines of boilerplate per resource | Verbose but self-documenting |
| Explicit: Full control over each route | Inconsistent if different developers name differently | No automatic naming convention |

### Full Resource vs Partial Resource

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Full: All 7 actions available from the start | Many methods may go unused | Controller has code paths that are never hit |
| Partial: Only needed actions exposed | Must add methods if requirements expand | Controller needs structural changes as the API grows |

### Resource vs apiResource

| Benefit | Cost | Consequence |
|---------|------|-------------|
| resource: Works for HTML + API apps | create/edit have no meaning for JSON APIs | Routes that always return 404 or are never used |
| apiResource: Clean for API-only | Not suitable for HTML applications | Must switch to `resource()` if form views are added |

---

## Performance Considerations

Resource controllers have no performance impact beyond the routes they generate. Registration cost is proportional to route count (7 routes per resource). Dispatch cost is identical to any other controller. The only performance consideration is unused resource methods: `Route::resource('posts', ...)` with `->only(['index', 'show'])` generates 2 routes instead of 7, reducing registration time proportionally.

---

## Production Considerations

### Missing Method Detection
Before deploying with resource routes, verify all referenced controller methods exist. A missing method causes `BadMethodCallException` at runtime. Run:
```bash
php artisan route:list
```
Verify each listed endpoint has a matching controller method.

### Method Signature Stability
Changing a resource method's signature (adding/removing parameters) after deployment breaks existing requests. Unlike route URIs which are explicitly defined, method signatures are implicit — a deployment that changes a method's parameters without updating all callers causes runtime errors.

### Custom Method Addition
Adding non-resource methods to a resource controller is acceptable but those methods are NOT accessible via the resource routes. They must be registered via explicit routes:
```php
Route::resource('users', UserController::class);
Route::post('users/{user}/restore', [UserController::class, 'restore'])->name('users.restore');
```

---

## Common Mistakes

### Missing Resource Methods
Why it happens: Developer registers a route with `Route::resource()` but doesn't implement all 7 methods. Why it's harmful: Accessing the missing method's route throws `BadMethodCallException` at runtime. Better approach: Use `->only()` to declare which methods exist, then implement only those.

### Using Route::resource() for APIs
Why it happens: `resource()` is the most visible method. Why it's harmful: Registers `create` and `edit` form-serving routes that return errors in API contexts. Better approach: `Route::apiResource()` for all JSON API endpoints.

### Incomplete Method Signatures
Why it happens: Developer writes `public function store()` without the `Request` parameter but the route sends one. Why it's harmful: PHP 8+ throws TypeError on parameter mismatch. Better approach: Always include `Request` parameter for POST/PUT routes and model binding parameters for show/edit/update/destroy.

### Assuming Method Order Matters
Why it happens: Routes within a resource are registered in a specific order (index → create → store → show → edit → update → destroy). Why it's harmful: The order ensures `create` matches before `{id}`. The `ResourceRegistrar` handles this correctly, but developers who manually register similar patterns may get the order wrong. Better approach: Always use `Route::resource()` for standard CRUD patterns.

---

## Failure Modes

### BadMethodCallException — Method Not Found
The most common resource controller failure. A route is registered for `controller@index` but the controller doesn't have `index()`. `Controller::__call()` throws. Occurrence: at runtime when the route is accessed. Detection: only through route smoke tests.

### TypeError — Method Signature Mismatch
The route sends a parameter that doesn't match the method's type hint. For example, `Route::resource('posts', ...)` registers `show($id)`, but the controller has `show(Post $post)` without implicit binding — the `$id` string is sent instead of a model. Fix: enable route model binding or match the parameter type.

### Missing Singleton Resolution
Singleton controllers have no route parameter for the resource. If the controller's `show()` method tries to resolve the model from a non-existent `{id}` parameter, it receives null. Fix: Resolve the singleton from context (e.g., `$request->user()->profile`).

---

## Ecosystem Usage

### Laravel Framework
Jetstream uses resource controllers for team management. Breeze uses resource controllers for user management. Cashier uses explicit routes for subscription management (not resource routes). Horizon and Telescope use explicit routes.

### Spatie Packages
Spatie packages rarely use `Route::resource()`. They prefer explicit route definitions for clarity. The `spatie/laravel-permission` package registers CRUD-like routes explicitly for role and permission management.

### Monica CRM
Monica uses resource controllers for contacts, activities, and journal entries. Controllers implement the standard 7 methods and supplement with explicit custom methods for non-CRUD actions (upload avatar, archive contact, log call).

### Akaunting
Akaunting explicitly defines each route per module. It does not use `Route::resource()` in production — all routes are individually declared with explicit controller method references. This is a deliberate choice for clarity in a modular architecture.

---

## Related Knowledge Units

### Prerequisites
- Controller Architecture — How controllers are dispatched
- Route Definition — Route registration to controller mapping
- Resourceful Routing — Route side of the resource convention

### Related Topics
- Single-Action Controllers — When __invoke() replaces multi-action
- Route Model Binding — Automatic model resolution for show/edit/update/destroy
- Thin Controller Principles — Keeping resource methods focused

### Advanced Follow-up Topics
- Controller Organization — Where resource controllers live in the directory structure
- Controller Testing — Testing resource controller methods
- Route Caching — How resource routes are serialized

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\ResourceRegistrar.php` — `register()`, 7 `addResource*` methods, `getResourceAction()`, `getResourcePrefix()`, `getResourceWildcard()`
- `Illuminate\Routing\PendingResourceRegistration.php` — Deferred `__destruct()` registration pattern
- `Illuminate\Routing\Router.php` — `resource()`, `apiResource()`, `singleton()` methods
- `Illuminate\Routing\ControllerDispatcher.php` — Standard dispatch (no resource-specific logic)

### Key Insight
The most important architectural fact about resource controllers is that they are handled identically to all other controllers. There is no "resource dispatch" path, no special middleware handling, no unique lifecycle. The `ResourceRegistrar` generates standard routes with standard action strings. This means any middleware feature, any injection pattern, and any response type that works for explicit routes works identically for resource routes.

### Version-Specific Notes
- Resource controller behavior is consistent across Laravel 10-13
- `apiResource()` is available in all versions
- Singleton routes (with `singleton()` method) added in Laravel 9.42
- The `scoped()` method on resources was refined in Laravel 11 for automatic binding field inference
