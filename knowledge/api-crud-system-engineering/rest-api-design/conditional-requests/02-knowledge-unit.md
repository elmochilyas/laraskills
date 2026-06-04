# Conditional Requests

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** Conditional Requests
- **Last Updated:** 2026-06-02

---

## Executive Summary

Conditional requests use HTTP headers to make requests dependent on resource state. Clients can avoid re-downloading unchanged resources (optimistic caching) or prevent lost updates (optimistic concurrency). The mechanism uses ETags (entity tags) and timestamps (Last-Modified/If-Modified-Since) as condition indicators.

Two primary use cases exist: cache validation (GET with `If-None-Match` returns 304 Not Modified) and optimistic concurrency (PUT/PATCH with `If-Match` returns 412 Precondition Failed on conflict). Laravel provides ETag generation support via `SetCacheHeaders` middleware, but full conditional request handling for write operations requires custom middleware or manual header parsing.

---

## Core Concepts

### ETags (Entity Tags)
An ETag is an opaque identifier for a specific version of a resource. It can be:
- **Strong ETag:** `"abc123"` — byte-for-byte identical representation
- **Weak ETag:** `W/"abc123"` — semantically equivalent representation

Strong ETags are used for byte-range requests and caching. Weak ETags are used for cache validation when byte-level equality isn't required.

### Conditional Headers

| Header | Condition | With ETag | With Timestamp | Used With |
|---|---|---|---|---|
| `If-Match` | "Only if ETag matches" | `If-Match: "abc123"` | — | PUT, PATCH, DELETE |
| `If-None-Match` | "Only if ETag doesn't match" | `If-None-Match: "abc123"` | — | GET (cache validation) |
| `If-Modified-Since` | "Only if modified after" | — | `If-Modified-Since: Wed, 01 Jun 2026 12:00:00 GMT` | GET (cache validation) |
| `If-Unmodified-Since` | "Only if not modified after" | — | `If-Unmodified-Since: Wed, 01 Jun 2026 12:00:00 GMT` | PUT, PATCH, DELETE |
| `If-Range` | "Only if unchanged, else send full" | `If-Range: "abc123"` | `If-Range: Wed, ...` | Range requests |

### Response Headers for Conditionality

| Header | Purpose | Example |
|---|---|---|
| `ETag` | Resource version identifier | `ETag: "abc123"` |
| `Last-Modified` | Resource modification timestamp | `Last-Modified: Wed, 01 Jun 2026 12:00:00 GMT` |
| `Cache-Control` | Caching policy | `Cache-Control: no-cache` |
| `Vary` | Which headers vary the representation | `Vary: Accept-Encoding` |

### Cache Validation Flow (GET)
1. Client sends `GET /users/42` (first request)
2. Server responds 200 with `ETag: "abc123"` and `Last-Modified: ...`
3. Client stores ETag and timestamp
4. Client sends `GET /users/42` with `If-None-Match: "abc123"`
5. Resource unchanged: server responds 304 Not Modified (no body)
6. Resource changed: server responds 200 with new ETag

### Optimistic Concurrency Flow (PUT/PATCH)
1. Client reads resource: `GET /users/42` → `ETag: "abc123"`
2. Client modifies and sends `PUT /users/42` with `If-Match: "abc123"`
3. No concurrent modification: server updates, responds 200
4. Concurrent modification: server responds 412 Precondition Failed
5. Client re-reads resource and retries

---

## Mental Models

### The Library Book Model
ETag is like a book's edition number. `If-None-Match` says "give me the book only if it's a different edition." `If-Match` says "update this book only if it's still edition abc123 — don't overwrite if someone else has updated it."

### The Git Analogy
ETag is like a commit hash. `If-None-Match` is like `git fetch` — "tell me if there's something new." `If-Match` is like checking `git status` before pushing — "make sure my base is still current."

### The Office Document Model
Two people open the same document. Person A saves with `If-Match: version1`. Person B tries to save with `If-Match: version1` but the server now has version2. Person B gets "conflict — refresh first" (412). This is the optimistic concurrency pattern.

---

## Internal Mechanics

### Laravel ETag Middleware (SetCacheHeaders)
```php
// In route
Route::get('users/{user}', [UserController::class, 'show'])
    ->middleware('cache.headers:public;max_age=3600;etag');
```

The `SetCacheHeaders` middleware (`\Illuminate\Http\Middleware\SetCacheHeaders`) generates an ETag by MD5-hashing the response content. It:
1. Stores the original response content
2. Computes MD5 hash as ETag
3. Checks `If-None-Match` against computed ETag
4. If match: aborts with 304, no body
5. If no match: adds `ETag` header to response

