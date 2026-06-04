# Anti-Patterns: JSON Error Formatting

## 1. The HTML Leak

Returning HTML error pages to API clients because `shouldRenderJsonWhen` is not configured.

```php
// No shouldRenderJsonWhen — clients without Accept: application/json get HTML
// curl, SDKs, mobile apps all receive unparseable HTML error pages
```

Always configure `shouldRenderJsonWhen` using both route prefix and Accept header checks:

```php
$exceptions->shouldRenderJsonWhen(function (Request $request) {
    return $request->is('api/*') || $request->expectsJson();
});
```

This prevents the common failure where API routes return HTML to clients that don't send the `Accept: application/json` header.

## 2. The Inconsistent Envelope

Different endpoints returning different JSON error structures.

```php
// /api/users returns { error: 'Not found' }
// /api/posts returns { success: false, data: { msg: 'Post missing' } }
```

Define a single consistent envelope structure across all error responses:

```php
return response()->json([
    'error' => [
        'message' => 'Resource not found.',
        'type' => 'not_found',
        'code' => 404,
        'details' => $e instanceof ValidationException ? $e->errors() : null,
    ],
    'request_id' => $request->header('X-Request-Id'),
], 404);
```

A consistent structure means API clients write one error handler, not one per endpoint.

## 3. The Sensitive Spill

Exposing stack traces, file paths, or internal class names in production API error responses.

```php
// Never expose in production
return response()->json([
    'error' => 'Server error',
    'trace' => $e->getTraceAsString(),
    'file' => $e->getFile(),
    'line' => $e->getLine(),
], 500);
```

Keep error messages generic in production; log technical details internally. Stack traces reveal internal paths, line numbers, and class names that attackers use to find vulnerabilities. Also avoid leaking user-specific information — "User with email test@example.com not found" confirms the email exists in the system.

## 4. The Missing Catch-All

Only registering `renderable()` callbacks for specific exception types without a catch-all for `Throwable` in API routes.

```php
// Only handling specific types — unhandled exceptions fall through to HTML
$exceptions->renderable(function (ValidationException $e, Request $request) {
    return response()->json(['error' => $e->getMessage()], 422);
});
```

Always register a catch-all `renderable()` for `Throwable` that returns JSON for API routes. Any unhandled exception type (including unexpected runtime errors) will fall through to Laravel's default HTML error page.

```php
$exceptions->renderable(function (Throwable $e, Request $request) {
    if (!$request->is('api/*') && !$request->expectsJson()) {
        return;
    }
    return response()->json([/* envelope */], 500);
});
```

## 5. The Per-Controller Error Response

Returning `response()->json(...)` error responses directly from controllers instead of throwing exceptions and letting the centralized handler generate the response.

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

Per-controller error responses are inconsistent across endpoints (different keys, formats, status codes). Throw exceptions and let the centralized handler ensure every error goes through the same formatting pipeline:

```php
class UserController
{
    public function show(string $id)
    {
        return User::findOrFail($id); // Throws ModelNotFoundException → handler returns JSON
    }
}
```

## 6. The Status Code Blur

Mapping all exceptions to 500 instead of using correct HTTP status codes per exception type.

```php
// All errors return 500 — clients can't distinguish error types
return response()->json(['error' => ['message' => $e->getMessage(), 'type' => 'error', 'code' => 500]], 500);
```

Use status codes correctly per exception type: 401 for authentication failures, 403 for authorization failures, 422 for validation errors, 404 for not found, 409 for conflicts, 429 for rate limiting, 500 for server errors. Incorrect status codes prevent API clients from implementing proper error handling.

## 7. The Undocumented Contract

Shipping an API without documenting the error response format.

```yaml
# No error response schema defined
paths:
  /api/users/{id}:
    get:
      responses:
        '200':
          description: Successful response
```

Always document the error response envelope (fields, types, status codes) in your OpenAPI/Swagger specification. API consumers need to know the error response shape to write correct client code. Undocumented error formats lead to integration bugs and repeated questions.
