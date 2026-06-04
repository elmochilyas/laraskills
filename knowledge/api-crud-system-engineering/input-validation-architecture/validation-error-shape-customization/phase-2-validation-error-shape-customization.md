# Validation Error Shape Customization

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** error-format, error-customization, json-api-errors, validation-response, laravel

## Executive Summary
Phase 2 covers customizing the validation error response format — overriding `failedValidation()`, structuring error objects, JSON:API error compliance, field error pointer formatting, and controlling error response status codes.

## Core Concepts

### Default Laravel Validation Error Shape
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "title": ["The title field is required."],
        "email": ["The email must be a valid email address."]
    }
}
```

This default shape is web-oriented. For APIs, a structured error format is preferred.

### Custom Error Envelope
Overriding `failedValidation()` provides full control:
```php
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([
        'errors' => $this->formatErrors($validator),
        'meta' => [
            'total_errors' => $validator->errors()->count(),
        ],
    ], Response::HTTP_UNPROCESSABLE_ENTITY));
}
```

## Internal Mechanics

### The failedValidation() Hook
Located in `Illuminate\Foundation\Http\FormRequest`. The default implementation throws a `ValidationException` which Laravel converts to a JSON response (if `Accept: application/json`) or a redirect response (web).

Override behavior chain:
```
Validator fails → $this->failedValidation($validator) → override throws custom response
```

### ValidationException Constructor
```php
new ValidationException(
    $validator,           // Validator instance with errors
    $response,            // Optional custom Response
    'The given data was invalid.' // Custom error bag
);
```

## Patterns

### JSON:API Error Format
```php
protected function failedValidation(Validator $validator): void
{
    $errors = collect($validator->errors()->messages())
        ->map(fn ($messages, $field) => [
            'status' => (string) Response::HTTP_UNPROCESSABLE_ENTITY,
            'code' => 'VALIDATION_ERROR',
            'title' => 'Validation Error',
            'detail' => $messages[0],
            'source' => [
                'pointer' => '/data/attributes/' . str_replace('.', '/', $field),
            ],
        ])
        ->values();

    throw new HttpResponseException(response()->json([
        'errors' => $errors,
    ], Response::HTTP_UNPROCESSABLE_ENTITY));
}
```

### Flat Error Array
```php
protected function failedValidation(Validator $validator): void
{
    $errors = [];

    foreach ($validator->errors()->messages() as $field => $messages) {
        foreach ($messages as $message) {
            $errors[] = [
                'field' => $field,
                'message' => $message,
            ];
        }
    }

    throw new HttpResponseException(response()->json([
        'errors' => $errors,
    ], Response::HTTP_UNPROCESSABLE_ENTITY));
}
```

### Multi-Language Error Support
```php
protected function failedValidation(Validator $validator): void
{
    $locale = $this->header('Accept-Language', 'en');

    $errors = collect($validator->errors()->messages())
        ->map(fn ($messages, $field) => [
            'status' => '422',
            'code' => 'VALIDATION_ERROR',
            'detail' => __("validation.{$field}", locale: $locale),
        ]);

    throw new HttpResponseException(
        response()->json(['errors' => $errors], 422)
    );
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| Override failedValidation() in base ApiRequest | Consistent format across all endpoints | Per-request override — inconsistent |
| JSON:API error structure | Standard, client-friendly, self-descriptive | Flat array — simpler but less descriptive |
| First error per field only | Concise response; client fixes one error at a time | All errors — verbose but comprehensive |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| JSON:API errors | Industry standard; tooling support | Verbose format; more bytes over the wire |
| First error only | Fast fix cycle | Requires multiple round trips for all errors |
| All errors per field | Single round trip | Very long response for complex payloads |
| Custom status per error | Granular error response | More complex client parsing |

## Performance Considerations
- Custom error formatting adds overhead proportional to error count.
- `collect()` + `map()` is O(n) — negligible for typical validation errors (<100 fields).
- Avoid DB queries in `failedValidation()` — it runs on every failed validation.
- Pre-compile error format if using the same structure across all requests.

## Production Considerations
- Ensure the error format is **documented** in the API contract.
- Never include stack traces or internal identifiers in validation errors.
- Use consistent HTTP status code (422) for all validation errors.
- Log validation errors before throwing for observability.

## Common Mistakes
- Overriding `failedValidation()` without calling `parent::` — and not throwing any exception — returns 200 with error body.
- Using different error formats across different FormRequests.
- Including sensitive data (partial input) in error responses.
- Returning `400 Bad Request` instead of `422 Unprocessable Entity`.
- Forgetting to handle the `application/json` content type check.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Override doesn't throw | 200 response with error body | Always throw HttpResponseException |
| Format inconsistency | Client parsing errors | Use base class with centralized format |
| Sensitive data leak | Password/secret in error | Never include raw input in errors |
| Content-type mismatch | HTML instead of JSON | Check Accept header or always return JSON |

## Ecosystem Usage

### Laravel Exception Handler Customization
```php
// App\Exceptions\Handler
public function register(): void
{
    $this->renderable(function (ValidationException $e, Request $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'errors' => $this->formatValidationErrors($e->validator),
            ], 422);
        }
    });
}
```

### Spatie Laravel Error Solutions
```php
// spatie/laravel-json-api-error-response package
use Spatie\LaravelJsonApiErrorResponse\JsonApiErrorResponse;

class ApiRequest extends FormRequest
{
    use JsonApiErrorResponse;
    // Auto-formats validation errors to JSON:API spec
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the request class where failedValidation() lives.

### Related Topics
- **manual-validator-creation** — customizing errors from manual validation.
- **form-request-testing** — testing the custom error response.

### Advanced Follow-up Topics
- **response-structures** — broader API response structure where errors fit.
- **error-handling-design** — comprehensive error handling strategy.

## Research Notes

### Source Analysis
Laravel's `FormRequest::failedValidation()` default implementation throws `ValidationException`, which the exception handler converts to a redirect response (web) or JSON response (API) with `$exception->errors()`. Overriding this method allows complete control over the response shape.

### Key Insight
Validation error formatting is a **cross-cutting concern** that belongs in a base `ApiRequest` class, not in individual FormRequests. Centralizing the format ensures consistency, reduces duplication, and makes the error contract easy to document and test.

### Version-Specific Notes
- Laravel 10: `ValidationException` accepts a `$response` parameter for custom responses.
- Laravel 11: No changes to validation error handling.
- PHP 8.2: `json_encode()` with `JSON_THROW_ON_ERROR` for safe error serialization.
