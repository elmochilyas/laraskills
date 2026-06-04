# Rules for API Exception Handling

---

## Rule: Always Return Consistent JSON Envelope for API Errors

---

## Category

Framework Usage

---

## Rule

Prefer a single consistent JSON envelope structure (`message`, `type`, `code`, `details`) for all API error responses. Never vary the envelope shape per endpoint or per error type.

---

## Reason

API clients write one error handler, not one per endpoint. A consistent structure eliminates conditional parsing and makes the API contract predictable.

---

## Bad Example

```php
// Inconsistent envelopes across endpoints
// /api/users returns { error: 'Not found' }
// /api/posts returns { success: false, data: { msg: 'Post missing' } }
```

---

## Good Example

```php
return response()->json([
    'error' => [
        'message' => 'Resource not found.',
        'type' => 'not_found',
        'code' => 404,
    ],
    'request_id' => $request->header('X-Request-Id'),
], 404);
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: clients must update error parsing per endpoint. Reliability risks: clients may crash when envelope shape changes unexpectedly.

---

## Rule: Never Expose Stack Traces or Internal Paths in Production API Responses

---

## Category

Security

---

## Rule

Never include `$e->getTraceAsString()`, `$e->getFile()`, `$e->getLine()`, or any debug representation of the exception in production API error responses.

---

## Reason

Stack traces reveal internal file paths, line numbers, and class names that attackers use to find vulnerabilities. The error response is a public contract, not a debugging tool.

---

## Bad Example

```php
return response()->json([
    'error' => 'Server error',
    'trace' => $e->getTraceAsString(),
    'file' => $e->getFile(),
    'line' => $e->getLine(),
], 500);
```

---

## Good Example

```php
return response()->json([
    'error' => [
        'message' => app()->environment('local')
            ? $e->getMessage()
            : 'An unexpected error occurred.',
        'type' => 'server_error',
        'code' => 500,
    ],
    'request_id' => $request->header('X-Request-Id'),
], 500);
```

---

## Exceptions

Local development environments may include detailed information. Never expose in staging or production.

---

## Consequences Of Violation

Security risks: attackers learn internal paths, class names, and framework version. Maintenance risks: clients may depend on trace format, preventing upgrades.

---

## Rule: Always Configure a Catch-All renderable() for Throwable in API Routes

---

## Category

Reliability

---

## Rule

Always register a catch-all `renderable()` callback for `Throwable` in the exception handler that returns JSON for API routes. Never rely solely on per-type callbacks.

---

## Reason

Any unhandled exception type (including unexpected runtime errors) will fall through to Laravel's default HTML error page. API clients receive HTML instead of JSON and cannot parse it.

---

## Bad Example

```php
// Only handling specific types — NotFoundHttpException returns HTML for API
$exceptions->renderable(function (ValidationException $e, Request $request) {
    return response()->json(['error' => $e->getMessage()], 422);
});
```

---

## Good Example

```php
$exceptions->renderable(function (Throwable $e, Request $request) {
    if (!$request->is('api/*') && !$request->expectsJson()) {
        return;
    }
    // Map exception to status code, type, and return JSON
    return response()->json([
        'error' => [
            'message' => $e->getMessage() ?: 'Server error.',
            'type' => 'server_error',
            'code' => $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500,
        ],
        'request_id' => $request->header('X-Request-Id'),
    ], 500);
});
```

---

## Exceptions

Applications with no API routes do not need this configuration.

---

## Consequences Of Violation

Reliability risks: API clients receive unparseable HTML. Security risks: default HTML error pages may expose internal details in debug mode.

---

## Rule: Use Machine-Readable Error Types Instead of Parsing Status Codes or Messages

---

## Category

Maintainability

---

## Rule

Always include a stable machine-readable `type` field (e.g. `not_found`, `validation_error`, `unauthorized`) in API error envelopes. Never require clients to parse HTTP status codes or human-readable messages.

---

## Reason

HTTP status codes may evolve (e.g. 401 vs 403). Human-readable messages change with copy updates. A stable type string is the single source of truth for client-side error classification.

---

## Bad Example

```php
// Client must parse status code or message string
return response()->json(['error' => 'Not found'], 404);
```

---

## Good Example

```php
return response()->json([
    'error' => [
        'message' => 'Resource not found.',
        'type' => 'not_found',
        'code' => 404,
    ],
    'request_id' => $request->header('X-Request-Id'),
], 404);
```

---

## Exceptions

Simple APIs with a single consumer and no client-side branching logic may omit the type field.

---

## Consequences Of Violation

Maintenance risks: clients break when HTTP semantics change or messages are updated. Reliability risks: clients may misclassify errors based on fragile heuristics.

---

## Rule: Include a Request ID in Every API Error Response

---

## Category

Maintainability

---

## Rule

Always include a `request_id` in every API error response for traceability. Use the `X-Request-Id` header value from the incoming request.

---

## Reason

A request ID connects error responses to server logs, error tracker entries, and database query logs. Without it, debugging production errors requires correlating timestamps manually — which fails under load.

---

## Bad Example

```php
return response()->json(['error' => ['message' => 'Server error.', 'code' => 500]], 500);
```

---

## Good Example

```php
return response()->json([
    'error' => ['message' => 'Server error.', 'type' => 'server_error', 'code' => 500],
    'request_id' => $request->header('X-Request-Id'),
], 500);
```

---

## Exceptions

Internal services within the same network may use correlation IDs from the service mesh. In that case, use the platform's trace ID instead.

---

## Consequences Of Violation

Maintenance risks: developers cannot correlate error responses with log entries. Reliability risks: debugging production incidents takes significantly longer.

---

## Rule: Map HTTP Status Codes Correctly for Common Exception Types

---

## Category

Architecture

---

## Rule

Always use correct HTTP status codes per exception type: 401 for authentication failures, 403 for authorization failures, 422 for validation errors, 404 for not found, 409 for conflicts, 429 for rate limiting. Never default to 500 for known exceptions.

---

## Reason

Correct status codes enable API clients to implement proper error handling. A validation error returning 500 prevents clients from showing inline field errors. Standards compliance builds API reliability.

---

## Bad Example

```php
// All errors return 500 — clients can't distinguish error types
return response()->json(['error' => ['message' => $e->getMessage(), 'type' => 'error', 'code' => 500]], 500);
```

---

## Good Example

```php
$status = match (true) {
    $e instanceof ValidationException => 422,
    $e instanceof AuthenticationException => 401,
    $e instanceof AuthorizationException => 403,
    $e instanceof ModelNotFoundException => 404,
    $e instanceof ThrottleRequestsException => 429,
    default => 500,
};
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Reliability risks: API clients cannot distinguish error categories. Maintenance risks: client-side error handling becomes overly complex or incorrect.

