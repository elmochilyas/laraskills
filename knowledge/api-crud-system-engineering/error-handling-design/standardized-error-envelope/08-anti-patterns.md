# Anti-Patterns — Standardized Error Envelope

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Standardized Error Envelope |
| Difficulty | Foundation |
| Category | Design Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Different Envelope Per Endpoint | Critical | High | Code review: controllers return different error shapes |
| Nested Error Inside Data | High | Medium | Code review: `{ data: { error: ... } }` shape |
| Raw ValidationException Output | High | High | Code review: no envelope wrapping for 422 responses |
| Including Stack Traces in Dev-Only | Medium | High | Code review: envelope fields conditionally contain stack traces in dev |
| Envelope as Associative Array | Medium | High | Code review: `return response()->json(['code' => ..., 'message' => ...])` without a typed class |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Adding `success: false` to Envelope | Redundant boolean alongside HTTP status | Duplicated semantics; must be kept in sync with status code |
| Envelope Versioning Per API Version | Different envelope shapes for v1 vs v2 | Clients must parse errors differently per version |
| HTML Error Pages for API Routes | Non-JSON error responses for `Accept: application/json` requests | Clients fail to parse HTML as JSON |

---

## Anti-Pattern Details

### AP-SEE-01: Different Envelope Per Endpoint

**Description**: The error envelope shape varies across endpoints — some use `{ error: { code, message } }`, others use `{ message: string, status: number }`, and some return raw framework exceptions. Clients cannot write a single error parser and must handle each endpoint's unique shape. This defeats the entire purpose of standardization.

**Root Cause**: Decentralized error handling. Each controller or service implements its own error formatting without a shared contract.

**Impact**:
- Client code must branch by endpoint for error parsing
- New endpoints must re-implement error formatting
- Integration tests require endpoint-specific error assertions
- Error monitoring tools (Sentry, Datadog) cannot extract structured fields

**Detection**:
- Code review: multiple `response()->json()` calls in different controllers formatting errors differently
- Code review: no global exception handler override for JSON responses
- Integration tests: different error response structures across endpoints

**Solution**:
- Use a single `ErrorEnvelope` class throughout the application
- Register a fallback `render()` in the exception handler that wraps all uncaught exceptions
- Remove ad-hoc error formatting from controllers; let the handler handle it

**Example**:
```php
// BEFORE: Per-endpoint shapes
// UserController returns: { "error": "Not found" }
// PostController returns: { "message": "Post not found", "status": 404 }
// CommentController throws ModelNotFoundException (Laravel default HTML)

// AFTER: Single envelope everywhere
class Handler extends ExceptionHandler
{
    public function register(): void
    {
        $this->renderable(function (Throwable $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(
                    new ErrorEnvelope('GENERIC_ERROR', 'An error occurred.', 500),
                    500,
                );
            }
        });
    }
}
```

---

### AP-SEE-02: Nested Error Inside Data

**Description**: The error envelope is placed inside a `data` key alongside the success response shape: `{ data: { error: { code, message } } }`. This conflates success and error response structures, forcing clients to inspect the HTTP status code before deciding how to parse the body. Clients expecting `response.data` for success will accidentally navigate into error objects.

**Root Cause**: Reusing a single response serializer for both success and error cases. The developer builds a "unified" response that puts everything in `data`.

**Impact**:
- Client code must check HTTP status before parsing body structure
- TypeScript/Flow type unions must handle `{ data: SuccessType } | { data: { error: ErrorType } }`
- Error monitoring tools index `data.error` instead of top-level `error`
- Swagger/OpenAPI schemas become more complex with conditional shapes

**Detection**:
- Code review: `response()->json(['data' => ['error' => ...]])` in error paths
- Code review: a shared `ApiResponse` class that puts both success and error contents into `data`
- Client-side review: destructuring assumes `error` is at top level but finds it nested

**Solution**:
- Keep error fields at the top level under `error`, never inside `data`
- Success responses use `data`; error responses use `error` — they are mutually exclusive top-level keys
- Use separate resource classes for success and error responses

**Example**:
```php
// BEFORE: Error inside data
public function show(int $id): JsonResponse
{
    try {
        return response()->json(['data' => UserResource::make(User::findOrFail($id))]);
    } catch (ModelNotFoundException $e) {
        return response()->json(['data' => ['error' => 'User not found']], 404); // ❌ nested
    }
}

// AFTER: Error at top level
public function show(int $id): JsonResponse
{
    try {
        return response()->json(['data' => UserResource::make(User::findOrFail($id))]);
    } catch (ModelNotFoundException $e) {
        return response()->json(
            new ErrorEnvelope(ErrorCodes::RESOURCE_NOT_FOUND, 'User not found.', 404),
            404,
        );
    }
}
```

---

### AP-SEE-03: Raw ValidationException Output

**Description**: Laravel's default `ValidationException` renders errors as a flat key-value array: `{ "email": ["The email field is required."] }`. This bypasses the standardized error envelope entirely. Clients expecting `{ error: { code, message, status, detail: { fields } } }` instead receive a bare array, breaking their error parser.

