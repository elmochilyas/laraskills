# Phase 5: Rules — Idempotency Key Design

## Rule 1: Require Idempotency-Key Header for All Mutating Endpoints
---
## Category
Reliability
---
## Rule
Always require the `Idempotency-Key` header on POST, PATCH, PUT, and DELETE endpoints. Return 422 Unprocessable Entity when the header is missing. Never allow mutating requests without an idempotency key.
---
## Reason
Idempotency keys enable safe retries over unreliable networks. Without them, network timeouts lead to duplicate operations (double charges, duplicate orders).
---
## Bad Example
```php
public function store(Request $request) {
    // No idempotency check — 3 retries = 3 orders created
}
```
---
## Good Example
```php
public function store(Request $request) {
    if (!$request->hasHeader('Idempotency-Key')) {
        return response()->json([
            'error' => [
                'code' => 'IDEMPOTENCY_KEY_MISSING',
                'message' => 'Idempotency-Key header is required for POST requests.',
            ]
        ], 422);
    }
    // process with idempotency check
}
```
---
## Exceptions
GET and HEAD endpoints are idempotent by HTTP specification and do not require idempotency keys.
---
## Consequences Of Violation
Duplicate side effects from retries; financial reconciliation issues; data integrity violations.
---

## Rule 2: Store Full Response for Exact Replay
---
## Category
Reliability
---
## Rule
Always store the complete response (status code, headers, body) in the idempotency store when processing a request with an idempotency key. Never return a different response on replay than on the original request.
---
## Reason
Consumers expect identical responses for identical keys. Returning a different status code or body (e.g., 200 instead of 201) breaks client assumptions.
---
## Bad Example
```php
// Stores only success/failure — replay returns generic response
$store->put($key, ['success' => true]); // 201 response lost
// Replay returns 200 OK instead of 201 Created
```
---
## Good Example
```php
$response = response()->json($data, 201);
// Store full response serialized
$store->put($key, [
    'status' => 201,
    'headers' => ['Content-Type' => 'application/json'],
    'body' => $data,
], 86400);
// Replay returns exact same response
```
---
## Exceptions
Streaming or very large responses may store a reference (S3 key) instead of the full payload.
---
## Consequences Of Violation
Consumer retry logic breaks (expecting 201, gets 200); debugging complexity increases.
---

## Rule 3: Use Redis `SET NX EX` for Atomic Lock
---
## Category
Reliability
---
## Rule
Always use Redis `SET NX EX` (or equivalent atomic create-with-expiry) to handle concurrent requests with the same idempotency key. Never implement lock-then-set in separate operations.
---
## Reason
Non-atomic check-then-set creates a race condition where two concurrent requests both pass the check before either sets the key, resulting in duplicate processing.
---
## Bad Example
```php
// Race condition: both requests check, neither set yet
if (!$redis->exists($key)) {
    // Both requests enter here simultaneously
    $redis->set($key, $response);
}
```
---
## Good Example
```php
// Atomic: only one request succeeds in creating the key
$locked = $redis->set($key, $response, 'NX', 'EX', 86400);
if (!$locked) {
    // Key exists — this is a replay, return stored response
    return $this->getStoredResponse($key);
}
// This request won the race — process normally
```
---
## Exceptions
If Redis is unavailable, fall back to processing without idempotency (with warning log) rather than failing all requests.
---
## Consequences Of Violation
Duplicate processing under concurrent requests; double charges; data corruption.
---

## Rule 4: Prefix Keys with Consumer ID
---
## Category
Security
---
## Rule
Always prefix idempotency keys with the consumer identifier (e.g., `acct_123:order_create_456`). Never accept raw keys without consumer scoping.
---
## Reason
Consumer-prefixed keys prevent collisions between different consumers who might generate the same UUID. Scoping also enables per-consumer key management and prevents enumeration.
---
## Bad Example
```php
// No consumer prefix — collision risk across consumers
$redis->set($request->header('Idempotency-Key'), $response, 'NX', 'EX', 86400);
```
---
## Good Example
```php
$consumerId = $request->user()->consumerId();
$rawKey = $request->header('Idempotency-Key');
$scopedKey = "idempotency:{$consumerId}:{$rawKey}";
$redis->set($scopedKey, $response, 'NX', 'EX', 86400);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Cross-consumer key collisions cause false replays (Consumer A's request rejected because Consumer B used the same UUID).
---

## Rule 5: Include Idempotency-Key-Status Header in Responses
---
## Category
Design
---
## Rule
Always include the `Idempotency-Key-Status` header in responses with value `new` for first-time requests or `replay` for repeated requests with the same key. Never omit this header.
---
## Reason
The status header enables consumers to distinguish between "request processed for the first time" and "response replayed from cache," which is critical for debugging and idempotency verification.
---
## Bad Example
```php
return response($data, 201); // No idempotency status header
```
---
## Good Example
```php
$status = $isReplay ? 'replay' : 'new';
return response($data, 201)
    ->header('Idempotency-Key-Status', $status);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers cannot distinguish first-time success from replay; debugging retry chains becomes difficult.
---

## Rule 6: Implement Circuit Breaker for Redis Unavailability
---
## Category
Reliability
---
## Rule
Always implement a circuit breaker that falls back to "process without idempotency" (with warning log) when the idempotency store (Redis) is unavailable. Never fail all mutating requests because the idempotency store is down.
---
## Reason
Idempotency is a safety guarantee, not a critical path dependency. If the store is unavailable, degrade gracefully rather than deny all mutations.
---
## Bad Example
```php
public function store(Request $request) {
    $response = $this->idempotencyStore->get($key); // throws if Redis down
}
```
---
## Good Example
```php
if (! $this->idempotencyStore->isAvailable()) {
    Log::warning('Idempotency store unavailable — processing without guarantee');
    return $this->processWithoutIdempotency($request);
}
// Normal idempotency flow
```
---
## Exceptions
Financial/transactional endpoints where duplicate processing is unacceptable may fail-closed instead.
---
## Consequences Of Violation
Complete API outage for mutating endpoints during Redis incident; cascading failures.
---

## Rule 7: Enforce at Middleware Level
---
## Category
Architecture
---
## Rule
Always implement idempotency enforcement as reusable middleware applied to all mutating routes. Never duplicate idempotency logic across individual controllers.
---
## Reason
Middleware guarantees consistent enforcement (required header, key validation, replay detection) across all endpoints without controller-level duplication.
---
## Bad Example
```php
// Idempotency logic duplicated in every controller
class OrderController {
    public function store() { /* idempotency check */ }
}
class PaymentController {
    public function process() { /* idempotency check */ }
}
```
---
## Good Example
```php
// Single middleware applied to all mutating routes
Route::middleware(['auth:api', 'idempotency'])->group(function () {
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/payments', [PaymentController::class, 'process']);
});
```
---
## Exceptions
Internal-only mutating endpoints with guaranteed exactly-once delivery may skip idempotency middleware.
---
## Consequences Of Violation
Inconsistent enforcement; some endpoints miss idempotency; forgotten implementations cause duplicate processing.
