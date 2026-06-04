# Skill: Configure Global API Error Handler

## Purpose

Set up the Laravel exception handler to return consistent JSON error responses for all API routes, ensuring every exception type produces a structured envelope with message, type, code, and optional details.

## When To Use

- Any Laravel application with API routes (`/api/*`)
- When migrating an existing app from HTML-only error pages to API support
- When onboarding a new API-first project

## When NOT To Use

- Applications with no API routes — HTML error pages are appropriate
- API clients that only need a simple message string with no structured format
- Applications already using a third-party error formatting package that handles this

## Prerequisites

- Laravel 11+ (uses `withExceptions()` in `bootstrap/app.php`) or Laravel 10- (uses `App\Exceptions\Handler`)
- API routes defined in `routes/api.php`
- Understanding of the exception handler lifecycle: `shouldReport`, `report`, `shouldRender`, `render`

## Inputs

- The request object (to check route prefix and `Accept` header)
- The thrown exception (to determine status code, message, and type)
- Application environment (`local` vs `production`) for message disclosure

## Workflow

1. Open the exception handler configuration (`bootstrap/app.php` for Laravel 11+, or `App\Exceptions\Handler::register()` for Laravel 10-).

2. Configure `shouldRenderJsonWhen` to return `true` for `api/*` routes:
   ```php
   $exceptions->shouldRenderJsonWhen(function (Request $request) {
       return $request->is('api/*') || $request->expectsJson();
   });
   ```

3. Register a catch-all `renderable()` callback for `Throwable`:
   ```php
   $exceptions->renderable(function (Throwable $e, Request $request) {
       if (!$request->is('api/*') && !$request->expectsJson()) {
           return;
       }
       // Map exception to status code and type
   });
   ```

4. Map the exception type to an HTTP status code using a match expression:
   - `HttpExceptionInterface` → `$e->getStatusCode()`
   - `ValidationException` → `422`
   - `AuthenticationException` → `401`
   - `AuthorizationException` → `403`
   - `ModelNotFoundException` → `404`
   - `ThrottleRequestsException` → `429`
   - Default → `500`

5. Map the exception to a machine-readable type string:
   - `ValidationException` → `validation_error`
   - `AuthenticationException` → `authentication_error`
   - `AuthorizationException` → `authorization_error`
   - `NotFoundHttpException` / `ModelNotFoundException` → `not_found`
   - `ThrottleRequestsException` → `rate_limited`
   - Status >= 500 → `server_error`
   - Default → `error`

6. Build the JSON envelope with message, type, code, details, and request_id:
   ```php
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
   ```

7. Ensure no `trace`, `file`, or `line` fields are included in the production response body.

## Validation Checklist

- [ ] Catch-all `renderable()` for `Throwable` exists and returns JSON for API routes
- [ ] `shouldRenderJsonWhen` is configured using both route prefix and `Accept` header
- [ ] HTTP status code is mapped correctly per exception type (401, 403, 422, 404, 429, 500)
- [ ] Machine-readable type string is included in every response
- [ ] No stack traces, file paths, or line numbers appear in production JSON responses
- [ ] Request ID is included from the `X-Request-Id` header
- [ ] Validation error responses include field-level `details` mapping
- [ ] Generic error message is used for 500-level errors in non-local environments

## Common Failures

1. **HTML leak to API clients**: `shouldRenderJsonWhen` missing or insufficient — clients receive HTML error pages instead of JSON.

2. **Inconsistent envelope shape**: Different `renderable()` callbacks return different JSON structures (different keys, nesting levels).

3. **Missing catch-all**: Only specific exception types have `renderable()` callbacks — a new or unexpected exception type falls through to HTML.

4. **Stack trace in production**: Debug information included in production responses via `$e->getTraceAsString()` or `app_debug` conditional that leaks in production.

5. **Wrong status codes**: Validation errors returning `500` instead of `422`, or auth failures returning `500` instead of `401`.

## Decision Points

- **Route prefix vs Accept header**: Use `$request->is('api/*')` as the primary check and `$request->expectsJson()` as fallback. Some clients omit the Accept header.
- **Message disclosure**: Show `$e->getMessage()` in local, generic "Server error." in production for 500s. For non-500 errors, show the original message since it's user-facing.
- **Type vs code for client logic**: Clients should switch on the `type` string, not the HTTP status code, because types are more stable.

## Performance Considerations

- `$request->is('api/*')` is a string match (~0.001ms)
- JSON response generation adds ~0.1ms
- No performance concern; exception handling is not a hot path

## Security Considerations

- Never expose `$e->getTraceAsString()`, `$e->getFile()`, or `$e->getLine()` in production responses
- Keep error messages generic — specific details go to logs, not the client
- User-specific information (email, user ID) must not appear in error messages to prevent enumeration attacks
- The `request_id` field enables tracing without leaking internals

