# Idempotency Semantics

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** Idempotency Semantics
- **Last Updated:** 2026-06-02

---

## Executive Summary

Idempotency guarantees that a request can be safely retried without unintended side effects. HTTP defines two related but distinct concepts: safe methods (no server state change) and idempotent methods (same result after one or more identical requests). GET, HEAD, OPTIONS are safe and idempotent. PUT, DELETE are idempotent but not safe. POST and PATCH are neither safe nor idempotent.

For POST endpoints that must be idempotent (payment creation, order placement), APIs implement idempotency keys — a client-generated unique identifier sent as a header (`Idempotency-Key`). The server stores the result keyed by the idempotency key and returns the cached result for duplicate requests. This guarantees exactly-once semantics for POST operations. Laravel does not provide native idempotency key support; implementation requires middleware and a cache store.

---

## Core Concepts

### Safe Methods
A safe method does not modify server state. GET, HEAD, OPTIONS are safe. Safe methods can be prefetched, cached, and automatically retried by clients.

### Idempotent Methods
An idempotent method produces the same server state after N identical requests as after 1 request. PUT, DELETE, GET, HEAD, OPTIONS, and PATCH (under certain conditions) are idempotent.

| Method | Safe | Idempotent | Notes |
|---|---|---|---|
| GET | Yes | Yes | Safe and idempotent by definition |
| HEAD | Yes | Yes | Response headers only, no body |
| OPTIONS | Yes | Yes | Returns allowed methods |
| POST | No | No | Can create side effects each time |
| PUT | No | Yes | Full replacement — same N times = same result |
| PATCH | No | Not by default | Depends on patch format (JSON Merge Patch is not idempotent) |
| DELETE | No | Yes | Second DELETE returns 404, but state unchanged |

### Why POST Is Not Idempotent
`POST /users` creates a new user. Sending the same POST twice creates two users with different IDs. The second request produces a different outcome. This is correct HTTP semantics but problematic for clients that need to retry on network failures.

### Idempotency Keys
An `Idempotency-Key` header provides idempotency for POST operations:

```
POST /orders
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
{"product_id": 42, "quantity": 1}
```

The server:
1. Checks if the idempotency key exists in its cache
2. If exists: returns the cached response (same status, same body)
3. If not exists: processes the request, stores response keyed by the key

### Exactly-Once Semantics
Idempotency keys provide exactly-once execution guarantees:
- First request: processed, result stored
- Duplicate request (same key): cached result returned, no side effects
- Expired key (after TTL): treated as new request (risk of duplication)

---

## Mental Models

### The Vending Machine Model
PUT is like pressing "Coke" on a vending machine — pressing it twice doesn't give you two Cokes (idempotent). POST is like adding money to a vending machine account — pressing "add $5" twice adds $10 (not idempotent).

### The Submit Button Model
A user clicks "Submit Order" twice because the page is slow. The first click creates the order. Without idempotency, the second click creates a duplicate order. An idempotency key ensures the second click returns "order already created" without side effects.

### The Journal Entry Model
Safe methods are read-only lookups (viewing a journal entry). Idempotent methods are like writing "Set balance to $100" — writing it twice produces the same result. Non-idempotent methods are like writing "Add $10" — writing it twice changes the result.

---

## Internal Mechanics

### Idempotency Key Middleware
```php
class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Only for POST/PATCH endpoints
        if (!$request->isMethod('post') && !$request->isMethod('patch')) {
            return $next($request);
        }
        
        $key = $request->header('Idempotency-Key');
        
        if (!$key) {
            return $next($request);
        }
        
        // Check cache for existing response
        $cached = Cache::get("idempotency:$key");
        
        if ($cached) {
            return response($cached['body'], $cached['status'])
                ->withHeaders($cached['headers'] ?? []);
        }
        
        // Process request
        $response = $next($request);
        
        // Store response (only for successful responses)
        if ($response->getStatusCode() < 500) {
            Cache::put("idempotency:$key", [
                'status' => $response->getStatusCode(),
                'body' => $response->getContent(),
                'headers' => $response->headers->all(),
            ], now()->addHours(24));  // TTL for key retention
        }
        
        return $response;
    }
}
```

### PUT Idempotency in Laravel
```php
// PUT is naturally idempotent — same PUT N times = same state
public function replace(Request $request, User $user)
{
    $validated = $request->validate([
        'name' => 'required|string',
        'email' => 'required|email|unique:users,email,'.$user->id,
    ]);
    
    // Full replacement — all fields required
    $user->update($validated);
    
    return new UserResource($user);
}

// Second identical PUT: same validation, same update, same result
```

### DELETE Idempotency
```php
public function destroy(User $user)
{
    $user->delete();  // First DELETE: soft deletes
    // Second DELETE: model not found (route model binding gives 404)
    return response(null, 204);
}

// For soft-deleted models, handle second DELETE explicitly
public function destroy(Request $request, User $user)
{
    if ($user->trashed()) {
        return response(null, 204);  // Already deleted, return success
    }
    
    $user->delete();
    return response(null, 204);
}
```

