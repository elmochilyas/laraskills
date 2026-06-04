| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | API Resource Controllers |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Resource Controller Pattern, Route Registration Basics |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

API resource controllers strip away the two view-related methods — `create` and `edit` — that exist in the full resource controller pattern. Laravel provides `Route::apiResource()` as a dedicated method that registers only the five JSON-appropriate actions: `index`, `store`, `show`, `update`, and `destroy`. This eliminates unused form routes in API-only applications and signals that the controller serves a JSON API.

## Core Concepts

- **Five Methods**: `index`, `store`, `show`, `update`, `destroy` — the two view methods (`create`, `edit`) are excluded.
- **Route::apiResource()**: Wrapper around `Route::resource()` that passes `['only' => ['index', 'store', 'show', 'update', 'destroy']]`.
- **Bulk Registration**: `Route::apiResources([...])` registers multiple API resource controllers in one call.
- **Stateless Assumption**: API controllers assume token-based authentication (Sanctum, Passport), not session-based auth.
- **JSON Responses**: All five methods return JSON, Eloquent resources, or collections — never views.

## When To Use

- Any API-only application (no server-rendered HTML).
- First-party SPA backends (Vue, React, Livewire).
- Third-party JSON API endpoints.
- All routes registered in `routes/api.php`.

## When NOT To Use

- Hybrid applications that serve both API and server-rendered HTML (use `Route::resource()` for web routes).
- When `create` or `edit` endpoints are needed (e.g., returning JSON schemas for form generation).

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Use `Route::apiResource()` in `api.php`, never `Route::resource()` | Prevents registering unused view routes |
| Return `response()->noContent()` for destroy | REST convention: DELETE should return 204 No Content |
| Always use Eloquent API resources or `response()->json()` | Never return views or `view()` from API controllers |
| Return 201 with the created resource on store | Clients need the resource ID for immediate use |
| Combine with route model binding scoping for nested resources | Ensures parent-child relationship is validated |

## Architecture Guidelines

- Default to `Route::apiResource()` for all `api.php` routes.
- Register response macros (`Response::macro('success', ...)`) to standardize API response envelopes.
- All five methods should be present in the controller, even if some are restricted (use `only()` on the route).
- Ensure `App\Exceptions\Handler` renders JSON for API routes, especially for validation errors.
- Use `php artisan make:controller PhotoController --api --resource` to generate the skeleton.

## Performance Considerations

- `apiResource` and `resource()->only(...)` have identical runtime performance; `apiResource` is syntactic sugar.
- Route caching works identically for both; 5 routes vs 7 saves negligible entries.

## Security Considerations

- Fewer routes mean reduced attack surface; `create` and `edit` endpoints that return HTML are eliminated.
- API controllers must validate `Accept: application/json` header to prevent HTML error page responses.
- Never return model instances directly; always wrap in API resources to control exposed attributes.
- Use form requests for validation — never `$request->all()` or `$request->input()`.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `Route::resource()` in `api.php` | Copy-pasting from web route files | Registers unused create/edit routes | Always use `Route::apiResource()` |
| Forgetting `noContent()` for destroy | Default return is the model instance | Inconsistent with REST conventions | `return response()->noContent();` |
| Returning views from API controllers | Developer trained on web controllers | Returns HTML to JSON clients | Use `return new PhotoResource($photo)` |

## Anti-Patterns

- **Using `Route::resource()` in API-only projects**: Registers dead routes that bloat the route table.
- **Returning Eloquent models directly**: Exposes all attributes, including sensitive fields.
- **Forgetting 201 status on store**: Default 200 doesn't distinguish "created" from "fetched".
- **Using inline validation instead of form requests**: Mixes validation logic into action methods.

## Examples

- **Registration**: `Route::apiResource('photos', PhotoController::class);`
- **Bulk registration**: `Route::apiResources(['photos' => PhotoController::class, 'users' => UserController::class]);`
- **Controller skeleton**: `index()` → `PhotoResource::collection(...)`, `store()` → `new PhotoResource(...)` + 201, `show()` → `new PhotoResource(...)`, `update()` → `new PhotoResource(...)`, `destroy()` → `response()->noContent()`.

## Related Topics

- Resource Controller Pattern — The seven-method base pattern
- Controller Response Selection — Status codes and response construction
- Controller Form Request Integration — Validation via form requests

## AI Agent Notes

- Always use `Route::apiResource()` when generating API controllers for `api.php`.
- Generate the controller with `--api --resource` flags to get the correct skeleton.
- Ensure the destroy method uses `response()->noContent()`.
- Always wrap responses in API resources, not raw models.

## Verification

- [ ] Route registered with `Route::apiResource()` (not `Route::resource()`) in `api.php`
- [ ] Only five methods exist — no `create` or `edit`
- [ ] Destroy returns `response()->noContent()` (204)
- [ ] Store returns the created resource with 201 status
- [ ] All methods return JSON (not views)
- [ ] `php artisan route:list` shows exactly 5 routes per resource
