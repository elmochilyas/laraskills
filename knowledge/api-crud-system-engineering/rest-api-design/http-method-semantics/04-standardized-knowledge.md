# HTTP Method Semantics

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: http-method-semantics
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
HTTP methods (verbs) define the intended action for a request to a resource. GET, POST, PUT, PATCH, DELETE are the five primary methods used in REST APIs, each with specific semantics around safety, idempotency, and cacheability. Selecting the correct method for each operation determines how intermediaries (proxies, CDNs, browsers) handle requests and responses.

GET is safe and idempotent (reading), PUT is idempotent but not safe (full replacement), PATCH is neither safe nor idempotent (partial modification), DELETE is idempotent (deletion), and POST is neither safe nor idempotent (creation or any action). Laravel's routing system maps these methods to controller actions natively.

## Core Concepts
- **Safe Methods**: No server state change. GET, HEAD, OPTIONS. Can be pre-fetched, cached, and automatically retried.
- **Idempotent Methods**: Same server state after one or more identical requests. GET, PUT, DELETE, HEAD, OPTIONS. Critical for retry logic.
- **GET**: Retrieve a resource representation. No request body. Cacheable. Never has side effects.
- **POST**: Create a resource or perform an action. Request body. 201 Created or 200 OK. Not safe or idempotent.
- **PUT**: Full replacement of a resource. Client sends complete representation. Idempotent. May create resource if it doesn't exist.
- **PATCH**: Partial modification. Client sends only changed fields. Not idempotent by default (can be made so via ETags).
- **DELETE**: Remove a resource. Idempotent — second DELETE returns 404 but server state unchanged.
- **HEAD**: Same as GET but no response body. Laravel converts HEAD to GET automatically, stripping the body.
- **OPTIONS**: Returns allowed methods. Handled by CORS middleware for preflight.

## When To Use
- **GET**: All read operations — resource retrieval, listing, searching with query parameters
- **POST**: Resource creation, action endpoints, batch operations, complex search
- **PUT**: Full resource replacement where client sends all fields
- **PATCH**: Partial updates where client sends only changed fields
- **DELETE**: Resource removal
- **HEAD**: Resource existence checks, cache validation without body
- **OPTIONS**: CORS preflight, capability discovery

## When NOT To Use
- **POST for reads**: Bypasses HTTP caching — use GET with query parameters
- **GET with request body**: Servers may ignore body — use POST for complex queries
- **PUT for partial updates**: PUT implies full replacement — use PATCH for partial
- **PATCH without idempotency guarantees**: Use If-Match or switch to PUT
- **DELETE with response body**: 204 No Content is preferred for successful deletes
- **Method spoofing for APIs**: `_method` field is for HTML forms only

## Best Practices (WHY)
- **Use GET for all read operations**: GET responses are cacheable at every layer. POST for reads bypasses all caching infrastructure.
- **Use PUT for full replacement, PATCH for partial**: PUT requires the client to know all resource fields. PATCH is more efficient for partial updates. Most production APIs that claim both actually implement PATCH-only.
- **Return 204 for successful DELETE**: The response body is unnecessary — the resource is gone. 200 with body is valid but 204 is more REST-correct.
- **Use POST for actions that don't map to CRUD**: `POST /orders/42/cancel` is clear and explicit. Don't force actions into unnatural PATCH semantics.
- **Implement idempotency keys for critical POST endpoints**: POST is not idempotent — use `Idempotency-Key` header to provide exactly-once semantics for payment creation, order placement, etc.

## Architecture Guidelines
- Map CRUD operations to standard routes: `GET /resources` → index, `POST /resources` → store, `GET /resources/{id}` → show, `PUT/PATCH /resources/{id}` → update, `DELETE /resources/{id}` → destroy.
- For custom actions alongside resources, use explicit POST routes — don't add non-standard methods to resource controllers.
- Use `Route::apiResource()` for CRUD endpoints — it excludes `create` and `edit` routes that are for web forms.
- Document whether PUT vs PATCH is expected for each update endpoint — client confusion between them is common.
- Consider using only PATCH for all updates if client developers consistently confuse PUT and PATCH.

## Performance
- GET responses can be cached at every layer (browser, CDN, reverse proxy, server) — the primary performance advantage of proper method selection.
- HEAD requests return headers without body — use for resource existence checks (cheaper than GET).
- POST, PUT, PATCH require request body parsing and validation — GET with query parameters avoids body parsing overhead.
- Method-based dispatching is optimized in Laravel's router — route caching improves registration time.