### PATCH Idempotency via ETag
```php
// Make PATCH idempotent by requiring If-Match
public function partialUpdate(Request $request, User $user)
{
    $etag = $request->header('If-Match');
    
    if (!$etag) {
        return response()->json(['message' => 'If-Match required for idempotency.'], 428);
    }
    
    $currentEtag = '"' . md5($user->updated_at->timestamp) . '"';
    if ($etag !== $currentEtag) {
        return response()->json(['message' => 'Resource modified.'], 412);
    }
    
    $user->update($request->validated());
    return new UserResource($user->fresh());
}
```

---

## Patterns

### Idempotency Key Pattern (POST)
```php
// Controller handles idempotency key
public function store(Request $request)
{
    $key = $request->header('Idempotency-Key');
    
    // Check duplicate
    $existing = Order::where('idempotency_key', $key)->first();
    if ($existing) {
        return new OrderResource($existing);
    }
    
    // Create with key
    $order = Order::create([
        ...$request->validated(),
        'idempotency_key' => $key,
    ]);
    
    return new OrderResource($order);
}
```

### Database-Level Idempotency (Unique Constraints)
```php
// Use database unique constraint on idempotency key
Schema::table('orders', function (Blueprint $table) {
    $table->string('idempotency_key')->nullable()->unique();
});

// Controller attempts creation; handles duplicate
public function store(Request $request)
{
    try {
        $order = Order::create([
            ...$request->validated(),
            'idempotency_key' => $request->header('Idempotency-Key'),
        ]);
        return new OrderResource($order);
    } catch (UniqueConstraintViolationException $e) {
        $existing = Order::where('idempotency_key', $request->header('Idempotency-Key'))->first();
        return new OrderResource($existing);
    }
}
```

### Idempotent PUT Implementation
```php
// PUT — full replacement, naturally idempotent
public function update(Request $request, User $user)
{
    // All fields required for full replacement
    $validated = $request->validate([
        'name' => 'required|string',
        'email' => 'required|email',
    ]);
    
    $user->update($validated);
    return new UserResource($user);
}
```

### Idempotency Key with Expiration
```php
class IdempotencyService
{
    private int $ttl = 86400;  // 24 hours
    
    public function execute(string $key, Closure $callback): mixed
    {
        $cached = Cache::get("idempotency:$key");
        
        if ($cached !== null) {
            return unserialize($cached);
        }
        
        $result = $callback();
        
        Cache::put("idempotency:$key", serialize($result), now()->addSeconds($this->ttl));
        
        return $result;
    }
}
```

---

## Architectural Decisions

### Idempotency Key Requirement
Decide whether idempotency keys are required or optional for POST/PATCH endpoints. Required keys enforce exactly-once semantics but break clients that don't support them. Optional keys provide best-effort idempotency. Stripe requires them. GitHub does not.

### Key Generation (Client vs Server)
Client-generated: the client must generate a unique UUID per request. Server-generated: the server derives a key from request content (hash of body). Client-generated is more reliable but requires client implementation. Server-generated works with existing clients but may produce false positives.

### Storage Backend for Idempotency Keys
- **Redis/Memcached:** Fast, TTL-based expiry, volatile (risk of data loss)
- **Database:** Durable, consistent, but slower for lookup
- **Combined:** Redis for fast path, database for durability after processing

### Response Caching for Idempotency Keys
Store the full response (status, body, headers) for repeat requests. Decide: cache all responses or only successful ones? Caching error responses prevents the client from retrying after transient errors with the same key. Stripe caches all responses, including 500s, to prevent duplicate processing after temporary failures.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Idempotency keys: Exactly-once semantics for POST | Idempotency keys: Storage for cached responses | Adds infrastructure (Redis) and latency (cache lookup) |
| PUT idempotency: Natural retry safety | PUT requires full resource representation | Higher bandwidth for updates |
| DELETE idempotency: Safe retry on deletion | Second DELETE returns 404 (may confuse clients) | Clients must understand 404 after DELETE is success |
| Database-level idempotency: Atomic, reliable | Database-level: Insert-then-catch pattern | Slower inserts due to unique index check |

---

## Performance Considerations

### Idempotency Key Lookup Overhead
Each idempotency-protected request requires a cache lookup (~1-5ms with Redis). For high-traffic endpoints, this adds measurable latency. Consider a local in-memory cache (L1) before Redis (L2) for hot keys.

### Storage Cleanup
Idempotency keys accumulate in the cache. Without TTL-based expiry, storage grows unbounded. Set TTL based on the maximum retry window for clients (typically 24 hours for payment systems).

### Payload Hashing for Server-Generated Keys
Computing a hash of the request body for server-generated idempotency keys adds CPU overhead proportional to body size. Use a streaming hash to avoid loading the entire body into memory for large payloads.

