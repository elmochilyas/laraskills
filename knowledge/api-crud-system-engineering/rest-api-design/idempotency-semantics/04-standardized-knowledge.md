# Idempotency Semantics

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: idempotency-semantics
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Idempotency guarantees that a request can be safely retried without unintended side effects. HTTP defines two related but distinct concepts: safe methods (no server state change) and idempotent methods (same result after one or more identical requests). GET, HEAD, OPTIONS are safe and idempotent. PUT, DELETE are idempotent but not safe. POST and PATCH are neither safe nor idempotent.

For POST endpoints that must be idempotent (payment creation, order placement), APIs implement idempotency keys — a client-generated unique identifier sent as an `Idempotency-Key` header. The server stores the result keyed by the idempotency key and returns the cached result for duplicate requests, providing exactly-once execution semantics.

## Core Concepts
- **Safe Methods**: No server state change. GET, HEAD, OPTIONS. Can be prefetched, cached, and automatically retried.
- **Idempotent Methods**: Same server state after N identical requests as after 1. GET, PUT, DELETE, HEAD, OPTIONS.
- **Non-Idempotent POST**: `POST /users` creates a new user each time — two identical POSTs create two users.
- **Idempotency Key**: Client-generated UUID sent via `Idempotency-Key` header. Server stores response keyed by this value.
- **Exactly-Once Semantics**: First request processes and stores result. Duplicate request with same key returns cached result.
- **TTL Strategy**: Idempotency keys expire after a set period (24 hours is common). After expiry, a duplicate key is treated as a new request.
- **Race Condition Prevention**: Two identical requests arriving simultaneously both check cache and find nothing. Use atomic `Cache::add()` or `Cache::lock()`.

## When To Use
- POST endpoints that create billable resources (payments, charges, invoices)
- POST endpoints that create identity-impacting resources (account creation, user registration)
- Any POST endpoint where duplicate execution would cause business harm
- PATCH endpoints where idempotency is required (use with If-Match for concurrency)
- Distributed systems where retry is expected due to network unreliability

## When NOT To Use
- GET endpoints (already idempotent by HTTP definition)
- PUT/DELETE endpoints (already idempotent by HTTP definition)
- Read-only or append-only POST endpoints where duplicates are harmless
- Low-risk POST endpoints where the cost of implementing idempotency exceeds the cost of occasional duplicates
- Endpoints where exactly-once semantics are provided by the database (unique constraints)

## Best Practices (WHY)
- **Implement idempotency keys for critical POST endpoints**: Network failures cause duplicate orders, duplicate payments, duplicate account creation. The cost of idempotency middleware is far less than the cost of handling duplicates.
- **Cache all responses, including errors**: If only successful responses are cached, a transient 500 causes the client to retry with the same key and receive the same 500. Cache error responses too, with the option to reset after a timeout.
- **Use atomic cache operations to prevent race conditions**: `Cache::add()` (set if not exists) or `Cache::lock()` ensures that two simultaneous requests with the same key don't both process.
- **Set TTL based on maximum retry window**: 24 hours is the standard (used by Stripe). Too short: clients can't retry after transient failures. Too long: storage grows unbounded.
- **Store full response (status, body, headers)**: When the client retries with the same key, return exactly the same response — same status code, same body, same headers.

## Architecture Guidelines
- Implement idempotency as middleware — it's orthogonal to controller logic and applies across endpoints.
- Use Redis for idempotency key storage (fast, TTL-based expiry). Use the database for audit trails after processing.
- Handle key collision: two different requests with the same key should fail with 409 Conflict if the request body differs.
- Accept `Idempotency-Key` header only on POST and PATCH endpoints — GET/PUT/DELETE are already idempotent.
- Document the idempotency key requirement in OpenAPI — clients need to know they must generate UUIDs.

## Performance
- Each idempotency-protected request requires a cache lookup — ~1-5ms with Redis. Consider in-memory cache for hot keys.
- TTL-based expiry prevents unbounded storage growth. 24-hour TTL keeps storage proportional to 24-hour request volume.
- Payload hashing for server-generated keys adds CPU overhead proportional to body size — use streaming hashes for large payloads.
- `Cache::add()` atomic check is fast (~1ms) but requires Redis/Memcached support.