### Custom ETag Validation for Writes
```php
class OptimisticConcurrencyMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $etag = $request->header('If-Match');
        
        if (!$etag) {
            return $next($request);
        }
        
        // Resolve model from route binding
        $model = $request->route()->parameter('user');
        $currentEtag = $this->computeEtag($model);
        
        if ($etag !== $currentEtag) {
            return response()->json([
                'message' => 'Resource modified since last read.',
                'current_etag' => $currentEtag,
            ], 412);
        }
        
        return $next($request);
    }
    
    private function computeEtag($model): string
    {
        return '"' . md5($model->updated_at->timestamp) . '"';
    }
}
```

### Last-Modified via Model Timestamps
```php
// In controller
public function show(User $user)
{
    return response()->json(new UserResource($user))
        ->setLastModified($user->updated_at);
}

// With If-Modified-Since check
public function show(Request $request, User $user)
{
    $lastModified = $user->updated_at;
    
    if ($request->header('If-Modified-Since')) {
        $ifModifiedSince = new \DateTime($request->header('If-Modified-Since'));
        if ($lastModified <= $ifModifiedSince) {
            return response(null, 304);
        }
    }
    
    return response()->json(new UserResource($user))
        ->setLastModified($lastModified);
}
```

---

## Patterns

### GET Conditional Cache Pattern
```php
// Resource with ETag support
public function show(Request $request, User $user)
{
    $response = response()->json(new UserResource($user));
    
    $etag = '"' . md5($user->updated_at->timestamp) . '"';
    $response->setEtag($etag);
    $response->setLastModified($user->updated_at);
    
    return $response;
}

// Client receives 304 automatically if middleware handles If-None-Match
```

### PUT/PATCH Optimistic Concurrency Pattern
```php
public function update(Request $request, User $user)
{
    $etag = $request->header('If-Match');
    
    if ($etag) {
        $currentEtag = '"' . md5($user->updated_at->timestamp) . '"';
        if ($etag !== $currentEtag) {
            return response()->json([
                'message' => 'Stale resource version. Re-fetch and retry.',
            ], 412);
        }
    }
    
    $user->update($request->validated());
    
    $response = response()->json(new UserResource($user->fresh()));
    $response->setEtag('"' . md5($user->fresh()->updated_at->timestamp) . '"');
    
    return $response;
}
```

### DELETE Precondition Pattern
```php
public function destroy(Request $request, User $user)
{
    $etag = $request->header('If-Match');
    
    if ($etag) {
        $currentEtag = '"' . md5($user->updated_at->timestamp) . '"';
        if ($etag !== $currentEtag) {
            return response()->json(['message' => 'Resource state changed.'], 412);
        }
    }
    
    $user->delete();
    return response(null, 204);
}
```

### Weak ETag for Semantically Equivalent Representations
```php
// Weak ETag: content changed but meaning is the same
// Format: W/"<etag-value>"
$etag = 'W/"' . md5($user->updated_at->timestamp) . '"';
return response()->json($data)->setEtag($etag);
```

---

## Architectural Decisions

### ETag vs Last-Modified
**ETag:** More precise (detects content changes even if timestamp is same), supports concurrent modification detection, required for write conditionals. **Last-Modified:** Simpler, human-readable, sufficient for read cache validation. Recommendation: Implement both — ETag for writes and precise caching, Last-Modified for cache validation.

### Strong vs Weak ETags
Strong ETags require byte-for-byte equality. If the server adds whitespace or formatting, the ETag changes. Weak ETags allow semantic equivalence. Recommendation: Use strong ETags for binary content (images, files), weak ETags for JSON responses where formatting differences are irrelevant.

### Server-Generated vs Client-Supplied ETags
Server-generated: server computes ETag from resource state. Client-supplied: client sends ETag it received earlier. Both are valid but server-generated is authoritative. Never trust client-supplied ETags for write operations without validation against current state.

