# Idempotency Semantics

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: idempotency-semantics
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Implement Idempotency Keys For Critical POST Endpoints
---
## Category
Reliability
---
## Rule
Always implement `Idempotency-Key` header support for POST endpoints that create billable or identity-impacting resources (payments, orders, account registration) — never leave critical POST endpoints without idempotency guarantees.
---
## Reason
Network failures cause clients to retry requests. Without idempotency, a retry creates a duplicate order, duplicate payment, or duplicate account. The cost of implementing idempotency middleware is far less than the cost of handling duplicate charges, refunds, and customer service issues.
---
## Bad Example
```php
public function store(Request $request)
{
    $order = Order::create($request->validated());
    Charge::create($order, $request->amount); // duplicate on retry!
    return new OrderResource($order);
}
```

## Good Example
```php
public function store(Request $request)
{
    $key = $request->header('Idempotency-Key');
    if ($key && $cached = Cache::get("idempotency:$key")) {
        return response($cached['body'], $cached['status']);
    }
    $order = Order::create($request->validated());
    Charge::create($order, $request->amount);
    $response = new OrderResource($order);
    Cache::put("idempotency:$key", ['status' => 201, 'body' => $response], 86400);
    return response()->json($response, 201);
}
```

## Exceptions
Low-risk POST endpoints where duplicates are harmless (append-only logs, analytics events). The cost of idempotency must be weighed against the cost of duplicates.

## Consequences Of Violation
Duplicate orders, payments, and accounts; financial loss from duplicate charges; customer service overhead for reversing duplicates; regulatory compliance issues for duplicate transactions.
---

## Use Atomic Cache Operations To Prevent Race Conditions
---
## Category
Reliability
---
## Rule
Always use `Cache::add()` (atomic set-if-not-exists) or `Cache::lock()` for idempotency key checks — never use a non-atomic check-then-set pattern.
---
## Reason
Two identical requests arriving simultaneously both check the cache, find nothing, and both proceed to process. Without atomic operations, the race condition means both requests create the resource despite sharing an idempotency key. `Cache::add()` atomically ensures only one request can register the key first.
---
## Bad Example
```php
$cached = Cache::get("idempotency:$key");
if ($cached) { return cached response; }
// Race condition: two requests both get null here
$order = Order::create($data); // both create
Cache::put("idempotency:$key", $order, 86400);
```

## Good Example
```php
$lock = Cache::lock("idempotency:$key", 10);
if (!$lock->get()) {
    return response()->json(['message' => 'Request in progress.'], 409);
}
try {
    $cached = Cache::get("idempotency:$key");
    if ($cached) { return $cached; }
    $order = Order::create($data);
    Cache::put("idempotency:$key", $order, 86400);
    return $order;
} finally {
    $lock->release();
}
```

## Exceptions
When the database's unique constraint is used for idempotency (insert with unique `idempotency_key` column). The database handles the race condition via unique index enforcement.

## Consequences Of Violation
Duplicate resource creation despite idempotency keys; race condition window produces duplicates under load; difficult to repro because timing-dependent.
---

