# API Resource Controllers

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** API Resource Controllers
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

API resource controllers strip away the two view-related methods—`create` and `edit`—that exist in the full resource controller pattern. Laravel provides `Route::apiResource()` as a dedicated method that registers only the five JSON-appropriate actions: `index`, `store`, `show`, `update`, and `destroy`. This eliminates the dead weight of unused form routes in API-only applications.

The pattern signals to developers that the controller serves a JSON API, not an HTML application. It also reduces the attack surface by not exposing form-viewing endpoints that serve no purpose in a headless API context. For teams building first-party SPAs or third-party JSON APIs, `apiResource` is the default choice.

---

## Core Concepts

- **Five Methods, Not Seven**: `index`, `store`, `show`, `update`, `destroy`. No `create`, no `edit`.
- **Route::apiResource()**: Analogous to `Route::resource()` but registers only the API subset.
- **apiResource Array Registration**: `Route::apiResources([...])` registers multiple API resource controllers in one call.
- **Consistent JSON Responses**: API resource controllers typically return JSON, Eloquent resources, or collections rather than views.
- **No Session/Auth State Assumptions**: API controllers assume stateless authentication (tokens, Sanctum, Passport), not session-based auth.

---

## Mental Models

- **API-First Lens**: If there is no form, there are no `create` or `edit` methods. The controller represents a pure data gateway.
- **Resource as Data Transfer**: The controller methods map directly to REST API endpoints: `GET /resource`, `POST /resource`, `GET /resource/{id}`, `PUT/PATCH /resource/{id}`, `DELETE /resource/{id}`.

---

## Internal Mechanics

`Route::apiResource()` delegates to the same `ResourceRegistrar` as `Route::resource()` but passes `['only' => ['index', 'store', 'show', 'update', 'destroy']]` internally. The source is in `Illuminate\Routing\Router`:

```php
public function apiResource($name, $controller, array $options = [])
{
    return $this->resource($name, $controller, $options + ['only' => ['index', 'store', 'show', 'update', 'destroy']]);
}
```

The `apiResources()` method (plural) iterates over an associative array of name → controller pairs, calling `apiResource()` for each.

Verb-to-URI for API resource controllers:

| Verb | URI | Action | Route Name |
|------|-----|--------|------------|
| GET | `/photos` | index | photos.index |
| POST | `/photos` | store | photos.store |
| GET | `/photos/{photo}` | show | photos.show |
| PUT/PATCH | `/photos/{photo}` | update | photos.update |
| DELETE | `/photos/{photo}` | destroy | photos.destroy |

---

## Patterns

- **API Resource Controller Skeleton**:
  ```php
  class PhotoController extends Controller
  {
      public function index() { return PhotoResource::collection(Photo::all()); }
      public function store(StorePhotoRequest $request) { /* return new PhotoResource(...) */ }
      public function show(Photo $photo) { return new PhotoResource($photo); }
      public function update(UpdatePhotoRequest $request, Photo $photo) { /* return updated PhotoResource */ }
      public function destroy(Photo $photo) { $photo->delete(); return response()->noContent(); }
  }
  ```
- **Bulk Registration**:
  ```php
  Route::apiResources([
      'photos' => PhotoController::class,
      'users' => UserController::class,
  ]);
  ```
- **Only + Except Combination**: Even with `apiResource`, you can further restrict:
  ```php
  Route::apiResource('photos', PhotoController::class)->only(['index', 'show']);
  ```

---

## Architectural Decisions

- **Why a separate `apiResource()` method instead of just using `Route::resource()->except(['create', 'edit'])`?** Convenience and intent-signaling. `apiResource()` makes the API-only purpose explicit and eliminates the need for every developer to remember to exclude the view routes.
- **Why keep `update` as PUT *and* PATCH?** Laravel registers the `update` method for both verbs, accommodating both full replacement (PUT) and partial modification (PATCH) conventions without forcing the developer to choose.
- **Why plural `apiResources()` exists?** API projects often register 10+ resources. A single-call pattern reduces visual noise in `api.php`.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Intent-signaling method name | Slight API surface increase (two methods instead of one) | Team must know `apiResource` vs `resource` distinction |
| Eliminates dead view routes | None for APIs; would be wrong for hybrid apps | Inapplicable for projects mixing API + server-rendered HTML |
| Bulk registration reduces boilerplate | Less visible route mapping | Developers run `route:list` more frequently |