## Security
- Idempotency keys prevent duplicate processing but do not authenticate requests — implement auth separately.
- Key collision (same key, different request body) may indicate a buggy client or replay attack — log and monitor.
- If an idempotency key is reused with a different request body after the original request completed, return 409 Conflict.
- Never accept idempotency keys from unauthenticated requests — a malicious client could pre-seed keys to block legitimate requests.
- Monitor idempotency key collision rate — a spike indicates a buggy client or potential attack.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No idempotency for critical POST | POST endpoints that create orders/payments without idempotency | It's extra work | Network failures cause duplicate orders, duplicate payments | Implement idempotency keys for any billable or identity-impacting resource creation |
| Not caching error responses | Only caching 2xx responses | Assumption that only successes matter | Client retries with same key after transient 500, receives cached 500 | Cache all responses (including errors); allow key reset after timeout |
| Race condition on first request | Two identical requests arrive simultaneously, both check cache, both process | Missing atomic cache operation | Duplicate resource created despite idempotency key | Use `Cache::add()` or `Cache::lock()` for atomic first-write |
| Storage without TTL | Storing idempotency keys forever | "We need them for audit" | Storage grows unbounded | Redis with TTL for fast lookup; archive to database for audit |
| Confusing safe and idempotent | Treating all safe methods as always safe in implementation | Terminology confusion | Implemented side effects on GET (unsafe) | Remember: safe = no state change; idempotent = same result after N tries |
| PATCH without idempotency | Assuming PATCH is idempotent by nature | "Update" feels idempotent | Incrementing counters, appending arrays produce different results | Use If-Match with PATCH or use PUT for idempotent updates |

## Anti-Patterns
- **Idempotency on GET**: GET is already idempotent by HTTP definition — no header needed.
- **Server-Generated Keys Only**: Deriving keys from request body hash — can produce false positives when the same data is sent for different intents.
- **Idempotency Without Expiry**: Keys stored indefinitely — storage grows unbounded.
- **Per-Controller Idempotency**: Each controller implements idempotency check independently. Use middleware.
- **Accepting Key but Ignoring It**: Accepting the header but not actually checking for duplicates.

## Examples
```php
// Idempotency middleware
class IdempotencyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->isMethod('post') && !$request->isMethod('patch')) {
            return $next($request);
        }

        $key = $request->header('Idempotency-Key');
        if (!$key) {
            return $next($request);
        }

        $cached = Cache::get("idempotency:$key");
        if ($cached) {
            return response($cached['body'], $cached['status'])
                ->withHeaders($cached['headers'] ?? []);
        }

        $response = $next($request);

        if ($response->getStatusCode() < 500) {
            Cache::put("idempotency:$key", [
                'status' => $response->getStatusCode(),
                'body' => $response->getContent(),
                'headers' => $response->headers->all(),
            ], now()->addHours(24));
        }

        return $response;
    }
}

// Database-level idempotency
Schema::table('orders', function (Blueprint $table) {
    $table->string('idempotency_key')->nullable()->unique();
});

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

## Related Topics
- **Prerequisites**: http-method-semantics, http-status-code-selection
- **Related**: conditional-requests, resourceful-routing, rest-architectural-constraints
- **Advanced**: eventual-consistency, saga-pattern-distributed-transactions

## AI Agent Notes
- Implement idempotency keys for all POST endpoints that create billable or identity-impacting resources.
- Use `Cache::add()` for atomic first-write to prevent race conditions.
- Cache full response (status, body, headers) — including error responses.
- Set TTL to 24 hours for idempotency key storage.
- Use middleware for idempotency — keep it cross-cutting, not per-controller.
- Accept `Idempotency-Key` header only on POST and PATCH endpoints.

## Verification
- POST endpoints that create billable/identity resources support `Idempotency-Key` header.
- First request with a key processes normally; second request with same key returns cached response.
- Race condition handling uses `Cache::add()` or `Cache::lock()` for atomic operations.
- All responses (including 4xx/5xx) are cached for idempotency key reuse.
- Keys expire after the configured TTL (default 24 hours).
- Same key with different request body returns 409 Conflict.
- Idempotency key storage uses Redis with TTL; audit trail stored in database.
