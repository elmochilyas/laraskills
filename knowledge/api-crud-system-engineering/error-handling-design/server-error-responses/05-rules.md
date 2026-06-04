# Phase 5: Rules — Server Error Responses

## Rule: Always Include a Trace ID in Every 500 Response
---
## Category
Reliability | Maintainability
---
## Rule
Always generate and include a unique UUID trace ID in `detail.trace_id` for every 500 response; never omit the trace ID.
---
## Reason
The trace ID is the only link between the client's error experience and the server's log entry. Without it, debugging a 500 requires guessing which log entry corresponds to the client's request.
---
## Bad Example
```php
return response()->json(
    new ErrorEnvelope(ErrorCodes::SYSTEM_INTERNAL_ERROR, 'Server error.', 500),
    500,
);
// No trace_id — cannot correlate with server logs
```
---
## Good Example
```php
public function renderServerError(Throwable $e, Request $request): JsonResponse
{
    $traceId = Str::uuid()->toString();

    Log::error('Internal server error', [
        'trace_id' => $traceId,
        'exception' => $e,
        // ...
    ]);

    return response()->json(
        new ErrorEnvelope(
            ErrorCodes::SYSTEM_INTERNAL_ERROR,
            'An internal server error occurred.',
            500,
            ['trace_id' => $traceId],
        ),
        500,
    );
}
```
---
## Exceptions
No common exceptions — trace ID is mandatory for all 500 responses.
---
## Consequences Of Violation
Cannot correlate client error reports with server logs; debugging requires log search by timestamp; extended incident resolution time.

---

## Rule: Never Include Stack Traces, File Paths, or SQL in 500 Responses
---
## Category
Security
---
## Rule
Always strip stack traces, file paths, SQL queries, configuration values, and environment variables from all 500 responses regardless of environment; never include them even in development mode.
---
## Reason
500 responses cross the network boundary and may be cached, logged by proxies, or captured by browser dev tools. Internal details belong in server logs only.
---
## Bad Example
```php
// Returns stack trace in 500 response — information disclosure
return response()->json([
    'error' => 'Internal error',
    'trace' => $e->getTraceAsString(),
], 500);
```
---
## Good Example
```php
// Log full details server-side, return safe envelope
Log::error('Internal server error', ['exception' => $e, 'trace_id' => $traceId]);
return response()->json(
    new ErrorEnvelope(ErrorCodes::SYSTEM_INTERNAL_ERROR, 'An internal server error occurred.', 500, [
        'trace_id' => $traceId,
    ]),
    500,
);
```
---
## Exceptions
Dev mode adds a separate `debug` key with limited trace info (10 frames), never modifying the `error` envelope.
---
## Consequences Of Violation
Full information disclosure of server paths, class names, SQL schemas, and potentially credentials; PCI DSS 6.5.5 violation.

---

## Rule: Use Infrastructure-Specific Error Codes for Known Failure Modes
---
## Category
Design | Maintainability
---
## Rule
Always use distinct error codes for different infrastructure failure types — `SYSTEM.DATABASE_ERROR`, `SYSTEM.QUEUE_ERROR`, `SYSTEM.THIRD_PARTY_TIMEOUT` — rather than a single `SYSTEM.INTERNAL_ERROR` for all server errors.
---
## Reason
Distinct codes enable differentiated monitoring, alert routing, and on-call response. A DB outage alarms the DBA; a queue failure alarms the platform team. A single code requires manual triage.
---
## Bad Example
```php
// Single code for all server errors — impossible to differentiate
const SYSTEM_INTERNAL_ERROR = 'SYSTEM.INTERNAL_ERROR';
// Used for DB, queue, and third-party failures
```
---
## Good Example
```php
// Infrastructure-specific codes for known failure modes
const SYSTEM_DATABASE_ERROR = 'SYSTEM.DATABASE_ERROR';
const SYSTEM_QUEUE_ERROR = 'SYSTEM.QUEUE_ERROR';
const SYSTEM_THIRD_PARTY_TIMEOUT = 'SYSTEM.THIRD_PARTY_TIMEOUT';
const SYSTEM_INTERNAL_ERROR = 'SYSTEM.INTERNAL_ERROR'; // Fallback only
```
---
## Exceptions
Failure types that are intentionally obfuscated for security (public APIs) — use `SYSTEM.INTERNAL_ERROR` only.
---
## Consequences Of Violation
All 500 errors look identical in dashboards; cannot automate alert routing by failure type; incident triage requires manual log inspection.

---

## Rule: Register a Throwable Fallback as the Last Renderable Callback
---
## Category
Reliability | Framework Usage
---
## Rule
Always register a `Throwable` fallback `renderable` callback as the very last handler registration to catch any unhandled exception; never assume all exception types have explicit mappings.
---
## Reason
New exception types are added during development. Without a `Throwable` fallback, an unhandled exception produces a Symfony/Whoops HTML error page instead of a JSON envelope.
---
## Bad Example
```php
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, $request) { /* 401 */ });
    // No Throwable fallback — new exceptions get Whoops HTML
}
```
---
## Good Example
```php
public function register(): void
{
    // Specific handlers first:
    $this->renderable(function (AuthenticationException $e, $request) { /* 401 */ });
    $this->renderable(function (ValidationException $e, $request) { /* 422 */ });
    // Throwable fallback — always last:
    $this->renderable(function (Throwable $e, Request $request) {
        return $request->expectsJson()
            ? $this->renderServerError($e, $request)
            : null;
    });
}
```
---
## Exceptions
No common exceptions — a Throwable fallback is mandatory for API reliability.
---
## Consequences Of Violation
Undiscovered exceptions return Whoops HTML to API clients; unparseable responses break client integration; stack traces exposed in production.

