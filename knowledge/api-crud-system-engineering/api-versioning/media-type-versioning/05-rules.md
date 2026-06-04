# Phase 5: Rules — Media Type Versioning

## Use Standard Vendor MIME Type Format
---
## Category
Design
---
## Rule
Always use the standard vendor MIME type format `application/vnd.{vendor}.v{major}+{format}` — never invent custom media type patterns.
---
## Reason
IANA-registered patterns are understood by HTTP libraries, API tooling, and gateway infrastructure.
---
## Bad Example
```
application/x-myapp-v1-json
```
---
## Good Example
```
application/vnd.myapp.v1+json
```
---
## Exceptions
Internal APIs with no third-party consumers and no tooling requirements.
---
## Consequences Of Violation
API tooling cannot parse the media type; content negotiation fails unexpectedly.
---

## Use Accept Header, Not Content-Type, For Version Negotiation
---
## Category
Design
---
## Rule
Always negotiate the API version via the `Accept` request header — never use the `Content-Type` header for versioning.
---
## Reason
`Content-Type` describes the request body format, not the desired response version. Using it for version negotiation violates HTTP semantics.
---
## Bad Example
```php
$version = $request->header('Content-Type'); // wrong — Content-Type is for request body
```
---
## Good Example
```php
$version = $request->header('Accept'); // correct
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
HTTP semantic violation; confusion when request body format differs from version negotiation requirements.
---

## Return 406 For Unsupported Media Types
---
## Category
Reliability
---
## Rule
Always return HTTP 406 Not Acceptable for media type values that do not match any registered vendor MIME type.
---
## Reason
A malformed or unsupported media type should produce an explicit error, not a silent default to the latest version.
---
## Bad Example
```php
return $next($request); // no content negotiation — serves latest regardless of Accept header
```
---
## Good Example
```php
if (!$mediaType = $this->matchMediaType($accept)) {
    abort(406, 'Supported media types: application/vnd.myapp.v1+json, application/vnd.myapp.v2+json');
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client receives wrong version data without knowing; debugging difficult because no error occurred.
---

## Cache The Transformer Registry
---
## Category
Performance
---
## Rule
Always cache the media-type-to-transformer mapping to avoid reflection and file I/O on every request.
---
## Reason
A registry lookup that hits the filesystem or uses reflection on every request adds measurable latency to every versioned endpoint.
---
## Bad Example
```php
// Scans directory for transformers on every request
```
---
## Good Example
```php
// Config-based registry (cached by Laravel)
'media_types' => [
    'application/vnd.myapp.v1+json' => ['transformer' => V1\PostTransformer::class],
    'application/vnd.myapp.v2+json' => ['transformer' => V2\PostTransformer::class],
],
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unnecessary per-request overhead; transformer resolution becomes a bottleneck under load.
---

## Echo Negotiated Media Type In Response Content-Type
---
## Category
Design
---
## Rule
Always set the response `Content-Type` header to the negotiated vendor media type that was matched from the request Accept header.
---
## Reason
The consumer needs confirmation of which media type was negotiated — echoing it in the response provides this confirmation.
---
## Bad Example
```php
return response()->json($data); // Content-Type: application/json
```
---
## Good Example
```php
return response()->json($data)->header('Content-Type', 'application/vnd.myapp.v2+json');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers do not know which version they received; debugging difficult.
---

## Handle `*/*` Wildcard Gracefully
---
## Category
Reliability
---
## Rule
Always handle the `*/*` wildcard Accept header gracefully — either return the default latest version or 406 with guidance.
---
## Reason
Browsers, curl without explicit Accept, and many HTTP clients send `*/*` by default — a crash or wrong response breaks basic accessibility.
---
## Bad Example
```php
// No wildcard handling — crashes or returns empty
```
---
## Good Example
```php
if ($accept === '*/*' || $accept === 'application/json') {
    return $next($request); // default to latest version
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Blank responses or errors for basic curl requests; browser debugging impossible.
---

## Log And Monitor 406 Rates
---
## Category
Reliability
---
## Rule
Always log and monitor 406 Not Acceptable response rates as a signal of consumers using outdated or mistyped media types.
---
## Reason
A rising 406 rate indicates consumers are failing to access the API correctly — a leading indicator for migration issues or documentation gaps.
---
## Bad Example
```php
// 406 responses not tracked
```
---
## Good Example
```php
Log::channel('api')->warning('Unsupported media type', [
    'accept' => $request->header('Accept'),
    'ip' => $request->ip(),
]);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent consumer breakage; consumers abandon the API without the team knowing why.