---

## Production Considerations

### TTL Strategy
Idempotency key TTL determines the retry window for clients. Too short: clients can't retry after transient failures. Too long: storage grows. Common TTLs: 24 hours (Stripe), 1 hour (internal APIs). Align with the business requirement.

### Key Collision Handling
Two different requests may generate the same idempotency key (extremely unlikely with UUIDs, but possible with sequential client-generated keys). Use unique constraints on the idempotency key column to catch collisions.

### Monitoring and Alerting
Monitor idempotency key collision rate. A spike may indicate a buggy client or an attack (replay attack). Set up alerts when duplicate key rates exceed the expected threshold.

### Idempotency Across Retries
When a client retries with the same key but different request body, the server must return the original response, not process the new body. Validate that the key matches the original request and log anomalies for security review.

---

## Common Mistakes

### Confusing Safe and Idempotent
Why it happens: Both terms relate to side effects. Why it's harmful: Developers may think GET can't be safely used due to side effects (violating safe), or think DELETE needs special handling (it's already idempotent). Better approach: Remember: safe = no state change at all; idempotent = same result after N tries.

### Not Implementing Idempotency for Critical POST Endpoints
Why it happens: It's extra work — middleware, storage, testing. Why it's harmful: Network failures cause duplicate orders, duplicate payments, duplicate account creation. Better approach: Implement idempotency keys for any endpoint that creates billable or identity-impacting resources.

### Ignoring PATCH Non-Idempotency
Why it happens: PATCH is "update" so it "feels" idempotent. Why it's harmful: `PATCH /users/42 {"count": "increment:1"}` increments the counter each time — not idempotent. Better approach: Use PUT for full replacement or require If-Match for PATCH idempotency.

### Storing Idempotency Keys Without TTL
Why it happens: "We need them forever for audit." Why it's harmful: Storage grows unbounded. Better approach: Keep keys in fast cache (Redis) with TTL, archive to long-term storage (database) for audit trails.

### Not Handling 5xx Response Caching Correctly
Why it happens: Only successful responses are cached. Why it's harmful: A transient 500 causes the client to retry with the same key, but the cached 500 is returned — the request is never retried. Better approach: Cache all responses (including errors) but allow key reset after a timeout.

---

## Failure Modes

### Idempotency Key Cache Eviction
If the idempotency key cache is evicted (Redis restart, memory pressure), duplicate requests are processed as new, causing duplicates. Use persistent storage for in-flight keys or accept the risk window.

### Race Condition on First Request
Two identical requests with the same idempotency key arrive simultaneously. Both check the cache, find no entry, and both proceed. Both create the resource. Use atomic cache operations (`Cache::add()`, `Cache::lock()`) to prevent this.

### Key Reuse After TTL Expiry
Client generates key K for request A. The TTL expires. Client generates key K for request B (different operation). The cache has no entry, so request B proceeds. This is correct behavior but may surprise clients that expect keys to be permanent.

---

## Ecosystem Usage

### Stripe API
Stripe requires `Idempotency-Key` header for all POST requests. Stripe stores idempotency keys for 24 hours. Stripe returns the same response for duplicate keys, including the same HTTP status code and body. Stripe's idempotency is the reference implementation.

### Shopify API
Shopify uses `X-Shopify-Shop-Api-Call-Limit` and idempotency via unique order IDs. Shopify's GraphQL API uses a combination of operation name and variables for idempotency.

### PayPal API
PayPal uses `PayPal-Request-Id` header for idempotency on POST/PATCH operations. Stored for 48 hours. Returns 409 Conflict if the same request-id is used with a different request (protects against accidental reuse).

---

## Related Knowledge Units

### Prerequisites
- HTTP Method Semantics — Safe vs idempotent distinction
- HTTP Status Code Selection — 409, 412, 428 for idempotency errors

### Related Topics
- Conditional Requests — If-Match/If-None-Match for idempotent PATCH
- Resourceful Routing — Method idempotency in CRUD operations
- REST Architectural Constraints — Cacheability and idempotency interaction

### Advanced Follow-up Topics
- Eventual Consistency — Idempotency in distributed systems
- Saga Pattern / Distributed Transactions — Idempotency across microservices

---

## Research Notes

### Source Analysis
- RFC 7231 — HTTP/1.1 Semantics and Content, Section 4.2.2 (Idempotent Methods)
- RFC 7231 — Section 4.2.1 (Safe Methods)
- Stripe API Reference — Idempotent Requests (reference implementation)

### Key Insight
Idempotency is a contract between client and server. The server guarantees that N identical requests produce the same server state as 1 request. This does not mean the response is the same — DELETE returns 200 on first call and 404 on second, but the server state is identical (resource deleted).

### Version-Specific Notes
- Laravel 10-13: No native idempotency key support
- Redis Cache driver is recommended for idempotency key storage
- `Cache::add()` method provides atomic "set if not exists" for race condition prevention
