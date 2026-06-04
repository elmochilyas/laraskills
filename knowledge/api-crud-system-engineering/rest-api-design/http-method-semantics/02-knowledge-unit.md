# HTTP Method Semantics

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** HTTP Method Semantics
- **Last Updated:** 2026-06-02

---

## Executive Summary

HTTP methods (verbs) define the intended action for a request to a resource. GET, POST, PUT, PATCH, DELETE are the five primary methods used in REST APIs, each with specific semantics around safety, idempotency, and cacheability. Selecting the correct method for each operation determines how intermediaries (proxies, CDNs, browsers) handle requests and responses.

GET is safe and idempotent (reading), PUT is idempotent but not safe (full replacement), PATCH is neither safe nor idempotent (partial modification), DELETE is idempotent (deletion), and POST is neither safe nor idempotent (creation, or any action). Laravel's routing system maps these methods to controller actions natively, with method spoofing support for HTML forms and route model binding integration.

---

## Core Concepts

### HTTP Method Properties

| Method | Safe | Idempotent | Cacheable | Request Body | Laravel Route |
|---|---|---|---|---|---|
| GET | Yes | Yes | Yes | No | `Route::get()` |
| POST | No | No | No | Yes | `Route::post()` |
| PUT | No | Yes | No | Yes | `Route::put()` |
| PATCH | No | No | No | Yes | `Route::patch()` |
| DELETE | No | Yes | No | Optional | `Route::delete()` |
| HEAD | Yes | Yes | Yes | No | `Route::match(['HEAD'], ...)` |
| OPTIONS | Yes | Yes | No | No | `Route::options()` |

### Safe Methods
A safe method does not modify server state. GET and HEAD are safe. Safe methods can be pre-fetched, prefetched, or automatically retried by clients without concern for side effects.

### Idempotent Methods
An idempotent method produces the same server state after one or more identical requests. GET, PUT, DELETE, HEAD, OPTIONS are idempotent. POST and PATCH are not idempotent. Idempotency is critical for retry logic — clients can safely retry idempotent requests on network failures.

### Method Specificity

#### GET
- Retrieve a resource representation
- No request body (servers may ignore the body)
- Response is cacheable
- Never has side effects

#### POST
- Create a new resource or perform an action
- Request body contains the representation or instructions
- Response: 201 Created (new resource) or 200 OK (action result)
- Location header for new resource URI

#### PUT
- Full replacement of a resource
- Client sends the complete resource representation
- If the resource doesn't exist, the server may create it (status 201)
- Idempotent — sending the same PUT multiple times has the same effect

#### PATCH
- Partial modification of a resource
- Client sends only the fields to change
- Not idempotent — but can be made idempotent with conditional requests (ETags)
- Response: 200 OK with updated representation

#### DELETE
- Remove a resource
- Idempotent — second DELETE returns 404 but server state is unchanged
- Response: 204 No Content (common) or 200 OK

---

## Mental Models

### The Database Transaction Model
GET = SELECT, POST = INSERT, PUT = UPDATE (full row), PATCH = UPDATE (specific columns), DELETE = DELETE. This is an imperfect but useful mental model for developers transitioning from SQL to HTTP APIs.

### The Document Editor Model
GET = open document, PUT = save entire document (replacing all content), PATCH = apply a diff/patch to specific sections, DELETE = move to trash, POST = create new document from template.

### The Shopping Analogy
GET = looking at items (no commitment), POST = adding to cart (creates something new), PUT = replacing the entire cart contents, PATCH = changing the quantity of one item, DELETE = removing an item.

---

## Internal Mechanics

### Laravel Route Method Registration
```php
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{user}', [UserController::class, 'update']);
Route::patch('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);
```

Laravel differentiates PUT and PATCH at the routing level but both typically map to the same controller method in practice. The distinction matters for idempotency guarantees.

### Method Spoofing (Backward Compatibility)
Laravel supports hidden `_method` field in POST forms to simulate PUT/PATCH/DELETE. This is for HTML forms only (browser restriction) and is handled by the `\Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull` / `\Illuminate\Foundation\Http\Middleware\TrimStrings` pipeline. For API routes, methods are sent directly.

