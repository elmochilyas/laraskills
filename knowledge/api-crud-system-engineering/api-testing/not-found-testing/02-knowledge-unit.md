# Not Found Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Not Found Testing
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
Not found tests verify that requests for non-existent resources return 404 responses. Every endpoint that accepts a resource identifier (show, update, destroy, restore) must prove it returns 404 when the resource does not exist. Laravel's `assertStatus(404)` and appropriate error-shape assertions validate this. Tests cover implicit route-model binding failure, explicit `findOrFail()`, `whereKey()` with empty collection, and soft-deleted resource access without `withTrashed()`.

---

## Core Concepts
Triggering a 404 in Laravel happens via: implicit route-model binding (Route::get('/posts/{post}') — `ModelNotFoundException`), explicit `Model::findOrFail($id)`, `Model::where('id', $id)->firstOrFail()`, or `abort(404)`. The response must be 404 with error body. Test with a high non-existent ID (999999), a non-numeric ID (string where int is expected), a UUID where numeric is expected (shape mismatch), and a soft-deleted resource ID (for endpoints without `->withTrashed()`). For `index` endpoints, test that empty collections don't produce 404 — they return 200 with `data: []`.

---

## Mental Models
404 tests are **ghost-door tests** — you knock on a door that doesn't exist, and the house must tell you it's not there. Every resource-identifier endpoint has a ghost version: the non-existent ID that must never return 200, 201, or 403.

---

## Internal Mechanics
When implicit binding fails, `Illuminate\Database\Eloquent\ModelNotFoundException` is thrown by the router. Laravel's handler (`Handler::render()`) converts it to a 404 response. For API requests, the default JSON 404 body is `{"message": "Not Found."}`. `findOrFail()` and `firstOrFail()` throw the same exception. `abort(404)` triggers `Symfony\Component\HttpKernel\Exception\NotFoundHttpException`, which also renders as 404 but may have a custom message. `assertNotFound()` is shorthand for `assertStatus(404)`.

---

## Patterns
- **Use a non-existent ID**: Typically `999999` or `uuid()` that doesn't exist in the database.
- **Test each CRUD member endpoint**: `test_show_returns_404_for_missing_post`, `test_update_returns_404`, `test_delete_returns_404`.
- **Also test invalid ID shapes**: String passed in place of integer ID — depending on binding, this may 404 or 500.
- **Assert the error body**: `assertNotFound()->assertJson(['message' => 'Not Found.'])`.
- **Verify no database mutation**: For update/destroy with bad ID, assert no records changed.

---

## Architectural Decisions
404 testing at the feature level validates both the binding mechanism and the error response format. A unit test against `findOrFail` would verify the exception is thrown, but only a feature test verifies the router converts it to the correct JSON response. The middleware pipeline (e.g., `SubstituteBindings`) is tested implicitly.

---

## Tradeoffs
| Tradeoff | Feature 404 Test | Unit Binding Test |
|---|---|---|
| Route binding | Verified (real implicit binding) | Mocked |
| Error formatting | Verified (full handler pipeline) | Mocked |
| Setup cost | Low (no resource needed) | Low |
| Value | Confirms end-to-end 404 contract | Verifies exception mechanism |

---

## Performance Considerations
404 tests are among the cheapest feature tests — they don't require database seed data (just a non-existent ID), they fail early in the middleware chain (model binding failure), and they don't reach the controller. Maximize coverage by testing 404 with a single PestPHP dataset iterating all resource endpoints.

---

## Production Considerations
Every resource-member route must have a 404 test. Architecture tests can enforce: scan routes with `{post}`, `{user}`, etc., and assert corresponding `*_not_found` test methods exist. Consistent 404 error shape across the API is critical — if some endpoints return `{"error": "not found"}` instead of `{"message": "Not Found."}`, API clients break. Customize the 404 response globally in `App\Exceptions\Handler`.

---

## Common Mistakes
- Not testing 404 with soft-delete: a deleted resource's ID exists in the database — implicit binding finds it but the default query scope excludes it, causing an unexpected 404 for the developer but a different error (or success) depending on the route binding configuration.
- Testing 404 with an ID that doesn't match the route key type (string UUID vs integer) — Laravel may throw a 500 `ModelNotFoundException` cast error, not a 404.
- Confusing empty collection (200 with `[]`) with resource not found (404).

---

## Failure Modes
- **Silent fallback**: Endpoint catches `ModelNotFoundException` internally and returns 200 with null data — consumer expects 404.
- **Wrong status**: Endpoint returns 500 for missing resource instead of 404 (unhandled exception).
- **Inconsistent error shape**: Some endpoints return 404 with `{"message": "Not Found"}`, others with `{"error": "Resource not found"}`.

---

## Ecosystem Usage
Fractal, Spatie Query Builder, and Laravel API Resource all adhere to the 404-on-missing convention. Laravel's own `Route::resource()` generates routes that use implicit binding — 404 tests are built into generated tests.

---

## Related Knowledge Units
### Prerequisites
- Laravel Route Model Binding (implicit, explicit, custom bindings)
- feature-test-structure (sending requests to member routes)

### Related Topics
- error-response-shape-testing (404 error structure)
- response-status-code-testing (4xx status code family)

### Advanced Follow-up Topics
- Custom 404 responses by resource type
- Global 404 vs resource-specific 404 formatting
- Eloquent soft-delete route binding (`withTrashed`, `withoutTrashed`)

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\ModelNotFoundException` is thrown by `Model::resolveRouteBinding()` and `Model::findOrFail()`. The handler conversion is in `Illuminate\Foundation\Configuration\Exceptions`.
### Key Insight
404 testing is the cheapest way to validate route-model binding configuration — a single non-existent ID tests the entire binding-to-response pipeline.
### Version-Specific Notes
Laravel 11's route model binding uses `resolveRouteBinding()` which can be overridden per model for custom 404 behavior. Soft-delete binding is controlled via `SoftDeletes` trait. `assertNotFound()` was added as a convenience method in Laravel 8.x.