## Security
- GET requests must never modify server state — violating this breaks caching, prefetching, and automated crawlers.
- POST is the only non-safe, non-idempotent method — use for operations that should not be automatically retried.
- Method spoofing (`_method` field) must not be accepted for API routes — it's for HTML forms behind browser restrictions.
- 405 Method Not Allowed is returned automatically by Laravel for method mismatches — ensure error response format matches API conventions.
- PUT can create resources if they don't exist (per HTTP spec) — explicitly handle this if the behavior is not desired.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| POST for read operations | Using POST to retrieve data with complex filters | Convenience — request body support | Bypasses HTTP caching, breaks REST semantics | Use GET with query parameters; use POST only when URL length limits are hit |
| Expecting PATCH to be idempotent | Retrying PATCH without considering side effects | "Update" feels idempotent | Duplicate PATCH may produce different results (incrementing counters, appending arrays) | Use If-Match with PATCH or switch to PUT |
| Ignoring DELETE idempotency | Treating 404 on second DELETE as failure | Not understanding idempotency semantics | Client retry logic interprets 404 incorrectly | Return 204 for all DELETE responses, even for already-deleted resources |
| PUT that behaves like PATCH | Accepting partial data in a PUT endpoint | PUT is harder to implement correctly | Null/missing fields overwrite existing data | Require all fields for PUT; use PATCH for partial |
| GET with request body | Sending JSON body with GET request | Convenience for complex queries | Proxies/servers may strip body | Use POST for complex queries or encode in query parameters |
| PATCH without partial semantics | PATCH endpoint requiring all fields | Copy-paste from PUT implementation | Not truly partial — clients must send complete representation | Use `sometimes` validation rules for PATCH |

## Anti-Patterns
- **POST Everything**: Using POST for all operations (Stripe-style). Simplifies clients but loses HTTP semantics.
- **GET for Writes**: Using GET to trigger side effects. Breaks caching, prefetching, and spiders.
- **PUT for Partial Updates**: Using PUT but only sending changed fields. Unchanged fields may be reset to null/default.
- **DELETE with Body**: Sending a request body with DELETE. Servers may ignore the body — use query parameters or headers.
- **Custom Methods in URL**: `GET /users/getActiveUsers` when the verb "get" is implicit. Use query parameter `?filter[status]=active`.

## Examples
```php
// Standard CRUD mapping
Route::apiResource('users', UserController::class);
// GET /users → index
// POST /users → store
// GET /users/{user} → show
// PUT/PATCH /users/{user} → update
// DELETE /users/{user} → destroy

// Action endpoint (POST for non-CRUD)
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);

// PUT — full replacement
public function replace(Request $request, User $user)
{
    $validated = $request->validate([
        'name' => 'required|string',
        'email' => 'required|email',
        'role' => 'required|in:admin,user',
    ]);
    $user->update($validated);
    return new UserResource($user);
}

// PATCH — partial update
public function partialUpdate(Request $request, User $user)
{
    $validated = $request->validate([
        'name' => 'sometimes|string',
        'email' => 'sometimes|email',
    ]);
    $user->update($validated);
    return new UserResource($user);
}

// DELETE returning 204
public function destroy(User $user)
{
    $user->delete();
    return response(null, 204);
}
```

## Related Topics
- **Prerequisites**: rest-architectural-constraints, resource-vs-action-orientation
- **Related**: http-status-code-selection, idempotency-semantics, resourceful-routing
- **Advanced**: conditional-requests, cors-design

## AI Agent Notes
- Use `Route::apiResource()` for CRUD — excludes `create`/`edit` routes.
- GET for reads, POST for creates/actions, PUT for full replacement, PATCH for partial, DELETE for removal.
- Return 204 for successful DELETE (no body needed).
- Don't use POST for reads — use GET with query parameters.
- For partial updates, ensure PATCH uses `sometimes` validation rules.
- Handle PUT creating resources explicitly if the behavior is not desired.

## Verification
- GET endpoints never modify server state (safe by construction).
- DELETE endpoints return 204 and are idempotent (second call also returns 204).
- POST endpoints that need idempotency implement `Idempotency-Key` support.
- PUT requires and replaces the full resource representation.
- PATCH accepts and processes only the fields the client sends.
- No `create` or `edit` routes exist for API endpoints (use `apiResource`).
- HEAD requests return the same headers as GET without the body.
