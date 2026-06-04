# response-caching-headers Rules

## Rule 1: Always Set Explicit `Cache-Control` on Every GET Response
---
## Category
Performance
---
## Rule
Always set an explicit `Cache-Control` header on every successful GET response, never rely on browser/proxy default caching behavior.
---
## Reason
Browsers and proxies cache responses based on heuristic rules when no `Cache-Control` is present. Heuristics vary by client and may cache private data or fail to cache cacheable content.
---
## Bad Example
```php
return response()->json($data);
// No Cache-Control — browser heuristics apply unpredictably
```
---
## Good Example
```php
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=60, s-maxage=60');
```
---
## Exceptions
POST, PUT, PATCH, DELETE endpoints — not cacheable by default.
---
## Consequences Of Violation
Private user data cached in shared proxies. Public data not cached — wasted bandwidth. Inconsistent behavior across different browsers and CDNs.

## Rule 2: Use `Cache-Control: private` for Authenticated Responses
---
## Category
Security
---
## Rule
Always set `Cache-Control: private` on any GET response that contains user-specific or authenticated data.
---
## Reason
Without `private`, shared caches (CDNs, corporate proxies) may store and serve authenticated responses to other users. This leaks session-specific data across request boundaries.
---
## Bad Example
```php
// Authenticated user profile — public caching
return response()->json($profileData)
    ->header('Cache-Control', 'public, max-age=3600');
```
---
## Good Example
```php
// Authenticated user profile — private caching only
return response()->json($profileData)
    ->header('Cache-Control', 'private, max-age=60');
```
---
## Exceptions
Public data endpoints that happen to have authentication but contain no user-specific content.
---
## Consequences Of Violation
Authenticated user data served to other users from cache. Security breach and GDPR violation potential.

## Rule 3: Generate ETags from Model Timestamps, Not Full Content Hashes
---
## Category
Performance
---
## Rule
Always generate ETags from model `updated_at` timestamps combined with the model ID rather than hashing the entire serialized response body.
---
## Reason
Full-content hashing requires serializing the entire resource just to compute the hash — wasting the CPU time that ETags are meant to save. Timestamp-based ETags are ~0.01ms vs ~0.1ms per MB for full hashing.
---
## Bad Example
```php
$etag = md5(json_encode($resource->toArray($request))); // serializes even when unchanged
```
---
## Good Example
```php
$etag = md5($model->updated_at->timestamp . $model->id); // no serialization needed
```
---
## Exceptions
Endpoints whose responses are not directly derived from a single model's timestamps (aggregated reports, computed views).
---
## Consequences Of Violation
Server serializes the entire resource on every request just to compute the ETag, defeating the performance benefit of conditional requests.

## Rule 4: Set `Vary: Accept` on Content-Negotiated Endpoints
---
## Category
Reliability
---
## Rule
Always set `Vary: Accept` (and `Vary: Authorization` for authenticated endpoints) on any response that varies by request headers.
---
## Reason
CDNs and proxies use the `Vary` header to determine which request headers differentiate cache entries. Without `Vary: Accept`, a JSON response may be served to a client expecting HTML (or vice versa).
---
## Bad Example
```php
// Endpoint supports both JSON and XML — no Vary header
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=3600');
// JSON response cached and served to XML-requesting client
```
---
## Good Example
```php
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=3600')
    ->header('Vary', 'Accept');
```
---
## Exceptions
Endpoints that serve only a single content type and have no authentication.
---
## Consequences Of Violation
Wrong content type served from cache. Client receives JSON when expecting XML, or authenticated data served to unauthenticated users.

## Rule 5: Never Cache Error Responses
---
## Category
Security
---
## Rule
Always set `Cache-Control: no-store` on 4xx and 5xx responses to prevent caching of error payloads.
---
## Reason
Caching error responses serves stale errors to users long after the issue is resolved. A 429 Rate Limited response cached for minutes blocks legitimate requests. A 500 error cached indefinitely shows a broken page even after the server recovers.
---
## Bad Example
```php
// Global middleware — same cache headers for all responses
// Error responses get Cache-Control: public, max-age=60
```
---
## Good Example
```php
public function handle($request, Closure $next)
{
    $response = $next($request);
    if (! $response->isSuccessful()) {
        $response->header('Cache-Control', 'no-store');
    }
    return $response;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Stale 429 errors block legitimate traffic. Stale 500 errors shown after recovery. Rate-limit headers cached and applied to wrong users.

## Rule 6: Use Weak ETags for Responses with Dynamic Metadata
---
## Category
Performance
---
## Rule
Always use weak ETags (prefixed with `W/`) for responses that include dynamic metadata (timestamps, request IDs) that change every request but the resource data itself is unchanged.
---
## Reason
Strong ETags imply byte-for-byte equality. Dynamic meta fields change on every request even when the resource hasn't changed, forcing a full response every time. Weak ETags allow caches to treat semantically equivalent responses as the same.
---
## Bad Example
```php
$etag = md5($response->getContent()); // strong ETag — changes every time meta fields change
```
---
## Good Example
```php
$resourceEtag = md5($model->updated_at->timestamp . $model->id);
$etag = 'W/"' . $resourceEtag . '"'; // weak ETag — ignores dynamic meta
```
---
## Exceptions
Endpoints with no dynamic content where strong byte-for-byte comparison is desired.
---
## Consequences Of Violation
Every response gets a unique ETag due to changing metadata (request ID, timestamp), making conditional requests useless. All responses are full 200 instead of 304.

## Rule 7: Match `max-age` to Data Change Frequency
---
## Category
Reliability
---
## Rule
Always set `max-age` based on how frequently the underlying data changes, not on an arbitrary default value.
---
## Reason
Overly long `max-age` on fast-changing data serves stale content. Overly short `max-age` on slow-changing data wastes bandwidth and server resources on unnecessary validation requests.
---
## Bad Example
```php
// Same max-age for all resource types
return response()->json($data)->header('Cache-Control', 'public, max-age=3600');
// Reference data (countries) and user profiles both get 1 hour
```
---
## Good Example
```php
if ($request->is('api/countries*')) {
    $maxAge = 86400; // reference data — changes daily
} elseif ($request->is('api/profile*')) {
    $maxAge = 60; // user profile — changes frequently
} else {
    $maxAge = 300; // default — 5 minutes
}
return response()->json($data)
    ->header('Cache-Control', "public, max-age={$maxAge}, s-maxage={$maxAge}");
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Users see stale data for up to an hour on fast-changing resources. CDNs cache outdated pricing, inventory, or status information.
