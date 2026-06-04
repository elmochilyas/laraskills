# JSON Error Formatting

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** JSON Error Formatting
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

API exception handling ensures that all exceptions thrown in API routes produce consistent, structured JSON responses instead of HTML error pages. Every exception type (validation, auth, not found, server error) must map to a predictable JSON envelope that API clients can parse programmatically.

The engineering value is a predictable API contract for error conditions. Clients don't need to parse HTML or guess response formats. Every error response follows the same structure, with the same fields, regardless of which endpoint or what type of error occurred.

## Core Concepts

- **JSON Error Envelope:** A consistent JSON structure returned for all API errors. Typically includes `message`, `type` (machine-readable), `code` (HTTP status), and optionally `details` (field-level errors).
- **JSON Detection:** Laravel detects JSON requests via `$request->expectsJson()` (checks `Accept: application/json` header) or explicit route prefix checks (`$request->is('api/*')`).
- **Error Type as Machine-Readable Signal:** The `type` field (e.g., `not_found`, `validation_error`, `unauthorized`, `server_error`) is more stable than parsing HTTP status codes or human-readable messages.
- **Validation Error Details:** Field-level validation errors use a structured format (field → messages mapping) that frontend frameworks can display inline.

## When To Use

- Every API route — all exceptions must return JSON, never HTML
- Single-page applications using Inertia (Inertia expects JSON error responses for 422s)
- Mobile app backends
- Third-party API services with documented error contracts
- Microservices communicating via HTTP

## When NOT To Use

- Pure web applications with no API routes — HTML error pages are appropriate
- Applications where all requests go through Blade/views — the default handler behavior suffices
- Static API clients don't need machine-readable error types — a simple message is enough

## Best Practices (WHY)

- **Why a consistent envelope:** API clients write one error handler, not one per status code. Consistent structure simplifies client-side error handling.
- **Why machine-readable types:** Clients can switch on `type` string rather than parsing HTTP status codes. More stable — the type doesn't change when HTTP semantics evolve.
- **Why never expose stack traces:** Stack traces reveal internal paths, line numbers, and class names. Attackers use this information to find vulnerabilities.
- **Why request IDs:** A request ID header enables tracing errors across logs and error reports. Essential for debugging distributed systems.

## Architecture Guidelines

- Use a global `renderable()` callback for `Throwable` in API routes as a catch-all
- Define a consistent error envelope: `message` (human-readable), `type` (machine-readable), `code` (HTTP status), `details` (optional field-level errors)
- Include a `request_id` for traceability
- Return 401 for authentication failures, 403 for authorization, 422 for validation, 409 for conflicts
- Document the error response format in API documentation (OpenAPI/Swagger)

## Performance

API error handling adds minimal overhead: `$request->is('api/*')` is a string match (~0.001ms). Generating the JSON response adds ~0.1ms. No performance concern.

## Security

- Never expose stack traces, file paths, or internal error details in API responses
- Keep error messages generic — specific details go in logs, not responses
- Use a catch-all `renderable()` for `Throwable` to ensure all errors return JSON, not HTML
- Avoid leaking user-specific information in error messages (email addresses, user IDs)

## Common Mistakes

1. **Stack Traces in Production API Responses:** `'trace' => $e->getTraceAsString()` exposes internal paths, line numbers, and class names. Never expose in production.

2. **Inconsistent Error Format:** Different controllers returning different error formats forces clients to write conditional error handling per endpoint. Use a centralized handler.

3. **Not Handling 500 Errors:** Handler only has callbacks for specific types. Unhandled exceptions fall through to HTML error pages. Always add a catch-all `renderable()` for `Throwable`.

4. **API Client Receives HTML:** The handler's `shouldRenderJsonWhen()` is not configured, or the request lacks the `Accept` header. Client can't parse HTML. Mitigate with explicit `$request->is('api/*')`.

## Anti-Patterns

