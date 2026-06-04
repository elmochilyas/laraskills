# rfc-9457-problem-details Rules

## Rule 1: Include All Required Fields in Every Error Response
---
## Category
Design
---
## Rule
Always include `type`, `title`, `status`, `detail`, and `instance` in every Problem Details error response.
---
## Reason
RFC 9457 defines `type`, `title`, `status`, `detail`, and `instance` as the required Problem Details members. Omitting any breaks machine-readability and spec compliance.
---
## Bad Example
```php
return response()->json([
    'error' => 'Validation failed',
    'message' => 'The email field is required.',
], 422);
```
---
## Good Example
```php
return response()->json([
    'type' => '/errors/validation-error',
    'title' => 'Validation Error',
    'status' => 422,
    'detail' => 'The email field is required.',
    'instance' => '/api/users',
], 422)->header('Content-Type', 'application/problem+json');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
HTTP libraries and API gateways cannot parse the error generically. Error monitoring lacks required fields for aggregation. Spec compliance tools reject the response.

## Rule 2: Make `type` URLs Resolve to Documentation
---
## Category
Maintainability
---
## Rule
Always ensure every `type` URI in a Problem Details response resolves to a live documentation page describing the error.
---
## Reason
The `type` URI is meant to be dereferenceable by developers and automated tools. A broken link or `about:blank` for everything defeats the purpose of error taxonomy — clients cannot learn about the error.
---
## Bad Example
```php
'type' => 'https://api.example.com/errors/validation-error',
// URL returns 404 — useless
```
---
## Good Example
```php
'type' => '/errors/validation-error',
// Route registered in web.php that serves a documentation page
```
---
## Exceptions
Generic/unknown errors where `about:blank` is the correct value per the spec.
---
## Consequences Of Violation
Developers cannot learn about error types. Automated error handling tools cannot fetch error documentation. `type` becomes a dead string.

## Rule 3: Register Distinct Error Types per Error Category
---
## Category
Design
---
## Rule
Always register a distinct `type` URI for each error category — never use a single generic type for all errors.
---
## Reason
The purpose of `type` is machine-readable error classification. A single generic type for all errors defeats classification — monitoring tools cannot distinguish "not found" from "validation failed" from "rate limited."
---
## Bad Example
```php
'type' => 'https://api.example.com/errors/error', // same type for every error
```
---
## Good Example
```php
// Distinct types per category
'type' => '/errors/validation-error',
'type' => '/errors/not-found',
'type' => '/errors/rate-limited',
'type' => '/errors/unauthorized',
'type' => '/errors/internal-error',
```
---
## Exceptions
Unknown/unexpected errors where no specific type exists — use `about:blank`.
---
## Consequences Of Violation
Cannot aggregate error rates by category. Monitoring dashboards show "error" for every failure. Clients cannot write type-specific error handling.

## Rule 4: Include `instance` as a Correlation ID for Log Tracing
---
## Category
Reliability
---
## Rule
Always generate a unique request ID (UUID or equivalent) for `instance` in every Problem Details response and log it server-side for cross-reference.
---
## Reason
`instance` identifies the specific occurrence of the problem. When a client reports an error with the `instance` value, the server can correlate it to server-side logs, enabling efficient debugging without exposing internal identifiers.
---
## Bad Example
```php
'instance' => '/api/users/123', // path only — no correlation ID
// Client reports "error on /api/users/123" — cannot find in logs
```
---
## Good Example
```php
// Middleware generates request ID
$requestId = (string) Str::uuid();
Log::withContext(['request_id' => $requestId]);

// Error response uses same ID
'instance' => $requestId,
// Client reports: "instance = 550e8400-e29b-41d4-a716-446655440000"
// Server: found in logs instantly
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client error reports lack correlation identifiers. Debugging requires manual timestamp matching. Support team cannot find the specific request in logs.

## Rule 5: Never Include Stack Traces or Debug Info in `detail`
---
## Category
Security
---
## Rule
Always sanitize `detail` in production to remove stack traces, SQL queries, file paths, and any internal state.
---
## Reason
`detail` is serialized to the client. Stack traces and SQL queries expose internal implementation details — database structure, file paths, framework version — that aid attackers in crafting exploits.
---
## Bad Example
```php
// Production error handler — leaks internals
'detail' => $exception->getMessage() . "\n" . $exception->getTraceAsString(),
```
---
## Good Example
```php
// Production — sanitized
'detail' => 'The requested resource was not found.',
// Development — full detail (checked before send)
if (! app()->isProduction()) {
    $problem['detail'] = $exception->getMessage();
    $problem['debug_trace'] = $exception->getTraceAsString(); // extension member
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Attackers learn database structure from SQL in error messages. File paths reveal application layout. Stack traces expose framework and package versions with known vulnerabilities.

## Rule 6: Match `status` in the Body to the HTTP Response Status
---
## Category
Reliability
---
## Rule
Always ensure the `status` field in the Problem Details body matches the HTTP response status code exactly.
---
## Reason
The spec requires the body `status` to match the HTTP status. A mismatch confuses clients that parse the body status versus the HTTP status, and violates spec compliance.
---
## Bad Example
```php
return response()->json([
    'type' => '/errors/validation-error',
    'title' => 'Validation Error',
    'status' => 422, // body says 422
], 400); // HTTP says 400 — mismatch
```
---
## Good Example
```php
return response()->json([
    'type' => '/errors/validation-error',
    'title' => 'Validation Error',
    'status' => 422,
    'detail' => 'The email field is required.',
], 422);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients that parse body status get a different value than HTTP status. API gateways and monitoring tools see mismatched data. Spec compliance check fails.

## Rule 7: Set `Content-Type: application/problem+json` on All Error Responses
---
## Category
Framework Usage
---
## Rule
Always set `Content-Type` to `application/problem+json` for every RFC 9457 error response.
---
## Reason
The media type `application/problem+json` signals to clients and gateways that the response is a Problem Details document, enabling automatic parsing without inspecting the body.
---
## Bad Example
```php
return response()->json($problem, 422);
// Default Content-Type: application/json — not identifiable as problem details
```
---
## Good Example
```php
return response()->json($problem, 422)
    ->header('Content-Type', 'application/problem+json');
```
---
## Exceptions
Client compatibility issues where the client cannot parse `application/problem+json`.
---
## Consequences Of Violation
API gateways cannot route error responses to problem-detail handlers. Client generic HTTP libraries parse the response as regular JSON, missing the Problem Details semantics.