## Related Rules

- Always Return Consistent JSON Envelope for API Errors
- Never Expose Stack Traces or Internal Paths in Production API Responses
- Always Configure a Catch-All renderable() for Throwable in API Routes
- Use Machine-Readable Error Types Instead of Parsing Status Codes or Messages
- Include a Request ID in Every API Error Response
- Map HTTP Status Codes Correctly for Common Exception Types
- Configure shouldRenderJsonWhen for API Routes

## Related Skills

- Create a Typed Custom Exception Class (custom-exception-classes)
- Configure the Exception Handler (exception-fundamentals)

## Success Criteria

- All API routes return JSON errors with the same envelope structure
- No API route ever returns an HTML error page
- Clients can switch on the `type` field to determine error category
- Every error response includes a `request_id` for traceability
- Stack traces are never exposed in production responses

---

# Skill: Implement API Validation Error Responses

## Purpose

Format validation error responses in API routes as structured field-to-messages mappings that frontend frameworks can display inline, with the full JSON envelope.

## When To Use

- API endpoints that accept form data and return validation errors
- Single-page applications and mobile apps consuming your API
- When frontend developers need field-level error mapping

## When NOT To Use

- Pure web applications with Blade forms — the default redirect-back behavior is appropriate
- APIs that only accept pre-validated data from trusted sources

## Prerequisites

- A functioning global API error handler (see "Configure Global API Error Handler")
- FormRequest or `Validator`-based validation in API endpoints

## Inputs

- `ValidationException` instance carrying the Validator and its errors
- The incoming request (to determine JSON vs HTML format)

## Workflow

1. Locate the `renderable()` callback for `ValidationException` in your exception handler, or add it above the catch-all:
   ```php
   $exceptions->renderable(function (ValidationException $e, Request $request) {
       if (!$request->is('api/*') && !$request->expectsJson()) {
           return;
       }
   ```

2. Extract the fielded errors via `$e->errors()` (returns `['field' => ['message1', 'message2']]`).

3. Optionally transform errors into a structured array with field, messages, and error code:
   ```php
   $errors = collect($e->errors())->map(function ($messages, $field) {
       return ['field' => $field, 'messages' => $messages, 'code' => "validation.{$field}"];
   })->values();
   ```

4. Return the JSON envelope with `details` containing the field-level mapping:
   ```php
   return response()->json([
       'error' => [
           'message' => 'Validation failed.',
           'type' => 'validation_error',
           'code' => 422,
           'details' => $e->errors(),
       ],
       'request_id' => $request->header('X-Request-Id'),
   ], 422);
   ```

5. Verify the catch-all `Throwable` callback does not override the `ValidationException` response — order callbacks from most-specific to most-general.

## Validation Checklist

- [ ] Validation error responses include `details` with field → messages mapping
- [ ] Each field maps to an array of error strings (not a single string)
- [ ] Response status is `422` for all validation failures
- [ ] The `type` field is `validation_error`
- [ ] The `message` field is a summary string (e.g. "Validation failed.")
- [ ] Non-API requests still get the default redirect-back behavior

## Common Failures

1. **Flat error string**: Returning a single message like "The email field is required." instead of field-mapped errors, forcing frontend devs to parse strings.

2. **Override by catch-all**: The catch-all `Throwable` callback fires before the `ValidationException` callback, applying the generic envelope instead of the validation-specific format.

3. **Inconsistent field format**: Some endpoints return `{field: [messages]}` while others return `[{field, messages}]`, forcing conditional frontend logic.

## Decision Points

- **Field-keyed vs array format**: Use `$e->errors()` (field → array of messages) format. It's the Laravel default and matches frontend expectations for React/Vue form libraries.
- **Custom error codes**: Add a `code` per field (e.g. `validation.email`) only if the frontend needs to programmatically identify specific errors.

## Performance Considerations

- `$e->errors()` returns a pre-built array — no additional computation
- JSON encoding of the validation envelope adds ~0.1ms
- Negligible impact on request lifecycle

## Security Considerations

- Validation error messages may reveal accepted input formats (e.g. password requirements)
- This is acceptable — it's part of the API contract, not sensitive information
- Do not include the submitted values in error responses

## Related Rules

- Include Structured Field-Level Validation Errors in API Responses
- Map HTTP Status Codes Correctly for Common Exception Types
- Never Expose Stack Traces or Internal Paths in Production API Responses

## Related Skills

- Configure Global API Error Handler (this file, above)
- Create a Typed Custom Exception Class (custom-exception-classes)

## Success Criteria

- Every `422` API response includes field-level error details
- Frontend frameworks can map errors directly to form inputs
- Validation errors are distinguishable from other 422 errors by the `validation_error` type
- Non-API validation still redirects back with flashed errors
