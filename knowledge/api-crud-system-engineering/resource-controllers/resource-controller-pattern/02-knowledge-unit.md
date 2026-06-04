# Resource Controller Pattern

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Resource Controller Pattern
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel resource controllers provide a convention-driven approach to mapping HTTP verbs and URLs to controller actions. A single resource controller defines seven default methods—`index`, `create`, `store`, `show`, `edit`, `update`, and `destroy`—that correspond to the standard CRUD operations. This pattern eliminates routing boilerplate by using `Route::resource()` to register all routes with a single declaration.

The pattern enforces RESTful naming conventions and consistent method signatures across an application. By standardizing the controller interface, teams can reason about any resource endpoint without reading route files, relying instead on the predictable method-to-action mapping. This predictability is the foundation upon which all other controller patterns are built.

---

## Core Concepts

- **Seven Default Methods**: Every resource controller exposes `index`, `create`, `store`, `show`, `edit`, `update`, and `destroy`. Each maps to a specific HTTP verb and URI pattern.
- **Route::resource()**: A single static call registers all seven routes. The route names are automatically derived: `resource.index`, `resource.create`, `resource.store`, etc.
- **Route Model Binding**: Laravel automatically resolves Eloquent models from route parameters and injects them into controller methods like `show`, `update`, and `destroy`.
- **HTTP Verb Mapping**: `GET` → `index`/`create`/`show`/`edit`, `POST` → `store`, `PUT/PATCH` → `update`, `DELETE` → `destroy`.
- **Arbitrary Method Order**: The controller methods can appear in any order; the routing layer is entirely separate from the class definition.

---

## Mental Models

- **Convention Over Configuration**: Name the method according to the action, and Laravel wires the route. No route file edits needed for standard CRUD.
- **Resource as Noun**: Treat the resource as a noun in the domain. The controller methods are the verbs applied to that noun—list, create, read, update, delete.
- **REST Channel**: Think of the seven methods as channels on a REST radio. `Route::resource()` tunes the receiver; the controller implements the channels.

---

## Internal Mechanics

When `Route::resource('photos', PhotoController::class)` is registered, the `Registrar` class in `Illuminate\Routing\ResourceRegistrar` iterates over the default resource map. Each entry in the map defines the URI, HTTP method, action name, and route name. The registrar calls `Route::match()` for each entry, binding the controller method.

The resource map is defined in `ResourceRegistrar::$resourceDefaults`:

```php
protected $resourceDefaults = ['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'];
```

Each default has a corresponding `addResource*` method, e.g. `addResourceIndex()`, which registers the route. The URI pattern uses `{resource}` as the wildcard parameter, derived from the resource name.

**Key source files:**
- `Illuminate\Routing\ResourceRegistrar` — registers all resource routes
- `Illuminate\Routing\PendingResourceRegistration` — fluent wrapper returned by `Route::resource()`
- `Illuminate\Routing\Router` — `resource()` and `apiResource()` entry points

---

## Patterns

- **Standard Restful Controller**: A controller with all seven methods following Laravel's naming convention.
  ```php
  class PhotoController extends Controller
  {
      public function index() { /* list */ }
      public function create() { /* show create form */ }
      public function store(Request $request) { /* persist */ }
      public function show(Photo $photo) { /* single item */ }
      public function edit(Photo $photo) { /* show edit form */ }
      public function update(Request $request, Photo $photo) { /* update */ }
      public function destroy(Photo $photo) { /* delete */ }
  }
  ```
- **Implicit Route Model Binding**: Type-hint the model and the route parameter name matches the model variable.
  ```php
  public function show(Photo $photo) { return $photo; }
  ```
- **Custom Resource Names**: Pass a third argument to rename route parameters.
  ```php
  Route::resource('photos', PhotoController::class, ['parameters' => ['photos' => 'photo_id']]);
  ```

---

## Architectural Decisions

- **Why seven methods?** This set covers the full CRUD lifecycle plus the two view actions (`create`, `edit`) needed for server-rendered HTML applications. For APIs, `apiResource` drops the view methods.
- **Why `Route::resource()` over manual routes?** Eliminates human error from route registration, ensures naming consistency, and makes the route list self-documenting.
- **Why route model binding by default?** Reduces controller boilerplate by eliminating manual `findOrFail` calls and standardizes how resources are resolved.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Predictable route structure | Rigid seven-method contract | Custom actions require additional routes beyond the resource |
| Single-line route registration | Reduced visibility of individual routes | Developers may not know which routes are registered without `php artisan route:list` |
| Automatic naming conventions | Name collisions if multiple resources share names | Must use `names()` or `as()` to differentiate |