---

## Rule: Wrap the 500 Render Method in Try/Catch with Hardcoded Fallback
---
## Category
Reliability
---
## Rule
Always wrap the 500 response construction in a try/catch block; if rendering throws, return a hardcoded JSON response that contains no exception details.
---
## Reason
An error during error rendering (serialization failure, null pointer in logging code) causes an infinite loop or a Whoops HTML response. A hardcoded fallback guarantees the client always gets a parseable JSON response.
---
## Bad Example
```php
public function renderServerError(Throwable $e, Request $request): JsonResponse
{
    // If any line here throws, no JSON response is returned
    $envelope = new ErrorEnvelope(/* complex construction */);
    // Logging could fail too
    Log::error('...', ['exception' => $e]);
    return response()->json($envelope, 500);
}
```
---
## Good Example
```php
public function renderServerError(Throwable $e, Request $request): JsonResponse
{
    try {
        $traceId = Str::uuid()->toString();
        Log::error('Internal server error', ['trace_id' => $traceId, 'exception' => $e]);
        return response()->json(
            new ErrorEnvelope(ErrorCodes::SYSTEM_INTERNAL_ERROR, 'Server error.', 500, ['trace_id' => $traceId]),
            500,
        );
    } catch (Throwable $renderError) {
        // Hardcoded fallback — never fails
        return response()->json(
            ['error' => ['code' => 'SYSTEM.INTERNAL_ERROR', 'message' => 'Server error.', 'status' => 500]],
            500,
        );
    }
}
```
---
## Exceptions
No common exceptions — try/catch wrapping is mandatory for production reliability.
---
## Consequences Of Violation
Error-during-error-handling causes Whoops HTML; original error lost; debugging impossible; monitoring receives no data about either error.

---

## Rule: Log Full Exception Details Before Rendering the Response
---
## Category
Reliability | Maintainability
---
## Rule
Always log the full exception details (trace_id, exception class, message, stack trace, request context) before constructing the 500 response; never log after sending the response.
---
## Reason
If rendering crashes and the try/catch catches it, the original exception details are lost if logging happens after the render attempt. Logging before rendering guarantees the exception is captured regardless of render outcome.
---
## Bad Example
```php
public function renderServerError(Throwable $e, Request $request): JsonResponse
{
    $response = response()->json(/* ... */);
    $response->send(); // Response sent
    Log::error('Error', ['exception' => $e]); // Too late — if send() throws, log is missed
}
```
---
## Good Example
```php
public function renderServerError(Throwable $e, Request $request): JsonResponse
{
    $traceId = Str::uuid()->toString();

    // Log BEFORE constructing response
    Log::error('Internal server error', [
        'trace_id' => $traceId,
        'exception_class' => $e::class,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
        'url' => $request->fullUrl(),
        'method' => $request->method(),
        'user_id' => $request->user()?->id,
    ]);

    // Now build and return the safe response
    return response()->json(
        new ErrorEnvelope(ErrorCodes::SYSTEM_INTERNAL_ERROR, 'Server error.', 500, ['trace_id' => $traceId]),
        500,
    );
}
```
---
## Exceptions
No common exceptions — always log before rendering.
---
## Consequences Of Violation
Rendering failure causes loss of original exception details; debugging becomes impossible; error is invisible to logs and monitoring.

---

## Rule: Use a UUID Trace ID — Never Sequential or Request ID
---
## Category
Security | Reliability
---
## Rule
Always generate a new UUID v4 for the 500 response trace ID; never reuse the request's `X-Request-ID` header value and never use sequential integers.
---
## Reason
The trace ID is specifically for error correlation — reusing the request ID conflates the request identity with a specific error occurrence. Sequential IDs enable request enumeration by attackers.
---
## Bad Example
```php
// Reuses request header — conflates request with error
$traceId = $request->header('X-Request-ID');
```
---
## Good Example
```php
// New UUID v4 — unique per error occurrence
$traceId = Str::uuid()->toString();
```
---
## Exceptions
Distributed tracing systems that already provide a trace ID (OpenTelemetry); use that ID for consistency, not the request ID.
---
## Consequences Of Violation
Cannot distinguish multiple errors on the same request; request IDs may not be present on all requests; sequential trace IDs allow request enumeration.

---

## Rule: Force application/json Content-Type on 500 Responses
---
## Category
Reliability | Framework Usage
---
## Rule
Always force `Content-Type: application/json` on 500 responses; never rely on middleware to set it, as the exception may occur before middleware runs.
---
## Reason
If the error occurs in middleware (e.g., before `AddQueuedCookiesToResponse`), the response Content-Type may default to `text/html`. Forcing the header guarantees the client receives parseable JSON.
---
## Bad Example
```php
return response()->json($envelope, 500);
// If middleware didn't run, Content-Type may be text/html
```
---
## Good Example
```php
return response()->json($envelope, 500)
    ->header('Content-Type', 'application/json')
    ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
```
---
## Exceptions
No common exceptions — Content-Type must always be forced on 500 responses.
---
## Consequences Of Violation
Client receives HTML error page when exception occurs in early middleware; JSON parser fails; integration tests break.
