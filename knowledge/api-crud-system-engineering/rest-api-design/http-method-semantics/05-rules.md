# HTTP Method Semantics

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: http-method-semantics
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Use GET For All Read Operations
---
## Category
Architecture
---
## Rule
Always use GET for read operations — never use POST for retrieving data, even when the query is complex.
---
## Reason
GET responses are cacheable at every layer (browser, CDN, reverse proxy, server). POST responses are not cacheable by default. Using POST for reads bypasses all caching infrastructure, increases server load, and breaks REST semantics. GET with query parameters handles 99% of complex query scenarios.
---
## Bad Example
```php
Route::post('users/search', [UserController::class, 'search']);
// POST for read — not cacheable
```

## Good Example
```php
Route::get('users', [UserController::class, 'index']);
// GET for read — cacheable at every layer
```

## Exceptions
When query complexity exceeds URL length limits (~2KB-8KB depending on infrastructure). Use POST for search only when query parameters would exceed these limits. Document this deviation explicitly.

## Consequences Of Violation
No HTTP-level caching for read operations; increased server load; mobile clients consume more data; slower perceived performance for repeated queries.
---

## Use POST For All Operations That Create Resources
---
## Category
Architecture
---
## Rule
Always use POST for creating new resources — never use GET or PUT for creation.
---
## Reason
POST is the HTTP method designed for non-idempotent creation operations. GET must never have side effects (servers may prefetch or cache GET responses). PUT implies idempotent full-replacement, not creation. Only POST correctly signals to intermediaries that this operation may create a new resource.
---
## Bad Example
```php
Route::put('users/{user}', [UserController::class, 'store']);
// PUT for creation — implies idempotent replacement, not creation
```

## Good Example
```php
Route::post('users', [UserController::class, 'store']);
// POST for creation — correct semantics
```

## Exceptions
When implementing create-or-retrieve semantics (idempotent creation via PUT). Some APIs use PUT for "create if not exists" patterns — document this clearly as an exception to standard POST-for-creation.

## Consequences Of Violation
Intermediaries may not handle the request correctly; caching infrastructure may cache creation requests; PUT's idempotency guarantee conflicts with non-idempotent creation behavior.
---

## Return 204 For Successful DELETE
---
## Category
Design
---
## Rule
Always return 204 No Content for successful DELETE operations — never return 200 with a body or 200 with null body.
---
## Reason
After deletion, the resource no longer exists — there is nothing to return. A 204 No Content with an empty body is unambiguous: the operation succeeded and there is no representation to return. A 200 with a body is misleading (the resource is gone), and a 200 with null body creates client ambiguity about whether the body was intentionally omitted.
---
## Bad Example
```php
public function destroy(User $user)
{
    $user->delete();
    return response()->json(['message' => 'Deleted successfully'], 200);
    // 200 with body — misleading when resource is gone
}
```

## Good Example
```php
public function destroy(User $user)
{
    $user->delete();
    return response(null, 204);
    // 204 — unambiguous: resource deleted, no content
}
```

## Exceptions
When the response includes metadata about the deletion (e.g., what was cleaned up, cascaded deletions). In that case, 200 OK with a body is acceptable — document why 204 is not used.

## Consequences Of Violation
Clients must check response body to determine if DELETE succeeded; mobile clients waste bandwidth on unnecessary response bodies; inconsistency with REST conventions confuses API consumers.
---

## Use PATCH For Partial Updates, PUT For Full Replacement
---
## Category
Design
---
## Rule
Always use PATCH for partial updates (client sends only changed fields) and PUT for full replacement (client sends complete representation) — never use PUT for partial updates.
---
## Reason
PUT semantics require the client to send the full resource representation. A PUT with only some fields implies the omitted fields should be reset to null/default. Most clients expect PUT to work like PATCH, leading to accidental data loss. PATCH with `sometimes` validation rules correctly handles partial payloads.
---
## Bad Example
```php
Route::put('users/{user}', [UserController::class, 'partialUpdate']);
// PUT for partial — omitted fields may be reset to null
```

## Good Example
```php
// PATCH for partial
Route::patch('users/{user}', [UserController::class, 'partialUpdate']);

public function partialUpdate(Request $request, User $user)
{
    $validated = $request->validate([
        'name' => 'sometimes|string',
        'email' => 'sometimes|email',
    ]);
    $user->update($validated);
    return new UserResource($user);
}
```

## Exceptions
When the API documentation explicitly documents that PUT accepts partial data (de facto PATCH behavior). Even then, it's better to use PATCH and align with HTTP semantics.

## Consequences Of Violation
Accidental data loss when clients omit fields in PUT; client confusion about whether PUT is full or partial; data integrity issues from nullified fields.
---

## Use POST For Actions That Don't Map To CRUD
---
## Category
Architecture
---
## Rule
Always use POST for non-CRUD operations (cancel, send, activate) — never force operations into unnatural PATCH or PUT semantics.
---
## Reason
Operations with complex side effects (cancellation with refunds, sending notifications, activating with provisioning) go beyond simple state transitions. Modeling them as PATCH with a status field hides the side effects. POST action endpoints make the operation explicit and allow the controller to include all business logic without abstraction leaks.
---
## Bad Example
```php
// Force-fitting cancellation into PATCH
Route::patch('orders/{order}', [OrderController::class, 'cancel']);
public function cancel(Request $request, Order $order)
{
    // Side effects (refunds, inventory) hidden in "update" endpoint
    $order->update(['status' => 'cancelled']);
    $order->processRefund();
    $order->restoreInventory();
}
```

