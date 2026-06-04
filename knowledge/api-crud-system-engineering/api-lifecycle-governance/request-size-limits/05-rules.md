# Phase 5: Rules — Request Size Limits

## Rule 1: Enforce Strictest Limit at Outermost Layer (nginx)
---
## Category
Security
---
## Rule
Always configure the most restrictive request size limit at nginx (the outermost layer), with equal or more permissive limits at PHP and Laravel. Never make an inner layer stricter than the outer layer.
---
## Reason
Requests exceeding limits should be rejected as early as possible. If nginx allows a request that PHP rejects, the request has consumed nginx resources for nothing. Layered enforcement must be nginx <= PHP <= Laravel.
---
## Bad Example
```nginx
# nginx allows 10 MB, but PHP allows only 2 MB
client_max_body_size 10M;
# Waste: 2-10 MB requests pass nginx, rejected by PHP
```
---
## Good Example
```nginx
# nginx is the strictest — rejects oversized first
client_max_body_size 10M;
# PHP matches or exceeds nginx
# upload_max_filesize = 12M; post_max_size = 13M;
```
---
## Exceptions
Upload endpoints may have higher limits at PHP level with nginx matching the larger value.
---
## Consequences Of Violation
Wasted server resources processing requests that will be rejected; inconsistent error responses confusing consumers.
---

## Rule 2: Use Tiered Limits Per Consumer
---
## Category
Scalability
---
## Rule
Always implement tiered request size limits that vary by consumer tier (Free: 1 MB, Pro: 10 MB, Enterprise: 50 MB). Never apply a single limit to all consumers.
---
## Reason
Free-tier consumers have lower resource allocation; single high limits allow free-tier abuse, while single low limits block enterprise use cases.
---
## Bad Example
```php
// Single limit for all consumers
'max_body_size' => 10 * 1024 * 1024; // blocks enterprise file uploads
```
---
## Good Example
```php
'max_body_size' => match ($request->user()->tier) {
    'free' => 1 * 1024 * 1024,
    'pro' => 10 * 1024 * 1024,
    'enterprise' => 50 * 1024 * 1024,
};
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Free-tier abuse with large payloads; enterprise consumers blocked; revenue-impacting limitations.
---

## Rule 3: Return 413 with Limit Info and Upgrade Path
---
## Category
Design
---
## Rule
Always return HTTP 413 Payload Too Large with a structured JSON body containing the current limit, the actual size, and instructions for increasing the limit. Never return a bare 413 without actionable information.
---
## Reason
Consumer needs to know what the limit is and how to increase it. A bare 413 forces the consumer to search documentation or contact support.
---
## Bad Example
```php
abort(413); // No information about what the limit is
```
---
## Good Example
```php
return response()->json([
    'error' => [
        'code' => 'PAYLOAD_TOO_LARGE',
        'message' => 'Request body exceeds the 1 MB limit for Free tier.',
        'limit' => 1048576,
        'actual_size' => $actualSize,
        'resolution' => 'Reduce payload size or upgrade to Pro tier (10 MB limit).',
    ]
], 413);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer has no path to resolution; support ticket created for simple limit question; integration delayed.
---

## Rule 4: Enforce Limit During Streaming, Not After Buffering
---
## Category
Performance
---
## Rule
Always enforce request size limits while streaming the body, rejecting as soon as the limit is exceeded. Never buffer the entire request body before checking the size.
---
## Reason
Buffering a 50 MB request just to check its size consumes 50 MB of memory per request. Streaming validation rejects oversized requests with minimal memory cost.
---
## Bad Example
```php
// Buffers entire body before validation
$body = $request->getContent(); // 50 MB in memory
if (strlen($body) > $limit) { abort(413); }
```
---
## Good Example
```php
// nginx streaming enforcement — rejects at TCP level before PHP
// client_max_body_size 10M; — no memory cost
```
---
## Exceptions
Endpoints that need the full body for processing (e.g., signature verification) may buffer after size validation.
---
## Consequences Of Violation
Memory exhaustion under concurrent large requests; DoS vulnerability via memory pressure.
---

## Rule 5: Log Oversized Requests Without Payload Content
---
## Category
Security
---
## Rule
Always log oversized request attempts with consumer ID, endpoint, and actual size — never with the request payload content. Never log the body of a rejected request.
---
## Reason
The oversized payload may contain PII, credentials, or malicious content. Logging the payload creates a data leak and storage burden.
---
## Bad Example
```php
Log::warning('Request too large', [
    'consumer' => $consumerId,
    'payload' => $request->getContent(), // PII leak
]);
```
---
## Good Example
```php
Log::warning('Request too large', [
    'consumer_id' => $consumerId,
    'endpoint' => $request->path(),
    'actual_size_mb' => round($actualSize / 1024 / 1024, 2),
    'limit_mb' => $limit / 1024 / 1024,
]);
```
---
## Exceptions
Security incident investigation with legal approval may log payloads under strict controls.
---
## Consequences Of Violation
PII breach; compliance violation; storage costs for logged payloads.
---

## Rule 6: Configure Endpoint-Specific Overrides for Uploads
---
## Category
Architecture
---
## Rule
Always configure higher size limits for file upload endpoints and lower limits for JSON mutation endpoints. Never use the same limit for all endpoints.
---
## Reason
Upload endpoints have fundamentally different size requirements (files can be 50 MB) than JSON mutation endpoints (requests are typically < 100 KB). Single limits are too restrictive for uploads or too permissive for mutations.
---
## Bad Example
```php
// Same 50 MB limit on POST /users as POST /files/upload
// Malicious 50 MB JSON POST /users request wastes resources
```
---
## Good Example
```php
Route::post('/users', [UserController::class, 'store'])
    ->middleware('request.limit:1mb');
Route::post('/files/upload', [FileController::class, 'upload'])
    ->middleware('request.limit:50mb');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Large JSON payloads abuse upload-sized limits; memory exhaustion on mutation endpoints.
---

## Rule 7: Include X-Content-Length-Limit Header
---
## Category
Design
---
## Rule
Always include an `X-Content-Length-Limit` response header informing consumers of the maximum allowed request body size for the endpoint. Never leave consumers to guess the limit.
---
## Reason
Consumers need to know the limit before sending a request. Documentation is often out of date; the header is always accurate.
---
## Bad Example
```php
// No limit information — consumer sends 11 MB, gets 413
```
---
## Good Example
```php
public function handle(Request $request, Closure $next) {
    $response = $next($request);
    $limit = $this->getLimitForEndpoint($request);
    $response->header('X-Content-Length-Limit', (string) $limit);
    return $response;
}
```
---
## Exceptions
Internal-only endpoints may skip the header.
---
## Consequences Of Violation
Consumers repeatedly hit 413 trying to guess the limit; increased support burden; integration delays.