- **The HTML Leak:** API routes returning HTML error pages because no JSON render callback exists. The client crashes trying to parse HTML. Always configure `shouldRenderJsonWhen`.
- **The Inconsistent Envelope:** Different error responses with different structures (`{error: msg}`, `{message: msg}`, `{success: false, data: {error: msg}}`). Forces clients to handle multiple formats.
- **The Sensitive Spill:** Error messages containing user emails, database details, or internal IDs. Keep messages generic for API consumers; log specifics internally.

## Examples

### Global API Error Handler
```php
$exceptions->renderable(function (Throwable $e, Request $request) {
    if (!$request->is('api/*') && !$request->expectsJson()) {
        return;
    }

    $status = match (true) {
        $e instanceof HttpExceptionInterface => $e->getStatusCode(),
        $e instanceof ValidationException => 422,
        $e instanceof AuthenticationException => 401,
        $e instanceof AuthorizationException => 403,
        $e instanceof ModelNotFoundException => 404,
        default => 500,
    };

    $type = match (true) {
        $e instanceof ValidationException => 'validation_error',
        $e instanceof AuthenticationException => 'authentication_error',
        $e instanceof AuthorizationException => 'authorization_error',
        $e instanceof NotFoundHttpException, $e instanceof ModelNotFoundException => 'not_found',
        $e instanceof ThrottleRequestsException => 'rate_limited',
        $status >= 500 => 'server_error',
        default => 'error',
    };

    return response()->json([
        'error' => [
            'message' => $status >= 500 && !app()->environment('local')
                ? 'Server error.'
                : $e->getMessage(),
            'type' => $type,
            'code' => $status,
            'details' => $e instanceof ValidationException ? $e->errors() : null,
        ],
        'request_id' => $request->header('X-Request-Id'),
    ], $status);
});
```

### Structured API Error Response Class
```php
class ApiErrorResponse
{
    public static function fromException(Throwable $e, Request $request): JsonResponse
    {
        $code = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
        $type = self::resolveType($code, $e);

        $response = [
            'error' => [
                'message' => $e->getMessage() ?: 'An unexpected error occurred.',
                'type' => $type,
                'code' => $code,
            ],
            'request_id' => $request->header('X-Request-Id'),
        ];

        if ($e instanceof ValidationException) {
            $response['error']['details'] = $e->errors();
        }

        return response()->json($response, $code);
    }
}
```

### API Validation Error Format
```php
$exceptions->renderable(function (ValidationException $e, Request $request) {
    if (!$request->is('api/*')) {
        return;
    }

    $errors = collect($e->errors())->map(function ($messages, $field) {
        return ['field' => $field, 'messages' => $messages, 'code' => "validation.{$field}"];
    })->values();

    return response()->json(['message' => 'Validation failed.', 'errors' => $errors], 422);
});
```

## Related Topics

- **Exception Handler Configuration** — base exception handling concepts
- **HTTP Exception Rendering** — mapping HTTP errors to responses
- **Validation Error Formatting** — API validation error responses
- **Custom Exceptions** — domain-specific API exceptions

## AI Agent Notes

- Configure a global `renderable()` for `Throwable` as a catch-all for API routes
- Use a consistent JSON envelope: message, type, code, details
- Never include `trace` or `line` in production API responses
- Include `request_id` for traceability
- Document the error format in OpenAPI/Swagger
- Use machine-readable error types for client-side logic

## Verification

- [ ] Global `renderable()` callback exists for `Throwable` in API routes
- [ ] Consistent JSON envelope is used across all error responses
- [ ] `shouldRenderJsonWhen` is configured for API routes
- [ ] No stack traces are exposed in production API responses
- [ ] Machine-readable error types are used (`not_found`, `validation_error`, etc.)
- [ ] Request ID is included for traceability
- [ ] Validation errors include field-level details in structured format
- [ ] Error format is documented in API documentation