---

## Rule: Configure shouldRenderJsonWhen for API Routes

---

## Category

Framework Usage

---

## Rule

Always configure `shouldRenderJsonWhen` in the exception handler to return JSON for `api/*` routes. Never rely solely on the `Accept: application/json` header.

---

## Reason

Many API clients (curl, SDKs, mobile apps) do not send the `Accept: application/json` header. Without explicit route-prefix detection, these clients receive HTML error pages they cannot parse.

---

## Bad Example

```php
// No shouldRenderJsonWhen — only clients with Accept: application/json get JSON
// curl requests to /api/users/999 get HTML 404
```

---

## Good Example

```php
$exceptions->shouldRenderJsonWhen(function (Request $request) {
    return $request->is('api/*') || $request->expectsJson();
});
```

---

## Exceptions

Applications without API routes do not need this configuration.

---

## Consequences Of Violation

Reliability risks: API clients receive HTML instead of JSON. Maintenance risks: debugging client errors becomes difficult when responses are inconsistent.

---

## Rule: Include Structured Field-Level Validation Errors in API Responses

---

## Category

Design

---

## Rule

Always include structured field-level error details in 422 API responses. Use a `field → messages` mapping that frontend frameworks can display inline. Never return a flat error string for validation failures.

---

## Reason

Frontend frameworks (React, Vue, mobile apps) map field-level errors to form inputs. A flat message string requires clients to parse and extract field errors, which is brittle and non-standard.

