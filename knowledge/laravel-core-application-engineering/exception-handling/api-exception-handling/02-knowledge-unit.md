# API Exception Handling

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** API Exception Handling
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

API exception handling ensures that all exceptions thrown in API routes produce consistent, structured JSON responses instead of HTML error pages. Every exception type (validation, auth, not found, server error) must map to a predictable JSON envelope that API clients can parse programmatically.

The engineering value is a predictable API contract for error conditions. Clients don't need to parse HTML or guess response formats. Every error response follows the same structure, with the same fields, regardless of which endpoint or what type of error occurred.

---

## Core Concepts

### API Error Response Contract

```json
// Standard envelope
{
    "error": {
        "message": "The requested resource was not found.",
        "type": "not_found",
        "code": 404,
        "details": {
            "resource": "user",
            "id": 999
        }
    },
    "request_id": "req_abc123"
}
```

### JSON Detection

Laravel's handler detects JSON requests via:

```php
$request->expectsJson();  // Checks Accept header or X-Requested-With
$request->is('api/*');    // Checks URL prefix
```

### Default API Error Format

```json
// Laravel default for API errors
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."]
    }
}
```

---

## Mental Models

### The Universal Error Envelope

Every API error response should follow the same structure. Whether it's a 400, 401, 403, 404, 422, or 500, the client receives a JSON object with `error` (message + details) and optionally `errors` (field-level validation errors). The client writes ONE error handler, not one per status code.

### The Error Type as a Machine-Readable Signal

The `type` field is a machine-readable string like `not_found`, `validation_error`, `unauthorized`, `server_error`. Clients can switch on this string rather than parsing the HTTP status code or message. This is more stable than relying on status codes or human-readable messages.

---

## Internal Mechanics

### Handler Configuration for API

```php
// bootstrap/app.php (Laravel 11+)
->withExceptions(function (Exceptions $exceptions) {
    $exceptions->shouldRenderJsonWhen(function (Request $request) {
        return $request->is('api/*') || $request->expectsJson();
    });

    $exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
        if ($request->is('api/*')) {
            return response()->json([
                'error' => [
                    'message' => 'Resource not found.',
                    'type' => 'not_found',
                    'code' => 404,
                ],
            ], 404);
        }
    });
})
```

### Structured API Error Response

```php
// app/Exceptions/Api/ApiErrorResponse.php
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

    protected static function resolveType(int $code, Throwable $e): string
    {
        return match (true) {
            $e instanceof ValidationException => 'validation_error',
            $e instanceof NotFoundHttpException => 'not_found',
            $e instanceof AuthenticationException => 'unauthenticated',
            $e instanceof AuthorizationException => 'forbidden',
            $code >= 500 => 'server_error',
            default => 'request_error',
        };
    }
}
```

---

## Patterns

### Global API Handler

```php
// Handler's register() method
$this->renderable(function (Throwable $e, Request $request) {
    if (!$request->is('api/*') && !$request->expectsJson()) {
        return; // Let HTML handler deal with it
    }

    $status = $this->getHttpStatusCode($e);

    return response()->json([
        'success' => false,
        'error' => [
            'code' => $status,
            'message' => $this->getErrorMessage($e, $status),
            'type' => $this->getErrorType($e),
        ],
        'request_id' => $request->header('X-Request-Id', uniqid()),
    ], $status);
});

protected function getHttpStatusCode(Throwable $e): int
{
    if ($e instanceof HttpExceptionInterface) {
        return $e->getStatusCode();
    }
    if ($e instanceof ValidationException) {
        return 422;
    }
    if ($e instanceof AuthenticationException) {
        return 401;
    }
    if ($e instanceof AuthorizationException) {
        return 403;
    }
    if ($e instanceof ModelNotFoundException) {
        return 404;
    }
    return 500;
}

protected function getErrorMessage(Throwable $e, int $status): string
{
    return match (true) {
        $status === 401 => 'Unauthenticated.',
        $status === 403 => 'Forbidden.',
        $status === 404 => 'Resource not found.',
        $status === 422 => 'The given data was invalid.',
        $status >= 500 && !app()->environment('local') => 'Server error.',
        default => $e->getMessage() ?: 'An error occurred.',
    };
}

protected function getErrorType(Throwable $e): string
{
    return match (true) {
        $e instanceof ValidationException => 'validation_error',
        $e instanceof AuthenticationException => 'authentication_error',
        $e instanceof AuthorizationException => 'authorization_error',
        $e instanceof NotFoundHttpException, $e instanceof ModelNotFoundException => 'not_found',
        $e instanceof ThrottleRequestsException => 'rate_limited',
        $e instanceof HttpExceptionInterface && $e->getStatusCode() >= 500 => 'server_error',
        default => 'error',
    };
}
```

### Per-Resource Error Responses

```php
$this->renderable(function (NotFoundHttpException $e, Request $request) {
    if (!$request->is('api/*')) {
        return;
    }

    // Extract resource type from route or exception
    $previous = $e->getPrevious();
    $resource = $previous instanceof ModelNotFoundException
        ? class_basename($previous->getModel())
        : 'resource';

    return response()->json([
        'error' => [
            'message' => "{$resource} not found.",
            'type' => 'not_found',
            'resource' => Str::snake($resource),
        ],
    ], 404);
});
```

### API Validation Error Details