### Required vs Optional Conditionals
Making `If-Match` required for all writes (as Stripe does) enforces optimistic concurrency but breaks simple clients. Making it optional (would recommend but don't require) is more compatible. Decision: require for critical resources (payments, orders), optional for read-heavy resources.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| 304 responses save bandwidth on no-change reads | Computing ETags adds overhead per request | Cache validation traffic may exceed 200 response savings |
| Optimistic concurrency prevents lost updates | Clients must implement retry logic after 412 | Increases client complexity |
| Conditional writes enforce data integrity | Writes fail more often under contention | May cause user frustration during concurrent edits |
| Last-Modified is easy to implement | Last-Modified resolution is 1 second | Concurrent modifications within 1 second may not be detected |

---

## Performance Considerations

### ETag Computation Overhead
Computing an MD5 hash of the full response body for each request adds ~1-5µs per KB of response. For large responses (100KB+), ETag computation time adds up. Alternative: compute ETag from model `updated_at` alone (lighter, less precise).

### 304 Response Optimization
304 responses skip the response body entirely. For list endpoints returning 100 items (50KB response), a 304 saves 50KB of bandwidth per request. For high-traffic endpoints, this dramatically reduces bandwidth costs.

### Stateless ETag Validation
ETags must be recomputed on every request — there is no session-based ETag cache. For resources with expensive ETag computation, use a caching layer (Redis) to store computed ETags keyed by resource identifier + version.

---

## Production Considerations

### ETag Stability
ETags must change when the representation changes. If the server adds a field to the response, the ETag changes even if the underlying data is the same. This is correct behavior — the representation has changed. Clients will re-fetch, which is the intended outcome.

### Last-Modified Clock Synchronization
`Last-Modified` relies on server time. If servers have different clocks (multi-datacenter), conditional requests may behave incorrectly. Use ETags (which are content-relative, not time-relative) instead of or in addition to Last-Modified.

### Vary Header Configuration
When content negotiation affects the response (gzip, different formats), set `Vary: Accept, Accept-Encoding` to tell caches to store different versions per header value. Without `Vary`, a JSON response may be served to a client that requested XML.

---

## Common Mistakes

### ETag Generation Without Content Hash
Why it happens: Developers use a fixed string or request-based hash instead of content-based hash. Why it's harmful: The ETag doesn't change when content changes, or changes when content doesn't change. Better approach: Use a hash of the content or of `updated_at` timestamp.

### Not Handling 412 Precondition Failed Gracefully
Why it happens: Focus is on the success path. Why it's harmful: Clients that receive 412 with no explanation cannot resolve the conflict. Better approach: Return the current ETag and current resource state in the 412 response so clients can merge or retry.

### Implementing If-Match on All Endpoints Without Consideration
Why it happens: "Optimistic concurrency is good, so require it everywhere." Why it's harmful: Increases latency (two requests for every write) for simple resources that rarely conflict. Better approach: Require If-Match only for resources with high contention (orders, payments) or long edit windows.

### Forgetting to Update ETag After Write Operations
Why it happens: The ETag is set before the model is refreshed. Why it's harmful: The returned ETag matches the old state, causing the client's next conditional request to incorrectly detect a match. Better approach: Always `fresh()` the model before attaching the ETag to write responses.

---

## Failure Modes

### Lost Update Without If-Match
Two clients simultaneously PATCH `/users/42`. Client A sends `{name: "Alice"}`. Client B sends `{email: "bob@example.com"}`. Without `If-Match`, the second update overwrites the first. Both name and email updates are lost. This is the classic lost update problem.

### Thundering Herd on Cache Invalidation
A resource is invalidated (state changes). All clients simultaneously re-fetch with no cached state, overwhelming the server. Use staggered cache invalidation or progressive ETag updates.

### Weak ETag False Positives
Weak ETags allow semantically equivalent but byte-different content. A whitespace change in the response template produces a different HTTP response body but the same weak ETag. This is correct behavior but can confuse monitoring systems that check exact response equality.

---

## Ecosystem Usage

### GitHub API
GitHub uses ETags on all API responses. GitHub's ETags are strong, based on response content hash. GitHub returns `ETag` header on 200 responses and validates with `If-None-Match` on subsequent requests. GitHub does not require `If-Match` for writes.

### Stripe API
Stripe uses ETags for optimistic locking on write operations. Stripe returns the current ETag in response headers. If-Match is used for writes to critical resources (charges, refunds). Stripe also uses Idempotency-Key headers (separate mechanism) to prevent duplicate writes.

### Google APIs
Google uses `ETag` and `If-Match`/`If-None-Match` consistently across APIs. Google's ETags are computed from resource versions. Google returns 412 Precondition Failed with a structured error body that includes the current ETag.

---

## Related Knowledge Units

### Prerequisites
- HTTP Method Semantics — Which methods support conditional requests
- HTTP Status Code Selection — 304, 412 responses

### Related Topics
- Idempotency Semantics — Complementary mechanism for preventing duplicate writes
- REST Architectural Constraints — Cacheability constraint
- Response Structures — ETag and Last-Modified header patterns

### Advanced Follow-up Topics
- Distributed Caching Strategies — ETag-based cache invalidation
- Event Sourcing / CQRS — Version-based concurrency at application level

---

## Research Notes

### Source Analysis
- RFC 7232 — HTTP/1.1 Conditional Requests (defines If-Match, If-None-Match, If-Modified-Since, If-Unmodified-Since)
- RFC 7234 — HTTP/1.1 Caching (defines ETag and Last-Modified response headers)

### Key Insight
Conditional requests solve two distinct problems: cache validation (read optimization) and optimistic concurrency (write safety). These are often conflated. The implementation for each is different — ETags for writes must be content-based and stable, while ETags for reads can be any hash. Separate the concerns.

### Version-Specific Notes
- Laravel 10-13: `SetCacheHeaders` middleware supports ETag generation
- No native If-Match validation for write operations — must be custom middleware
- `response()->setEtag()` and `response()->setLastModified()` available in all versions