## Cache All Responses Including Errors
---
## Category
Reliability
---
## Rule
Always cache all idempotency key responses — both success (2xx) and error (4xx/5xx) — never cache only successful responses.
---
## Reason
If only successful responses are cached, a transient 500 on the first request means the client retries with the same key and receives the same 500 again (since it's not cached). The client is stuck in a retry loop. Caching error responses ensures that transient failures return the cached error, and the client can eventually use a new key.
---
## Bad Example
```php
// Only caches success responses
$response = $next($request);
if ($response->isSuccessful()) {
    Cache::put("idempotency:$key", $response, 86400);
}
// Transient 500 not cached — retry also hits 500
```

## Good Example
```php
// Caches all responses below 500 (non-server-error)
$response = $next($request);
if ($response->getStatusCode() < 500) {
    Cache::put("idempotency:$key", [
        'status' => $response->getStatusCode(),
        'body' => $response->getContent(),
        'headers' => $response->headers->all(),
    ], 86400);
}
// 500 errors not cached — client can retry with same key
```

## Exceptions
When the error indicates a permanent failure that should always be retried with a new key. Document which error codes are intentionally not cached.

## Consequences Of Violation
Client stuck in retry loop on transient failures; support tickets for "API keeps returning errors on retry"; increased server load from repeated failed requests.
---

## Set TTL Based On Maximum Retry Window
---
## Category
Maintainability
---
## Rule
Always set idempotency key TTL to the maximum expected retry window (default 24 hours) — never use indefinite storage or too-short TTLs.
---
## Reason
Too-short TTL: clients with slow retry logic (exponential backoff) may exhaust the TTL and re-process the request, causing duplicates. Too-long TTL: storage grows unbounded, and clients cannot retry intentional failures after the TTL expires. 24 hours is the industry standard (used by Stripe) — it covers nearly all retry scenarios.
---
## Bad Example
```php
Cache::put("idempotency:$key", $response, 60);
// 60-second TTL — client retry after 60s creates duplicate
```

## Good Example
```php
Cache::put("idempotency:$key", $response, now()->addHours(24));
// 24-hour TTL — covers all practical retry scenarios
```

## Exceptions
Endpoints with immediate processing requirements (real-time payments) where retry beyond minutes is not meaningful. Use a shorter TTL and document the maximum retry window.

## Consequences Of Violation
Duplicate processing from expired keys; storage exhaustion from indefinite keys; difficult-to-reproduce duplicate bugs when TTL expires between retry attempts.
---

## Return 409 For Key Collision With Different Request Body
---
## Category
Security
---
## Rule
Always return 409 Conflict when the same idempotency key is reused with a different request body than the original request — never silently process the new request.
---
## Reason
An idempotency key uniquely binds to a specific request. Reusing the same key with a different body indicates a client bug (wrong key generated) or a replay attack (attacker captured a key and is sending modified data). Returning 409 forces the client to recognize the misuse and generate a new key for the new request.
---
## Bad Example
```php
$key = $request->header('Idempotency-Key');
$cached = Cache::get("idempotency:$key");
if ($cached) {
    return $cached; // ignores body change — processes with wrong data
}
```

## Good Example
```php
$key = $request->header('Idempotency-Key');
$cached = Cache::get("idempotency:$key");
if ($cached) {
    $bodyHash = md5($request->getContent());
    if ($cached['body_hash'] !== $bodyHash) {
        return response()->json([
            'message' => 'Idempotency key reused with different request body.',
        ], 409);
    }
    return $cached;
}
// Store body hash with cached response
Cache::put("idempotency:$key", [
    ...$responseData,
    'body_hash' => md5($request->getContent()),
], 86400);
```

## Exceptions
When the API explicitly supports idempotency key reuse across different requests for specific use cases. Document this exception and the merge/reset strategy.

## Consequences Of Violation
Client bugs go undetected and cause data corruption; replay attacks with modified payloads succeed; audit trails show keys mapped to multiple different requests.
---

## Implement Idempotency As Middleware
---
## Category
Code Organization
---
## Rule
Always implement idempotency as middleware — never implement idempotency checks in individual controllers.
---
## Reason
Idempotency is a cross-cutting concern that applies uniformly across multiple endpoints. Per-controller implementation duplicates logic, creates inconsistency (some controllers implement it, others don't), and makes auditing difficult. Middleware applies the same logic to all registered routes with a single configuration point.
---
## Bad Example
```php
// In OrderController::store
if ($request->header('Idempotency-Key')) { ... }
// In PaymentController::store — same logic duplicated
if ($request->header('Idempotency-Key')) { ... }
```

## Good Example
```php
// Middleware — single implementation
class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->isMethod('post') && !$request->isMethod('patch')) {
            return $next($request);
        }
        // ... idempotency logic
    }
}

// Applied to route group
Route::middleware('idempotency')->group(function () {
    Route::post('orders', [OrderController::class, 'store']);
    Route::post('payments', [PaymentController::class, 'store']);
});
```

## Exceptions
When an endpoint needs special idempotency behavior (different TTL, different collision handling). Use middleware with configuration options rather than skipping middleware entirely.

## Consequences Of Violation
Inconsistent idempotency coverage across endpoints; duplicated code that diverges over time; auditing cannot verify which endpoints have idempotency protection.
---

## Accept Idempotency-Key Only On POST And PATCH
---
## Category
Design
---
## Rule
Always restrict `Idempotency-Key` header acceptance to POST and PATCH endpoints — never accept it on GET, PUT, HEAD, OPTIONS, or DELETE.
---
## Reason
GET, HEAD, OPTIONS, PUT, and DELETE are already idempotent by HTTP definition. Accepting an idempotency key on these methods implies they are not idempotent, confusing clients about HTTP semantics. PUT and DELETE are guaranteed idempotent — no additional mechanism is needed.
---
## Bad Example
```php
class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $key = $request->header('Idempotency-Key');
        if ($key) {
            // processes for all methods including GET and DELETE
        }
    }
}
```

## Good Example
```php
class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->isMethod('post') && !$request->isMethod('patch')) {
            return $next($request);
        }
        $key = $request->header('Idempotency-Key');
        // ... process only for POST and PATCH
    }
}
```

## Exceptions
When the API uses PUT for non-idempotent operations (non-standard). In that case, fix the PUT implementation to be idempotent — do not add idempotency keys as a workaround.

## Consequences Of Violation
Confusing API semantics; clients expecting non-idempotent behavior on PUT/DELETE; unnecessary processing overhead on methods that don't need idempotency keys.
---

## Never Accept Idempotency Keys From Unauthenticated Requests
---
## Category
Security
---
## Rule
Never accept or process `Idempotency-Key` headers from unauthenticated requests — always validate authentication before idempotency processing.
---
## Reason
An attacker can pre-seed idempotency keys for known endpoints, blocking legitimate requests that use the same keys. If idempotency middleware runs before authentication, unauthenticated requests can occupy key slots that authenticated requests need later. This is a denial-of-service vector.
---
## Bad Example
```php
// Idempotency middleware runs before auth — unauthenticated requests can seed keys
class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $key = $request->header('Idempotency-Key');
        if ($key) {
            Cache::add("idempotency:$key", ...); // attacker can pre-seed
        }
    }
}
```

## Good Example
```php
// Auth middleware runs before idempotency
Route::middleware(['auth:sanctum', 'idempotency'])->group(function () {
    Route::post('orders', [OrderController::class, 'store']);
});
```

## Exceptions
When the idempotency key is derived from the request content (not client-supplied) and the endpoint has no authentication requirement. Even then, rate-limit the endpoint to prevent key exhaustion.

## Consequences Of Violation
Denial-of-service via idempotency key pre-seeding; legitimate requests blocked by keys seeded by attackers; difficult to diagnose because collisions appear to be client-side issues.
---

## Monitor Idempotency Key Collision Rate
---
## Category
Maintainability
---
## Rule
Always log and monitor idempotency key collisions (same key, different body) — never ignore collision events.
---
## Reason
A spike in key collisions indicates a buggy client (reusing keys incorrectly), a misconfigured client (not generating unique keys per request), or a potential attack (replay attempt). Monitoring collisions provides early warning of client integration issues before they cause data integrity problems.
---
## Bad Example
```php
// Collisions silently ignored
if ($cached && $cached['body_hash'] !== $bodyHash) {
    return response()->json(['message' => 'Conflict'], 409);
}
```

## Good Example
```php
if ($cached && $cached['body_hash'] !== $bodyHash) {
    Log::warning('Idempotency key collision', [
        'key' => $key,
        'user_id' => $request->user()?->id,
        'path' => $request->path(),
    ]);
    return response()->json(['message' => 'Conflict.'], 409);
}
```

## Exceptions
When collisions are expected behavior (e.g., an endpoint that intentionally accepts the same key for different payloads). Even then, log for audit purposes.

## Consequences Of Violation
Undetected client bugs causing data integrity issues; delayed response to replay attacks; no visibility into client integration quality; harder to debug production issues.
---