```php
$this->renderable(function (ValidationException $e, Request $request) {
    if (!$request->is('api/*')) {
        return;
    }

    $errors = collect($e->errors())->map(function ($messages, $field) {
        return [
            'field' => $field,
            'messages' => $messages,
            'code' => "validation.{$field}",
        ];
    })->values();

    return response()->json([
        'message' => 'Validation failed.',
        'errors' => $errors,
    ], 422);
});
```

---

## Architectural Decisions

### Single Global Handler vs Per-Exception Callbacks

| Concern | Global Handler | Per-Exception Callbacks |
|---|---|---|
| DRY | Single code path | Repeated conditional logic |
| Exception-specific needs | One-size-fits-all | Custom per type |
| Maintainability | One method to change | Many callbacks |
| Clarity | All logic in one place | Clear what each type does |

Start with a global handler for consistency. Add per-exception callbacks when specific types need distinct behavior (e.g., validation errors include field-level details; 401s include auth URLs).

### Error Envelope Format

| Field | Required? | Description |
|---|---|---|
| `message` | Yes | Human-readable error description |
| `type` | Yes | Machine-readable error category |
| `code` | Yes | HTTP status code |
| `details` | No | Field-level errors (validation) |
| `request_id` | Recommended | Traceability |

---

## Tradeoffs

| Concern | Structured API Errors | Default Error Pages |
|---|---|---|
| Client integration | Standardized parsing | Must handle HTML/JSON divergence |
| Security | Control over info leakage | Stack traces may leak |
| Debugging | Missing stack trace in production | Full trace in debug mode |
| Development speed | Setup time upfront | Built-in |

---

## Performance Considerations

API error handling adds minimal overhead: checking `$request->is('api/*')` is a string match (~0.001ms). Generating the JSON response adds ~0.1ms. No performance concern.

---

## Production Considerations

- Always return JSON for API routes — never HTML
- Never expose stack traces, file paths, or internal error details in API responses
- Use a request ID header for traceability across logs and error reports
- Return consistent error envelope structure across all endpoints and error types
- Log all API errors with request context (user ID, route, parameters)
- Use 401 for authentication failures, 403 for authorization failures
- Use 422 for validation errors, with field-level details
- Use 409 for resource conflicts (duplicate entry, stale data)
- Document the error response format in your API documentation
- Test every error path in API integration tests

---

## Common Mistakes

### Stack Traces in Production API Responses

```php
// Bad — exposes internal paths, line numbers, and class names
return response()->json([
    'message' => $e->getMessage(),
    'trace' => $e->getTraceAsString(), // NEVER do this
], 500);
```

### Inconsistent Error Format

```php
// UserController returns {'error': 'msg', 'code': 400}
// TeamController returns {'message': 'msg', 'status': 400}
// BillingController returns {'success': false, 'data': {'error': 'msg'}}
```

Different controllers returning different error formats force clients to write conditional error handling per endpoint. Use a centralized handler for consistency.

### Not Handling 500 Errors

```php
// Handler only handles specific types
$this->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->is('api/*')) { return ...; }
});
$this->renderable(function (ValidationException $e, Request $request) {
    if ($request->is('api/*')) { return ...; }
});
// Unhandled: 500 errors fall through to HTML error page
```

Always add a catch-all `renderable()` for `Throwable` in API routes.

---

## Failure Modes

### API Client Receives HTML

The API route returns HTML because the handler's `shouldRenderJsonWhen()` callback is not configured, or the request doesn't have the right `Accept` header. The client can't parse HTML and crashes. Mitigate: always check `$request->is('api/*')` explicitly.

### Sensitive Data in Error Messages

```php
throw new NotFoundHttpException("User with email 'admin@example.com' not found.");
```

The email address leaks into the API response. Keep error messages generic — specific details go in logs, not responses.

---

## Ecosystem Usage

### Laravel Telescope

Telescope's exception watcher captures API exception details including request context, making it easier to debug API error responses during development.

### Postman / Insomnia

API error responses can be documented and tested using API clients that validate the JSON structure of error responses against the defined contract.

### OpenAPI / Swagger

Error response schemas can be documented in OpenAPI specifications, ensuring API consumers know the exact error structure for each endpoint.

### Sentry / Flare

Error tracking services capture API error responses with full request context, enabling teams to monitor API error rates and response quality in production.

---

## Related Knowledge Units

- **Exception Fundamentals** (this workspace) — base exception handling concepts
- **HTTP Exceptions** (this workspace) — mapping HTTP errors to responses
- **Validation Exceptions** (this workspace) — API validation error responses
- **Global Exception Handling** (this workspace) — customizing the handler for APIs
- **Custom Exception Classes** (this workspace) — domain-specific API exceptions
- **Exception Testing** (this workspace) — testing API error responses

---

## Research Notes

- `$request->expectsJson()` checks `Accept: application/json` header
- `$request->is('api/*')` checks URL prefix — configure based on your route structure
- Laravel 11 `withExceptions()` provides `shouldRenderJsonWhen()` for JSON detection
- JSON API specification (jsonapi.org) defines standard error response format
- OpenAPI/Swagger can document error response schemas per endpoint
- Sentry/Flare automatically capture and format API errors if integrated
- Common API error types: `authentication_error`, `authorization_error`, `not_found`, `validation_error`, `rate_limited`, `server_error`
- Request ID headers (`X-Request-Id`) enable tracing errors across distributed systems
- API rate limit errors (429) should include `Retry-After` header in addition to JSON body