## Good Example
```php
// Explicit action endpoint
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
public function cancel(Request $request, Order $order)
{
    $order->cancel(); // encapsulates all side effects
    return new OrderResource($order);
}
```

## Exceptions
When the action is a simple state transition with no side effects (e.g., marking a notification as read). In those cases, PATCH with a status field is cleaner.

## Consequences Of Violation
Hidden side effects in update endpoints; controllers with complex conditional logic for different "update" scenarios; unclear API semantics; harder to document and test.
---

## Use Route::apiResource() For CRUD Endpoints
---
## Category
Framework Usage
---
## Rule
Always use `Route::apiResource()` for CRUD endpoints — never use `Route::resource()` or manual route definitions for standard CRUD operations.
---
## Reason
`Route::apiResource()` registers only the five CRUD methods (index, store, show, update, destroy) without the `create` and `edit` routes that return HTML forms. Manual route definitions or `Route::resource()` add unused routes that clutter route listings and introduce web-specific endpoints into API routes.
---
## Bad Example
```php
Route::resource('users', UserController::class);
// Registers GET /users/create and GET /users/{user}/edit — unnecessary for APIs
```

## Good Example
```php
Route::apiResource('users', UserController::class);
// Registers only: index, store, show, update, destroy
```

## Exceptions
When you need custom route names or middleware that `apiResource()` cannot express. Use `apiResource()` with `->only()` or `->except()` before falling back to manual routes.

## Consequences Of Violation
Unused `create` and `edit` routes in API; larger route table; potential confusion when `create`/`edit` routes are accessed programmatically; slightly slower route registration.
---

## Use HEAD For Resource Existence Checks
---
## Category
Performance
---
## Rule
Always use HEAD requests for resource existence checks — never use GET when you only need headers and don't need the response body.
---
## Reason
HEAD returns the same headers as GET without the response body, saving bandwidth and serialization time. For resource existence checks, authorization checks, or cache validation, the body is unnecessary overhead. Laravel automatically converts HEAD to its corresponding GET route and strips the body.
---
## Bad Example
```php
// GET request just to check if resource exists — downloads full body unnecessarily
await fetch('/api/users/42'); // downloads entire user resource
```

## Good Example
```php
// HEAD request for existence check — headers only, no body
await fetch('/api/users/42', { method: 'HEAD' });
```

## Exceptions
When the client needs the response body for display or processing. Use GET for data retrieval, HEAD for presence/status checks only.

## Consequences Of Violation
Unnecessary bandwidth for existence checks; slower client-side operations; increased server load for simple presence checks.
---

## Never Send Request Body With DELETE
---
## Category
Design
---
## Rule
Never include a request body in DELETE requests — use headers or query parameters for any additional data needed during deletion.
---
## Reason
HTTP servers, proxies, and CDNs may ignore or strip the body of DELETE requests. The HTTP specification does not define semantics for DELETE request bodies. Relying on a body that may be silently stripped leads to unpredictable behavior and difficult debugging.
---
## Bad Example
```php
// DELETE with body — may be ignored by intermediaries
await fetch('/api/users/42', {
    method: 'DELETE',
    body: JSON.stringify({ reason: 'spam' })
});
```

## Good Example
```php
// DELETE with header for additional data
await fetch('/api/users/42', {
    method: 'DELETE',
    headers: { 'X-Reason': 'spam' }
});
```

## Exceptions
When the server is known to process DELETE bodies (internal services with no intermediaries). Even then, prefer headers for consistency with HTTP semantics.

## Consequences Of Violation
Body silently stripped by proxies; deletion behavior differs between environments; difficult to debug when deletion doesn't process expected body data.
---

## Do Not Accept Method Spoofing For API Routes
---
## Category
Security
---
## Rule
Never accept `_method` field spoofing on API routes — disable method spoofing middleware for API requests or validate only the actual HTTP method.
---
## Reason
`_method` spoofing is designed for HTML forms that can only submit GET and POST. APIs have full HTTP method support and do not need spoofing. Accepting `_method` on API routes bypasses method-based middleware, routing, and rate limiting — a POST with `_method=DELETE` may bypass DELETE-specific rate limits or middleware.
---
## Bad Example
```php
// Client sends POST with _method=DELETE
POST /api/users/42
_method=DELETE
// May bypass DELETE-specific middleware
```

## Good Example
```php
// Client sends actual DELETE method
DELETE /api/users/42
// Correct middleware applies
```

## Exceptions
When the API must support legacy clients that cannot send methods other than GET and POST. In that case, validate `_method` against an allowlist and log its usage for migration tracking.

## Consequences Of Violation
Method-specific middleware bypass; incorrect rate limiting; security controls that depend on method are circumvented; routing confusion.
---
