# Conditional Requests

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: conditional-requests
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Compute ETags From Model Timestamps
---
## Category
Performance
---
## Rule
Always compute ETags from model timestamps (`md5($model->updated_at->timestamp)`) instead of hashing the full response body.
---
## Reason
Full-content hashing adds ~1-5µs per KB of response. Model-timestamp hashing costs ~0.01ms — two orders of magnitude faster. For 100KB responses the difference is measurable at scale.
---
## Bad Example
```php
$response = response()->json($data);
$etag = '"' . md5($response->getContent()) . '"'; // hashes full serialized body
```

## Good Example
```php
$response = response()->json(new UserResource($user));
$etag = '"' . md5($user->updated_at->timestamp) . '"';
$response->setEtag($etag);
```

## Exceptions
When the resource representation changes without the timestamp changing (e.g., computed fields or conditional serialization). In those cases, hash the computed representation key instead.

## Consequences Of Violation
Increased CPU usage on every request; potential timeout issues on large payloads; unnecessary latency on cache-hit responses.
---

## Return ETag and Last-Modified On Every GET Response
---
## Category
Design
---
## Rule
Always include `ETag` and `Last-Modified` headers on every GET response, even for dynamically generated resources.
---
## Reason
ETags enable conditional requests (304 Not Modified) that save 99% of bandwidth on unchanged resources. Last-Modified provides a simpler fallback for clients that don't support ETags. Without these headers, clients must re-download the full response on every request.
---
## Bad Example
```php
return response()->json($data);
// No ETag or Last-Modified headers set
```

## Good Example
```php
return response()->json(new UserResource($user))
    ->setEtag('"' . md5($user->updated_at->timestamp) . '"')
    ->setLastModified($user->updated_at);
```

## Exceptions
Streaming responses where the content is never the same twice (real-time events, logs). Set `Last-Modified` to the current time and skip ETag.

## Consequences Of Violation
Increased bandwidth consumption; no CDN cache efficiency; clients cannot optimize re-fetch logic; mobile clients consume unnecessary data.
---

## Use If-Match For Write Endpoints With Concurrent Modification Risk
---
## Category
Reliability
---
## Rule
Always require `If-Match` header on PUT/PATCH/DELETE endpoints for resources with concurrent modification risk, returning 412 Precondition Failed on mismatch.
---
## Reason
Without If-Match, two clients can read the same resource, both modify it, and the second write silently overwrites the first — the classic lost-update problem. If-Match ensures the second client's write is rejected with 412, forcing a re-read and merge.
---
## Bad Example
```php
public function update(Request $request, User $user)
{
    $user->update($request->validated());
    return new UserResource($user);
    // No If-Match check — last write wins silently
}
```

## Good Example
```php
public function update(Request $request, User $user)
{
    $etag = $request->header('If-Match');
    $currentEtag = '"' . md5($user->updated_at->timestamp) . '"';
    if ($etag && $etag !== $currentEtag) {
        return response()->json([
            'message' => 'Resource modified by another request.',
            'current_etag' => $currentEtag,
        ], 412);
    }
    $user->update($request->validated());
    return new UserResource($user->fresh());
}
```

## Exceptions
Append-only resources (logs, events), resources with database-level optimistic locking, and endpoints where the last-write-wins policy is explicitly documented and acceptable.

## Consequences Of Violation
Silent data loss from concurrent updates; corrupted state in high-contention resources; difficult-to-debug business logic errors; client retries succeed but produce incorrect state.
---

## Include Current ETag In 412 Response Body
---
## Category
Maintainability
---
## Rule
Always include the current resource ETag and state in the body of 412 Precondition Failed responses so the client can retry without an additional GET request.
---
## Reason
A 412 response puts the client in an unknown state — they know their version is stale but don't know the current version. Including the current ETag and resource state lets the client merge changes or immediately retry, eliminating a round-trip.
---
## Bad Example
```php
return response()->json(['message' => 'Conflict'], 412);
// No current ETag or resource state — client must re-fetch to retry
```

## Good Example
```php
return response()->json([
    'message' => 'Resource modified.',
    'current_etag' => $currentEtag,
    'data' => new UserResource($user->fresh()),
], 412);
```

## Exceptions
When the 412 is due to a precondition that doesn't involve resource state (e.g., custom preconditions unrelated to versioning). In those cases, include only relevant context.

## Consequences Of Violation
Extra round-trip for every conflict resolution; degraded user experience for high-contention resources; increased server load from conflict-induced re-fetches.
---

## Refresh Model Before Setting ETag After Write
---
## Category
Reliability
---
## Rule
Always call `fresh()` on the model before setting the ETag in write responses (POST, PUT, PATCH) — otherwise the ETag reflects the old state.
---
## Reason
After `$user->update(...)`, the in-memory model still has the old `updated_at` value. If you compute the ETag before refreshing, the returned ETag matches the pre-write state. The next conditional request from the same client will incorrectly detect a match when the resource has actually changed.
---
## Bad Example
```php
$user->update($request->validated());
return response()->json(new UserResource($user))
    ->setEtag('"' . md5($user->updated_at->timestamp) . '"'); // stale ETag!
```

## Good Example
```php
$user->update($request->validated());
$user = $user->fresh();
return response()->json(new UserResource($user))
    ->setEtag('"' . md5($user->updated_at->timestamp) . '"');
```

## Exceptions
When using `$model->refresh()` instead of `$model->fresh()` (both reload from DB). When the response serializes computed attributes that don't exist on the model — still call `fresh()` for the base data.

## Consequences Of Violation
Stale ETags returned to clients; conditional requests incorrectly return 304 when resource has changed; clients don't see updates until their cached ETag expires naturally.
---