---

## Performance Considerations

- Resource registration is a compile-time concern; there is no runtime overhead from using `Route::resource()` versus manual routes.
- Route caching (`php artisan route:cache`) serializes all registered routes, including resource routes, into a single file. This completely eliminates route registration overhead in production.
- The number of routes (7 per resource) has negligible impact on route matching performance; Laravel uses a compressed radix tree router.

---

## Production Considerations

- Always use `php artisan route:cache` in deployment scripts to optimize route registration.
- Audit routes with `php artisan route:list` after adding new resource controllers to confirm the expected URI structure.
- Avoid adding non-resource methods to a resource controller; create a separate controller for custom actions to preserve the single-responsibility pattern.
- Use route naming conflicts detection in CI: `php artisan route:list --json | php artisan route:check-names` (custom script).

---

## Common Mistakes

- **Forgetting trailing route model binding**: Using `Route::resource('photos', ...)` but parameter name mismatch in `show(Photo $photo)` — works because binding uses `{photo}`, not `{photos}`.
  - *Why it happens:* The singular parameter name is automatically derived from the resource name.
  - *Why it's harmful:* Confusion when reading controller signatures.
  - *Better approach:* Learn the singularization rule: `Route::resource('photos', ...)` binds `{photo}`.

- **Defining methods not in the seven defaults**: Adding `public function search()` inside a resource controller, expecting it to be auto-routed.
  - *Why it happens:* Assuming all public methods become routes.
  - *Why it's harmful:* Silent dead code; the method never executes.
  - *Better approach:* Use `Route::get('/photos/search', ...)` manually, or use a separate controller.

- **Modifying resource route URIs manually**: Trying to change URI structures inside the controller rather than in route registration.
  - *Why it happens:* Unfamiliarity with route parameter customization.
  - *Why it's harmful:* Couples controller logic to routing concerns.
  - *Better approach:* Use `Route::resource()` parameters option to customize.

---

## Failure Modes

- **Route naming collision**: If two resource controllers share a prefix, route names like `index` collide. *Detection:* `route('photos.index')` returns the wrong URL. *Mitigation:* Use `Route::resource('admin.photos', ...)` with dot-prefix or `->names('admin.photos')`.

- **Missing route model binding**: The `show` method receives an ID string instead of a model. *Detection:* Method signature `show($id)` instead of `show(Photo $photo)`. *Mitigation:* Enforce type-hinting in controller method signatures via code review or PHPStan rules.

- **Unused routes registered**: Deploying a resource controller that only needs `index` and `show` registers all 7 routes unnecessarily. *Detection:* `php artisan route:list` shows `create`, `edit` etc. *Mitigation:* Use `apiResource()` or `Route::resource()->only(['index', 'show'])`.

---

## Ecosystem Usage

- **Laravel Breeze**: Uses resource controllers in its default CRUD scaffold for teams.
- **Laravel Nova**: Internally registers resource controllers for each Nova resource to provide CRUD API endpoints.
- **Laravel Forge API**: Forge's REST API is organized around resource controllers for server, site, and database management.

---

## Related Knowledge Units

### Prerequisites
- Route Registration Basics
- Controller Fundamentals

### Related Topics
- API Resource Controllers
- Partial Resource Routes
- Nested Resources & Shallow Nesting

### Advanced Follow-up Topics
- Singleton Resource Controllers
- Controller Action Delegation
- Thin Controller Enforcement

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\ResourceRegistrar` — core registration logic
- `Illuminate\Routing\PendingResourceRegistration` — fluent resource builder

### Key Insight
The resource controller pattern is a REST convention binding, not a framework constraint. Every method is optional; the pattern describes what *should* exist, not what *must* exist.

### Version-Specific Notes
- Laravel 8+ added `Route::apiResource()` as a first-class method.
- Laravel 9+ introduced `Route::singleton()` for singleton resources.
- Laravel 10+ kept the same resource API with improved singularization logic for non-English locale routes.