**Root Cause**: Relying on Laravel's default `failedValidation()` behavior without overriding it to wrap the response in the envelope.

**Impact**:
- Clients cannot generically parse validation errors — special-case needed for 422
- Error envelope contract is violated for the most common error type (422)
- Inconsistent response shape between validation errors and other 4xx errors
- Client type definitions must account for two distinct error shapes

**Detection**:
- Code review: no override of `failedValidation()` in Form Requests
- Code review: exception handler does not wrap `ValidationException` in the envelope
- Integration tests: 422 response lacks top-level `error` key

**Solution**:
- Override `failedValidation()` on a base Form Request to return the envelope shape
- Or register a renderable callback for `ValidationException` in the exception handler
- Ensure the `detail.fields` sub-shape is applied within the envelope

**Example**:
```php
// BEFORE: Raw ValidationException output
// {
//   "email": ["The email field is required."],
//   "name": ["The name field is required."]
// }

// AFTER: Wrapped in error envelope
// {
//   "error": {
//     "code": "VALIDATION_ERROR",
//     "message": "The given data was invalid.",
//     "status": 422,
//     "detail": {
//       "fields": {
//         "email": ["The email field is required."],
//         "name": ["The name field is required."]
//       }
//     }
//   }
// }

// Implementation in exception handler
$this->renderable(function (ValidationException $e, Request $request) {
    if ($request->expectsJson()) {
        return response()->json(
            new ErrorEnvelope(
                'VALIDATION_ERROR',
                $e->getMessage(),
                422,
                ['fields' => $e->errors()],
            ),
            422,
        );
    }
});
```

---

### AP-SEE-04: Including Stack Traces in Dev-Only

**Description**: The envelope fields themselves contain stack trace data when `APP_DEBUG=true`, but with different content or structure than production. The envelope shape changes between environments — dev includes extra fields, production omits them. Clients that parse the envelope in dev during testing break in production because the expected fields are missing.

**Root Cause**: Conditional logic inside the envelope constructor: `$this->trace = config('app.debug') ? $e->getTraceAsString() : null`.

**Impact**:
- Frontend devs test against local API with debug fields, deploy code that references missing fields
- Integration tests pass in dev but fail in CI (which runs with APP_DEBUG=false)
- The envelope contract is environment-dependent, violating the principle of immutable shape
- Stack trace content may accidentally leak to production via copy-paste errors

**Detection**:
- Code review: `config('app.debug')` or `app()->environment('local')` inside envelope construction
- Code review: envelope class has nullable fields that are only populated in dev
- Test review: envelope assertion tests only run with `APP_DEBUG=true`

**Solution**:
- Keep the envelope fields identical across all environments
- Add a separate `debug` key at the response level (outside the envelope) for dev environments
- Never reference `app()->environment()` inside the envelope class

**Example**:
```php
// BEFORE: Envelope shape changes per environment
class ErrorEnvelope
{
    public function __construct(
        public readonly string $code,
        public readonly string $message,
        public readonly int $status,
        public readonly ?string $trace = null, // ❌ only populated in dev
    ) {}
}

// AFTER: Envelope shape is immutable; debug is separate
$envelope = new ErrorEnvelope('SERVER_ERROR', 'Internal error.', 500, ['trace_id' => $traceId]);

$response = response()->json($envelope, 500);

if (config('app.debug')) {
    $response->setData($response->getData() + [
        'debug' => [
            'trace' => $e->getTraceAsString(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ],
    ]);
}

return $response;
```

---

### AP-SEE-05: Envelope as Associative Array

**Description**: The error envelope is constructed as a plain PHP array and passed directly to `response()->json()`. There is no typed class, no readonly properties, and no serialization consistency. Different developers add different keys to the array, and there is no compile-time enforcement of the envelope contract.

**Root Cause**: Convenience and speed — an array is faster to write than a DTO class. The developer does not anticipate the envelope being constructed in multiple places.

**Impact**:
- No type safety: any code can add/remove envelope fields anywhere
- Inconsistent keys: some places use `code`, others use `error_code` or `errorCode`
- No serialization control: null vs omitted fields vary by construction site
- Refactoring the envelope shape requires hunting down every array construction

**Detection**:
- Code review: `return response()->json(['error' => ['code' => ..., 'message' => ...]])` without a class
- Static analysis: arrays flowing through multiple functions without type guarantees
- Integration tests: envelope fields may vary between endpoints

**Solution**:
- Define a typed `ErrorEnvelope` class with readonly properties
- Use the class everywhere the envelope is constructed
- Consider a dedicated JSON Resource for serialization control

**Example**:
```php
// BEFORE: Associative array
return response()->json([
    'error' => [
        'code' => 'VALIDATION_ERROR',
        'message' => 'Invalid input.',
        'status' => 422,
    ],
], 422);

// AFTER: Typed class
class ErrorEnvelope
{
    public function __construct(
        public readonly string $code,
        public readonly string $message,
        public readonly int $status,
        public readonly array $detail = [],
    ) {}
}

return response()->json(
    new ErrorEnvelope('VALIDATION_ERROR', 'Invalid input.', 422, ['fields' => $fields]),
    422,
);
```