---

## Bad Example

```php
return response()->json(['error' => ['message' => 'The email field is required.', 'code' => 422]], 422);
```

---

## Good Example

```php
return response()->json([
    'error' => [
        'message' => 'Validation failed.',
        'type' => 'validation_error',
        'code' => 422,
        'details' => [
            'email' => ['The email field is required.'],
            'name' => ['The name must be at least 3 characters.'],
        ],
    ],
    'request_id' => $request->header('X-Request-Id'),
], 422);
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: frontend developers write brittle parsing logic. User experience: field-level errors cannot be displayed inline next to form inputs.

---

## Rule: Document API Error Format in OpenAPI/Swagger

---

## Category

Maintainability

---

## Rule

Always document the API error response envelope (fields, types, status codes) in your OpenAPI/Swagger specification. Never ship an API without a documented error contract.

---

## Reason

API consumers need to know the error response shape to write correct client code. Undocumented error formats lead to integration bugs and repeated questions from consumers.

---

## Bad Example

```yaml
# No error response schema defined
paths:
  /api/users/{id}:
    get:
      responses:
        '200':
          description: Successful response
```

---

## Good Example

```yaml
components:
  schemas:
    ApiError:
      type: object
      properties:
        error:
          type: object
          properties:
            message: { type: string }
            type:
              type: string
              enum: [not_found, validation_error, unauthorized, server_error]
            code: { type: integer }
            details: { type: object }
        request_id: { type: string }
```

---

## Exceptions

Internal-only APIs where all consumers are in the same codebase may omit formal documentation but should still maintain a consistent format.

---

## Consequences Of Violation

Maintenance risks: external consumers build integrations based on undocumented assumptions. Reliability risks: client code breaks when the undocumented format changes.

---

## Rule: Never Leak User-Specific Information in Public Error Messages

---

## Category

Security

---

## Rule

Always keep API error messages generic. Never include email addresses, user IDs, database IDs, or any user-specific data in public error responses.

---

## Reason

Error responses are visible to API consumers and often to end users. Leaked user data enables enumeration attacks (e.g. "User with email test@example.com not found" confirms the email exists).

---

## Bad Example

```php
// Leaks that this email exists in the system
abort(404, "User with email test@example.com not found.");
```

---

## Good Example

```php
// Generic message — no information about whether the user exists
abort(404, 'User not found.');
```

---

## Exceptions

Internal B2B APIs with strict authentication and no end-user visibility may include internal identifiers, but only after security review.

---

## Consequences Of Violation

Security risks: attackers enumerate valid users, orders, or resources. Compliance risks: GDPR/CCPA violations from exposing personal data in error messages.

---

## Rule: Use Centralized Error Formatting, Not Per-Controller JsonResponse

---

## Category

Code Organization

---

## Rule

Never return `response()->json(...)` error responses directly from controllers. Always throw an exception and let the centralized exception handler generate the error response.

---

## Reason

Per-controller error responses are inconsistent across endpoints (different keys, formats, status codes). A centralized handler ensures every error goes through the same formatting pipeline.

---

## Bad Example

```php
class UserController
{
    public function show(string $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['error' => 'Not found', 'code' => 'USER_404'], 404);
        }
    }
}
```

---

## Good Example

```php
class UserController
{
    public function show(string $id)
    {
        $user = User::findOrFail($id); // Throws ModelNotFoundException → handler returns JSON
    }
}
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: inconsistent error formats across endpoints. Reliability risks: API consumers must handle multiple response shapes for the same error condition.