---

## Performance Considerations

- Identical runtime performance to `Route::resource()->only(...)` — the `only` filtering happens at registration time.
- Route caching compresses both `apiResource` and `resource` identically.
- Five routes vs seven saves approximately 2 route entries per resource; negligible even at 100+ resources.

---

## Production Considerations

- Use `apiResource` by default for all `api.php` routes. Reserve `resource` for `web.php` only.
- Combine with route model binding scoping for nested resources.
- Ensure all five methods return JSON. Use `response()->json()`, Eloquent API resources, or `Response::json()` — never return views or `view()`.
- Register response macros (`Response::macro('success', ...)`) to standardize API response envelopes across all API controller actions.

---

## Common Mistakes

- **Using `Route::resource()` in `api.php`**: Registers `create`/`edit` routes that are never called.
  - *Why it happens:* Copy-pasting from web route files.
  - *Why it's harmful:* Wastes route entries, confusing route list output.
  - *Better approach:* Always use `Route::apiResource()` in `api.php`.

- **Forgetting `noContent()` for destroy**: Returning a JSON payload with the deleted model.
  - *Why it happens:* Default return is the model instance.
  - *Why it's harmful:* Inconsistent with REST conventions (DELETE should return 204).
  - *Better approach:* `return response()->noContent();` — see Laravel docs on `noContent`.

- **Returning views from API controllers**: Accidentally calling `view()` inside an API resource controller.
  - *Why it happens:* Developer trained on web controllers.
  - *Why it's harmful:* Returns HTML to JSON clients.
  - *Better approach:* Use `return new PhotoResource($photo)` or `return response()->json(...)`.

---

## Failure Modes

- **Hidden `create`/`edit` routes via resource inheritance**: A child controller extending an API controller could add view methods. *Detection:* Route listing reveals unexpected GET routes for `/create` and `/{id}/edit`. *Mitigation:* Add CI rule: `php artisan route:list --json | jq '.[] | select(.uri | endswith("/create") or endswith("/edit"))'` and assert empty.

- **Form request validation misuse**: Forgetting that API controllers use `StoreXxxRequest` and `UpdateXxxRequest`, not inline validation. *Detection:* Controller methods accept plain `Request` instead of typed form requests. *Mitigation:* PHPStan rules or code reviews.

- **Missing `Accept: application/json` header handling**: API returns HTML error pages on validation failure. *Detection:* 422 responses come back as HTML. *Mitigation:* Ensure `App\Exceptions\Handler` renders JSON for API routes.

---

## Ecosystem Usage

- **Laravel Passport**: Uses API resource controllers for OAuth client management endpoints.
- **Laravel Sanctum**: API resource controllers for token management in first-party SPA apps.
- **Laravel API Boilerplate (open-source)**: Defaults to `Route::apiResource()` for all REST endpoints.

---

## Related Knowledge Units

### Prerequisites
- Resource Controller Pattern
- Route Registration Basics

### Related Topics
- Controller Response Selection
- Controller Form Request Integration

### Advanced Follow-up Topics
- Controller Action Delegation
- Controller Testing Strategies

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\Router::apiResource()` — ~5-line wrapper
- `Illuminate\Routing\Router::apiResources()` — bulk registration loop
- `Illuminate\Routing\ResourceRegistrar` — underlying route registration

### Key Insight
`apiResource` is purely syntactic sugar over `resource()` with an `only` filter. Its primary value is communication (intent) rather than functionality.

### Version-Specific Notes
- Introduced in Laravel 8.0.
- Unchanged through Laravel 11 — internal implementation still delegates to the same `resource()` path.