## Apply Conditional Logic To HEAD Requests
---
## Category
Design
---
## Rule
Always apply the same conditional request logic (If-None-Match, If-Modified-Since) to HEAD requests as to GET requests for the same resource.
---
## Reason
HEAD requests should return the same headers as GET without the body. If GET returns 304 with conditional headers, HEAD must also return 304. Inconsistent behavior breaks clients that use HEAD for cache validation or resource existence checks.
---
## Bad Example
```php
public function show(User $user)
{
    if ($request->isMethod('head')) {
        return response()->noContent(); // always returns 200
    }
    // conditional GET logic below...
}
```

## Good Example
```php
// Laravel automatically handles HEAD via GET route — middleware applies uniformly
// No special HEAD handling needed when using same controller method
Route::get('users/{user}', [UserController::class, 'show']);
```

## Exceptions
When HEAD responses intentionally differ from GET headers (e.g., omitting response-size headers for performance). This is rare and must be explicitly documented.

## Consequences Of Violation
HEAD requests bypass caching; resource existence checks give false results; monitoring tools that use HEAD for health checks get inaccurate data.
---

## Set Vary Header For Content-Negotiated Responses
---
## Category
Performance
---
## Rule
Always set the `Vary` header on responses that vary based on request headers (Accept, Accept-Encoding, Authorization) so caches store the correct variant for each client.
---
## Reason
Without `Vary`, caches serve the same cached response to all clients regardless of their request headers. A client that sent `Accept: application/xml` may receive the JSON variant cached from a previous request, causing parse failures.
---
## Bad Example
```php
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=3600');
// No Vary header — cache may serve JSON to XML-requesting clients
```

## Good Example
```php
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=3600')
    ->header('Vary', 'Accept');
```

## Exceptions
When all responses are identical regardless of request headers (JSON-only API with no Accept-based differentiation). Even then, consider adding `Vary: Accept` for correctness.

## Consequences Of Violation
Wrong response format served to clients; cache poisoning across format variants; difficult-to-diagnose client-side parse errors that appear intermittently.
---

## Avoid ETags On POST Endpoints
---
## Category
Architecture
---
## Rule
Never add ETag support to POST endpoints — POST is not cacheable by HTTP definition and ETags provide no value.
---
## Reason
HTTP intermediaries do not cache POST responses by default. ETags are cache validators — they only provide benefit on cacheable methods (GET, HEAD). Adding ETags to POST adds computation overhead and response header bloat with zero caching benefit.
---
## Bad Example
```php
public function store(Request $request)
{
    $user = User::create($request->validated());
    return response()->json(new UserResource($user), 201)
        ->setEtag('"' . md5($user->updated_at->timestamp) . '"'); // wasted computation
}
```

## Good Example
```php
public function store(Request $request)
{
    $user = User::create($request->validated());
    return response()->json(new UserResource($user), 201);
    // No ETag on POST — not cacheable
}
```

## Exceptions
When explicitly enabling POST response caching via `Cache-Control: public` and `Vary` headers for specific use cases (e.g., search POST responses that are cacheable). Document this exception clearly.

## Consequences Of Violation
Wasted CPU cycles computing ETags that are never used; response header bloat; misleading client expectation that POST responses can be conditionally re-fetched.
---

## Cache Computed ETags In Redis For Expensive Resources
---
## Category
Performance
---
## Rule
Cache computed ETags in Redis with a TTL matching the resource's cache lifetime for resources with expensive serialization or computation.
---
## Reason
ETags must be recomputed on every request. If the resource requires expensive computation (transformation pipelines, aggregation queries, external API calls), computing the ETag duplicates that cost. Caching the ETag in Redis eliminates redundant computation for the duration of the cache TTL.
---
## Bad Example
```php
$report = $this->generateExpensiveReport($user);
$etag = '"' . md5(serialize($report)) . '"'; // recomputes report to get ETag
return response()->json($report)->setEtag($etag);
```

## Good Example
```php
$etag = Cache::remember("etag:report:{$user->id}", 3600, function () {
    $report = $this->generateExpensiveReport($user);
    return '"' . md5($user->updated_at->timestamp . serialize($report)) . '"';
});
return response()->json($report)->setEtag($etag);
```

## Exceptions
Resources where ETag computation cost is negligible (model-timestamp hashing). Only implement cached ETags when full-content hashing or expensive computation is unavoidable.

## Consequences Of Violation
Doubled computation cost for each request (compute resource, then compute ETag); increased response latency; reduced server throughput under load.
---

## Use Weak ETags For JSON Responses
---
## Category
Design
---
## Rule
Use weak ETags (`W/"abc123"`) for JSON responses where formatting differences (whitespace, key ordering) should not trigger a cache miss.
---
## Reason
Strong ETags require byte-for-byte equality. JSON serializers may produce semantically identical but byte-different output (key ordering, indentation changes, JSON encoder version differences). Weak ETags allow semantic equivalence, preventing unnecessary cache invalidations when only formatting changes.
---
## Bad Example
```php
$etag = '"' . md5($response->getContent()) . '"'; // strong ETag — formatting changes invalidate
```

## Good Example
```php
$etag = 'W/"' . md5($user->updated_at->timestamp) . '"'; // weak ETag — semantic equivalence
```

## Exceptions
Binary content (images, files) and signed responses where byte-for-byte integrity verification is required. Always use strong ETags in those cases.

## Consequences Of Violation
Unnecessary cache invalidations from formatting changes; reduced CDN cache hit ratio; clients re-downloading semantically identical responses.
---
