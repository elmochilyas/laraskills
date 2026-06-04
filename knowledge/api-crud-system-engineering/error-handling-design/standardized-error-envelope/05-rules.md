# Phase 5: Rules — Standardized Error Envelope

## Rule: Use error as the Top-Level Key
---
## Category
Architecture | Design
---
## Rule
Always wrap all error response data inside a top-level `error` JSON key; never place error fields at the top level or mix them with success response fields.
---
## Reason
The `error` top-level key matches Stripe/Twilio conventions, keeps error fields separate from a potential `data` field (for partial success), and prevents collision with success response shapes.
---
## Bad Example
```php
// Fields at top level — pollutes response namespace
return response()->json([
    'code' => 'USER_NOT_FOUND',
    'message' => 'Not found.',
    'status' => 404,
]);
```
---
## Good Example
```php
// All error data inside error key — clean separation
return response()->json([
    'error' => [
        'code' => 'USER_NOT_FOUND',
        'message' => 'The requested resource was not found.',
        'status' => 404,
    ],
]);
```
---
## Exceptions
Adopting an existing standard (JSON:API, RFC 9457) that uses a different top-level structure; follow that standard's envelope consistently.
---
## Consequences Of Violation
Clients cannot generically parse errors; response shape differs per endpoint; conflicts with success response `data` key.

---

## Rule: Keep Envelope Fields Immutable — Code, Message, Status, Detail
---
## Category
Architecture | Reliability
---
## Rule
Always keep the error envelope fields (`code`, `message`, `status`, `detail`) and their types stable once published; never rename, remove, or change the type of an existing field.
---
## Reason
Clients parse the envelope structure programmatically. Renaming `detail` to `details` or changing `code` from string to object silently breaks all existing client parsing code.
---
## Bad Example
```php
// v2 changes field types — breaks clients
'error' => [
    'error_code' => 42, // Was string 'USER_NOT_FOUND' in v1
    'description' => '...', // Was 'message'
]
```
---
## Good Example
```php
// v2 adds new fields but keeps existing ones unchanged
'error' => [
    'code' => 'USER_NOT_FOUND',       // Same as v1
    'message' => 'The requested resource was not found.', // Same as v1
    'status' => 404,                   // Same as v1
    'detail' => ['resource_type' => 'User'], // Same shape as v1
    'request_id' => 'abc-123',         // New field — additive change only
]
```
---
## Exceptions
Major version API bump (v1 → v2) with documented migration period and sunset header for the old version.
---
## Consequences Of Violation
Client SDKs break silently in production; emergency client-side hotfixes required; trust erosion with API consumers.

---

## Rule: Use a Typed DTO Class for the Envelope
---
## Category
Code Organization | Reliability
---
## Rule
Always define the error envelope as a typed readonly DTO class (e.g., `ErrorEnvelope`), never as an associative array built inline in controllers or handlers.
---
## Reason
A typed class enforces consistent serialisation, enables IDE autocompletion, prevents field name typos, and provides a single place to modify envelope behaviour (nullable detail, serialisation logic).
---
## Bad Example
```php
// Inline array — inconsistent, no type safety
return response()->json([
    'error' => [
        'code' => 'USER_NOT_FOUND',
        'message' => 'Not found.',
        'status' => 404,
        // detail may be forgotten
    ],
]);
```
---
## Good Example
```php
readonly class ErrorEnvelope
{
    public function __construct(
        public string $code,
        public string $message,
        public int $status,
        public mixed $detail = null,
    ) {}
}

return response()->json(
    new ErrorEnvelope(ErrorCodes::USER_NOT_FOUND, 'Not found.', 404, ['resource_type' => 'User']),
    404,
);
```
---
## Exceptions
No common exceptions — a typed DTO is always preferred over inline arrays for contracts.
---
## Consequences Of Violation
Inconsistent envelope shapes across endpoints; field name typos (`massage` instead of `message`); missing detail when nullable.

---

## Rule: Duplicate the HTTP Status Code in the Envelope Body
---
## Category
Design | Reliability
---
## Rule
Always include the HTTP status code as the `status` field inside the error envelope body; never rely solely on the HTTP response status header.
---
## Reason
Some client environments (WebSocket protocols, proxy logs, response caching layers) do not expose response headers. Duplicating the status in the body ensures all consumers can determine the error severity.
---
## Bad Example
```php
// Status only in HTTP header — not accessible to all clients
'error' => ['code' => 'USER_NOT_FOUND', 'message' => 'Not found.']
```
---
## Good Example
```php
// Status in both header and body
'error' => ['code' => 'USER_NOT_FOUND', 'message' => 'Not found.', 'status' => 404]
```
---
## Exceptions
No common exceptions — status must always be duplicated in the body.
---
## Consequences Of Violation
WebSocket and Server-Sent Events consumers cannot determine error status; cached error responses lose origin status; proxy logs lack severity context.

---