```php
<form method="POST">
    @method('PUT')
    @csrf
    <!-- fields -->
</form>
```

### HEAD Request Handling
Laravel converts HEAD requests to GET automatically via the `HandlePrecognitiveRequests` middleware and route internals. The response body is stripped, returning only headers.

### OPTIONS Request Handling
Laravel does not handle OPTIONS by default. The `HandleCors` middleware (or Laravel's CORS config) handles preflight OPTIONS requests. Custom OPTIONS routes require explicit `Route::options()`.

---

## Patterns

### Standard CRUD Method Mapping
```
GET    /resources       → index   — List resources
POST   /resources       → store   — Create resource
GET    /resources/{id}  → show    — Get resource
PUT    /resources/{id}  → update  — Full replace
PATCH  /resources/{id}  → update  — Partial update
DELETE /resources/{id}  → destroy — Delete resource
```

### PUT vs PATCH Decision
Use PUT when the client sends the complete resource state and the server replaces the entire resource. Use PATCH when the client sends only the differences. PUT requires the client to know the full resource shape; PATCH requires a shared understanding of the patch format (JSON Merge Patch RFC 7396, JSON Patch RFC 6902).

```php
// PUT - Full replacement
public function update(Request $request, User $user) {
    $validated = $request->validate([
        'name' => 'required|string',
        'email' => 'required|email',
        'role' => 'required|in:admin,user',
    ]);
    $user->update($validated);
    return new UserResource($user);
}

// PATCH - Partial update
public function partialUpdate(Request $request, User $user) {
    $validated = $request->validate([
        'name' => 'sometimes|string',
        'email' => 'sometimes|email',
        'role' => 'sometimes|in:admin,user',
    ]);
    $user->update($validated);
    return new UserResource($user);
}
```

### Custom Action via POST
```php
Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
// POST is the only non-safe, non-idempotent method suitable for arbitrary actions
```

### Bulk Operations via POST
```php
Route::post('/users/batch/activate', [UserBatchController::class, 'activate']);
// POST supports non-standard request bodies and side effects
```

---

## Architectural Decisions

### PUT vs PATCH Default
Choosing a default for updates affects the entire API surface. PUT is simpler (full representation) but requires clients to read the current state before updating. PATCH is more efficient (partial updates) but requires agreement on patch format. Recommendation: default to PUT for simple resources, PATCH for complex resources with many optional fields.

### POST for Actions vs POST for Create
Distinguish between POST-to-create (standard resource creation) and POST-to-act (action endpoints). Both use POST because it's the only non-safe method suitable for arbitrary operations. Document which POST endpoints create resources and which perform actions.

### Method Override Support
Decide whether to support `X-HTTP-Method-Override` header for clients behind restrictive proxies. Laravel does not enable this by default for API routes. Enable only if required by client constraints.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| HTTP semantics are understood globally | Methods limit expressiveness (only 4 write methods) | Some operations need action endpoints (POST) |
| Idempotent methods enable safe retries | GET semantics limits request body usage | Complex queries use query params (length limits) |
| Safe methods enable caching | POST is the catch-all for non-standard operations | API loses caching and idempotency guarantees for actions |
| PUT idempotency is simple | PUT requires full resource representation | Higher bandwidth for partial updates |

---

## Performance Considerations

### GET Caching
GET responses can be cached at every layer (browser, CDN, reverse proxy, server). This is the primary performance advantage of proper method selection. Misusing POST for read operations bypasses all caching layers.

### HEAD Optimization
HEAD requests return headers without body. Use HEAD for resource existence checks (cheaper than GET). Laravel handles HEAD → GET conversion automatically, so the controller runs but response body is stripped.

### Method Overhead
POST, PUT, PATCH require request body parsing and validation. GET requests with query parameters are parsed into the query string without body parsing overhead.

---

## Production Considerations

### Method Allow Listing
Explicitly define which methods each endpoint accepts. Returning 405 Method Not Allowed for disallowed methods is better than silently accepting wrong methods. Laravel returns 405 automatically for routes with method mismatches.

### Idempotency Key Support
For POST endpoints that should be idempotent (payment creation, order submission), implement idempotency keys (see idempotency-semantics KU). This compensates for POST's non-idempotent nature.

### PUT vs PATCH Confusion in Clients
Client developers frequently confuse PUT and PATCH. Document clearly which method each update endpoint expects and why. Consider using only PATCH for all updates if client developers consistently choose wrong.

---

## Common Mistakes

### Using POST for Read Operations
Why it happens: POST supports request bodies, making complex queries easier. Why it's harmful: Bypasses all HTTP caching infrastructure, breaks REST semantics. Better approach: Use GET with query parameters for complex filters; use POST only when query strings are length-limited.

### Expecting PATCH to Be Idempotent
Why it happens: PATCH looks like "update" which feels idempotent. Why it's harmful: Applying the same PATCH twice may produce different results (incrementing a counter, appending to an array). Better approach: Use conditional requests (ETags) with PATCH to enforce idempotency.

### Ignoring DELETE Idempotency
Why it happens: Second DELETE returns 404, making it appear non-idempotent. Why it's harmful: Client retry logic may interpret 404 as failure. Better approach: Return 204 No Content for all DELETE responses, even for already-deleted resources.

---

## Failure Modes

### PATCH + Lack of Partial Update Semantics
If a PATCH endpoint requires all fields (not truly partial), it's actually a PUT. Clients that send only changed fields may inadvertently reset unspecified fields to defaults or null. Laravel's `$request->only()` and `$request->validated()` pattern with `sometimes` rules prevents this.

### PUT Creating Resources Unintentionally
PUT can create a resource if it doesn't exist (per HTTP spec). If this behavior is not intended, return 404 when the resource doesn't exist:
```php
public function update(Request $request, $id) {
    $user = User::find($id);
    if (!$user) { return response()->json(null, 404); }
    // ... proceed with update
}
```

---

## Ecosystem Usage

### GitHub API
GitHub uses GET/POST/PUT/PATCH/DELETE strictly. PUT for replacing content (file contents endpoint), PATCH for partial updates (issue updates). DELETE always returns 204.

### Stripe API
Stripe uses POST for all write operations (create, update, delete) — Stripe does not distinguish PUT/PATCH/DELETE at the HTTP level. This is a deliberate choice to simplify client implementation, trading REST purity for consistency.

### Twilio API
Twilio uses POST for all operations except GET for reads. No PUT/PATCH/DELETE usage. Twilio's API predates widespread REST adoption and maintains backward compatibility.

---

## Related Knowledge Units

### Prerequisites
- REST Architectural Constraints — Uniform interface constraint
- Resource vs Action Orientation — Method selection context

### Related Topics
- HTTP Status Code Selection — Response codes for each method
- Idempotency Semantics — Idempotency keys and safe vs idempotent distinctions
- Resourceful Routing — Laravel's auto-mapped CRUD methods

### Advanced Follow-up Topics
- Conditional Requests — ETag integration with PUT/PATCH for optimistic concurrency
- CORS Design — OPTIONS method and preflight handling

---

## Research Notes

### Source Analysis
- RFC 7231 — HTTP/1.1 Semantics and Content (GET, POST, PUT, DELETE, HEAD, OPTIONS)
- RFC 5789 — PATCH Method for HTTP
- RFC 7396 — JSON Merge Patch (PATCH format)

### Key Insight
The distinction between PUT and PATCH is frequently misunderstood in practice. Most production APIs that claim to support both actually implement both as the same partial-update logic. True PUT (full replacement) is rare because it requires the client to know all resource fields.

### Version-Specific Notes
- Laravel method spoofing (`_method` field) is unchanged across 10-13
- Laravel handles HEAD → GET conversion automatically in all versions
- No framework-level PUT vs PATCH differentiation beyond route registration
