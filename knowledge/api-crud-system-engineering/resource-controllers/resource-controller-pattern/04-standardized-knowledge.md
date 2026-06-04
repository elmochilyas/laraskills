| Section | Field | Content |
|---|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Resource Controller Pattern |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Route Registration Basics, Controller Fundamentals |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Laravel resource controllers provide a convention-driven mapping of HTTP verbs and URLs to seven default controller actions (`index`, `create`, `store`, `show`, `edit`, `update`, `destroy`). A single `Route::resource()` call registers all routes, eliminating boilerplate and enforcing RESTful naming. The pattern standardizes the controller interface so every resource endpoint is predictable without reading route files.

## Core Concepts

- **Seven Default Methods**: `index`, `create`, `store`, `show`, `edit`, `update`, `destroy` — each maps to a specific HTTP verb and URI pattern.
- **Route::resource()**: One static call registers all seven routes; route names are auto-derived (e.g., `photos.index`, `photos.store`).
- **Route Model Binding**: Laravel auto-resolves Eloquent models from route parameters and injects them into `show`, `update`, `destroy`.
- **HTTP Verb Mapping**: `GET` → `index`/`create`/`show`/`edit`, `POST` → `store`, `PUT/PATCH` → `update`, `DELETE` → `destroy`.
- **Registrar-Driven**: `Illuminate\Routing\ResourceRegistrar` iterates a `$resourceDefaults` array and calls `addResource*` methods for each route.

## When To Use

- Standard CRUD operations on a domain resource (users, photos, posts, comments).
- Any endpoint set that maps cleanly to list/create/read/update/delete.
- New API endpoints — start with resource controller by default.
- Team projects where route naming consistency matters across developers.

## When NOT To Use

- Single-action endpoints (search, restore, dashboard) — use invokable controllers instead.
- Read-only resources that only need `index` and `show` — use `Route::apiResource()->only(['index', 'show'])`.
- Non-CRUD functionality (auth, webhooks, file uploads) — use dedicated controllers.
- Prototypes where maximum flexibility is needed — manual routes may be simpler.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always use `Route::resource()` over manual route registration | Eliminates human error, ensures naming consistency, self-documenting route list |
| Keep controller methods in resource order (index → create → store → show → edit → update → destroy) | Predictable file navigation for all team members |
| Use `Route::apiResource()` for APIs to drop `create`/`edit` views | Avoids registering routes that return HTML for JSON-only endpoints |
| Do NOT add non-resource methods to resource controllers | Preserves single-responsibility; custom actions go in separate invokable controllers |
| Use `php artisan route:list` to verify registered routes after adding resource controllers | Catches naming collisions and unexpected URI structures |

## Architecture Guidelines

- One resource controller per domain resource (not one per database table).
- Resource controllers belong in `App\Http\Controllers\Api\{Version}\ResourceNameController`.
- Controller methods should be thin — delegate to form requests, action classes, and API resources.
- Use custom form request classes for store/update validation (never validate inline in the controller).
- Use route model binding in method signatures (type-hint the model, not the ID).
- Avoid adding constructor logic beyond dependency injection setup.

## Performance Considerations

- `Route::resource()` registration is compile-time — no runtime overhead vs manual routes.
- Route caching (`php artisan route:cache`) serializes all resource routes; use in production deployments.
- Seven routes per resource have negligible impact on the radix-tree router, even at 500+ routes.
- Route model binding adds one Eloquent query per bound model — ensure foreign keys are indexed.

## Security Considerations

- Route model binding exposes the model-fetch behavior — ensure models use scoped bindings in nested contexts.
- Never rely on route exclusion alone for security; always pair with authorization policies.
- Form request `authorize()` methods gate controller execution before validation runs.
- Shallow nested routes require explicit parent-child ownership verification.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Defining methods outside the seven defaults expecting auto-routing | Assuming all public methods become routes | Silent dead code — the method never executes | Register custom routes manually or use separate invokable controllers |
| Forgetting singular parameter name in route model binding | Unfamiliarity with Laravel's singularization | `Route::resource('photos')` binds `{photo}`, not `{photos}` | Learn the convention: resource name is plural, parameter is singular |
| Modifying URI structures inside the controller | Unfamiliarity with route parameter customization | Couples controller logic to routing concerns | Use `Route::resource()` parameters option in route files |
| Deploying resource with unused `create`/`edit` routes in API | Using `Route::resource()` instead of `Route::apiResource()` | Registers 2 unnecessary HTML-view routes | Use `Route::apiResource()` for JSON-only endpoints |

## Anti-Patterns

- **Resource controller with 15+ methods**: Adding `search`, `restore`, `archive`, `bulkStore` to a resource controller. Breaks SRP and the predictable seven-method contract.
- **Empty resource controller**: Creating a resource controller with all seven methods auto-generated but only implementing 2. The other 5 are dead code that confuses maintainers.
- **Resource controller as a CRUD wrapper**: Controller that directly calls `Model::all()`, `Model::create()`, etc. without delegation. Works for simple cases but doesn't scale.
- **Mixing web and API concerns**: Same resource controller returning both views and JSON based on request inspection. Use separate controllers for web and API.

## Examples

- **Full resource controller**: `class PhotoController extends Controller { public function index() { ... } public function create() { ... } public function store(Request $request) { ... } public function show(Photo $photo) { ... } public function edit(Photo $photo) { ... } public function update(Request $request, Photo $photo) { ... } public function destroy(Photo $photo) { ... } }`
- **Route registration**: `Route::resource('photos', PhotoController::class);`
- **API resource registration**: `Route::apiResource('photos', PhotoController::class);`
- **Custom parameter names**: `Route::resource('photos', PhotoController::class, ['parameters' => ['photos' => 'photo_id']]);`

## Related Topics

- API Resource Controllers — Stripped-down resource controllers for JSON APIs
- Partial Resource Routes — Whitelisting/blacklisting specific actions
- Nested Resources & Shallow Nesting — Parent-child resource routing
- Singleton Resource Controllers — One-to-one resource routing without ID parameters
- Controller Action Delegation — Keeping resource controller methods thin

## AI Agent Notes

- Generate resource controllers with `Route::apiResource()` as the default for API contexts.
- Always type-hint models in `show`, `update`, and `destroy` for route model binding.
- Never add non-resource methods to a resource controller — create separate invokable controllers.
- Use form request classes for `store` and `update` validation.
- Prefer `only()` over `except()` when restricting resource actions.

## Verification

- [ ] `Route::resource()` or `Route::apiResource()` used instead of manual route registration
- [ ] Controller methods appear in the standard order (index → create → store → show → edit → update → destroy)
- [ ] Non-resource methods are NOT present in resource controller classes
- [ ] Route model binding used in `show`, `update`, `destroy` signatures
- [ ] `Route::apiResource()` used for JSON-only endpoints (not `Route::resource()`)
- [ ] `php artisan route:list` confirms expected URI structure