## Rule: Keep detail Optional — Omit When Empty
---
## Category
Design | Maintainability
---
## Rule
Always omit the `detail` field from the envelope when there is no contextual information to provide; never send `detail: null`, `detail: {}`, or `detail: []` for errors without context.
---
## Reason
A missing key is cleaner and requires no client-side null check. Every error should carry detail only when it adds meaning; empty detail indicates the envelope wasn't designed for the specific error type.
---
## Bad Example
```php
// Null detail — client must null-check before using
'error' => ['code' => 'USER_NOT_FOUND', 'message' => 'Not found.', 'status' => 404, 'detail' => null]
```
---
## Good Example
```php
// No detail key — client doesn't need to null-check
'error' => ['code' => 'USER_NOT_FOUND', 'message' => 'Not found.', 'status' => 404]
// Only include detail when there is context:
'error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Invalid data.', 'status' => 422,
    'detail' => ['fields' => ['email' => ['Required']]]]
```
---
## Exceptions
Errors where detail is always expected (422 validation errors); always include `detail.fields` for validation errors even if empty.
---
## Consequences Of Violation
Client code is cluttered with null checks; ambiguous whether detail was omitted intentionally or forgotten.

---

## Rule: Never Include success: false or Similar Redundant Fields
---
## Category
Design
---
## Rule
Always rely on the HTTP status code and the presence of the `error` key to indicate an error response; never include a `success: false` or `ok: false` boolean field.
---
## Reason
The status code is the canonical HTTP success indicator; adding a redundant boolean field that must stay in sync with the status code is a source of bugs and carries no additional information.
---
## Bad Example
```php
'error' => ['code' => 'USER_NOT_FOUND', 'message' => 'Not found.', 'status' => 404, 'success' => false]
// success and status can contradict each other
```
---
## Good Example
```php
// No redundant field — status code IS the success indicator
'error' => ['code' => 'USER_NOT_FOUND', 'message' => 'Not found.', 'status' => 404]
```
---
## Exceptions
When an API standard (JSON:API, RFC 9457) or existing client contract requires the field; flag it as deprecated.
---
## Consequences Of Violation
`success: true` but status 404 — contradictory fields; client must decide which to trust; unnecessary serialisation overhead.

---

## Rule: Guard All Envelope-Producing Callbacks with expectsJson()
---
## Category
Framework Usage | Reliability
---
## Rule
Always guard every `renderable` callback that returns JSON with `$request->expectsJson()`; return `null` to let non-API requests use the default framework error handling.
---
## Reason
The same exception class is thrown for API and web routes. Returning the error envelope for a web request breaks Blade error pages, session-based auth redirects, and debugging.
---
## Bad Example
```php
$this->renderable(function (AuthenticationException $e, $request) {
    return response()->json(new ErrorEnvelope(/* ... */), 401);
    // Also caught web requests — breaks redirect flow
});
```
---
## Good Example
```php
$this->renderable(function (AuthenticationException $e, Request $request) {
    if (! $request->expectsJson()) return null;
    return response()->json(new ErrorEnvelope(/* ... */), 401);
});
```
---
## Exceptions
API-only applications with no web routes; the guard is still harmless.
---
## Consequences Of Violation
Web auth redirects return JSON instead of redirect; Blade error pages show blank screens; session-based auth flows broken.

---

## Rule: Pre-Build Common Envelopes as Cached Constants
---
## Category
Performance
---
## Rule
Always pre-build and cache common error envelopes (401, 403, 404 generic) as class constants or cached closures to avoid object allocation on every error.
---
## Reason
401 and 403 responses are high-volume (auth failures happen on every unauthenticated request). Rebuilding the envelope object for each adds unnecessary GC pressure in the error path.
---
## Bad Example
```php
// New envelope built on every auth failure — GC pressure at scale
return response()->json(
    new ErrorEnvelope(ErrorCodes::USER_AUTH_UNAUTHENTICATED, 'Auth required.', 401),
    401,
);
```
---
## Good Example
```php
class ErrorEnvelopes
{
    public const UNAUTHENTICATED = '{"error":{"code":"USER.AUTH_UNAUTHENTICATED","message":"Authentication required.","status":401}}';
    // Pre-serialised as JSON string to avoid serialisation
}

// In handler:
return response()->json(
    json_decode(ErrorEnvelopes::UNAUTHENTICATED, true),
    401,
    ['WWW-Authenticate' => 'Bearer realm="api"'],
);
```
---
## Exceptions
Error envelopes with dynamic content (trace_id, resource_type); build on-demand for these.
---
## Consequences Of Violation
Increased object allocation in the error path; higher GC pressure under auth-heavy workloads; measurable latency at high scale.

---

## Rule: Never Modify the Envelope Shape in Different Environments
---
## Category
Architecture | Testing
---
## Rule
Always return the exact same envelope shape in development and production environments; only add a separate top-level `debug` key in dev mode, never change the `error` sub-structure.
---
## Reason
If the envelope shape differs between environments, client tests running against a dev server are not representative of production behavior, leading to test-pass-in-dev, fail-in-prod scenarios.
---
## Bad Example
```php
// Dev mode includes file/line in the envelope — different shape
if (config('app.debug')) {
    'error' => ['code' => '...', 'message' => '...', 'status' => 500, 'file' => $e->getFile()];
} else {
    'error' => ['code' => '...', 'message' => '...', 'status' => 500];
}
```
---
## Good Example
```php
// Envelope is always the same
'error' => ['code' => '...', 'message' => '...', 'status' => 500];
// Dev mode adds separate debug key
if (config('app.debug')) {
    $response['debug'] = ['file' => $e->getFile(), 'line' => $e->getLine()];
}
```
---
## Exceptions
No common exceptions — the error envelope must be environment-independent.
---
## Consequences Of Violation
Client tests pass in dev, crash in production; envelope contract is undefined; consumers cannot write reliable error handling.
