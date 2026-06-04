# Validation Error Shape Customization

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** error-format, testing, production, localization, openapi

## Executive Summary
Phase 3 covers testing custom validation error responses, production error format enforcement, localization strategies, OpenAPI error schema documentation, and client SDK generation from error shapes.

## Core Concepts

### Error Shape as API Contract
The validation error response structure IS part of the API contract. Clients depend on field names, nesting, and status codes. Changing the error format is a **breaking change** — version it alongside the API.

### Deterministic Error Output
Given the same input, the error response must be byte-for-byte identical every time. Non-deterministic output (varying field order, dynamic status codes) breaks client parsers.

## Internal Mechanics

### Error Format via Exception Handler (Global)
```php
// App\Exceptions\Handler
public function register(): void
{
    $this->renderable(function (ValidationException $e, Request $request) {
        if (!$request->expectsJson()) {
            return $e->getResponse();
        }

        $errors = $e->validator->errors();

        return response()->json([
            'errors' => $errors->toArray(),
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->id(),
            ],
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
    });
}
```

### ValidationException with Custom Response
```php
$validator = Validator::make($data, $rules);

if ($validator->fails()) {
    $response = response()->json([
        'errors' => [
            'status' => '422',
            'code' => 'VALIDATION_ERROR',
            'details' => $validator->errors()->all(),
        ],
    ], 422);

    throw new ValidationException($validator, $response);
}
```

## Patterns

### Testing Validation Error Response Shape
```php
public function test_validation_error_response_structure(): void
{
    $response = $this->postJson('/api/v1/posts', []);

    $response->assertStatus(422);
    $response->assertJsonStructure([
        'errors' => [
            '*' => ['status', 'code', 'title', 'detail', 'source'],
        ],
    ]);
}

public function test_validation_error_contains_field_pointer(): void
{
    $response = $this->postJson('/api/v1/posts', [
        'title' => '',
        'body' => '',
    ]);

    $response->assertJsonFragment([
        'source' => ['pointer' => '/data/attributes/title'],
    ]);
    $response->assertJsonFragment([
        'source' => ['pointer' => '/data/attributes/body'],
    ]);
}

public function test_validation_error_uses_422_status(): void
{
    $response = $this->postJson('/api/v1/posts', ['title' => '']);

    $response->assertStatus(422);
    $response->assertJsonPath('errors.0.status', '422');
}

public function test_validation_error_code_is_consistent(): void
{
    $response = $this->postJson('/api/v1/posts', ['title' => '']);

    $response->assertJsonPath('errors.0.code', 'VALIDATION_ERROR');
}

public function test_validation_error_for_nested_field(): void
{
    $response = $this->postJson('/api/v1/orders', [
        'customer' => ['name' => ''],
    ]);

    $response->assertJsonFragment([
        'source' => ['pointer' => '/data/attributes/customer/name'],
    ]);
}

public function test_validation_error_message_localization(): void
{
    $response = $this->withHeaders(['Accept-Language' => 'fr'])
        ->postJson('/api/v1/posts', ['title' => '']);

    // French translation of "title is required"
    $response->assertJsonFragment([
        'detail' => 'Le titre est obligatoire.',
    ]);
}

public function test_multiple_validation_errors_all_reported(): void
{
    $response = $this->postJson('/api/v1/posts', [
        'title' => '',
        'body' => '',
        'status' => 'invalid_status',
    ]);

    $response->assertStatus(422);
    $errors = $response->json('errors');
    $this->assertCount(3, $errors);
}

public function test_validation_error_does_not_include_stack_trace(): void
{
    $response = $this->postJson('/api/v1/posts', ['title' => '']);

    $response->assertJsonMissingPath('errors.0.trace');
    $response->assertJsonMissingPath('errors.0.file');
    $response->assertJsonMissingPath('errors.0.line');
}
```

### Integration Test for Error Format Consistency
```php
public function test_all_endpoints_return_same_error_format(): void
{
    // Hit multiple endpoints with invalid data
    $endpoints = [
        ['method' => 'post', 'uri' => '/api/v1/posts', 'data' => []],
        ['method' => 'post', 'uri' => '/api/v1/comments', 'data' => []],
        ['method' => 'post', 'uri' => '/api/v1/auth/register', 'data' => []],
        ['method' => 'put', 'uri' => '/api/v1/posts/1', 'data' => ['title' => '']],
    ];

    foreach ($endpoints as $endpoint) {
        $response = match ($endpoint['method']) {
            'post' => $this->postJson($endpoint['uri'], $endpoint['data']),
            'put' => $this->putJson($endpoint['uri'], $endpoint['data']),
        };

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'errors' => ['*' => ['status', 'code', 'title', 'detail', 'source']],
        ]);
    }
}
```

### OpenAPI Error Schema Documentation
```yaml
components:
  schemas:
    ValidationError:
      type: object
      properties:
        status:
          type: string
          example: "422"
        code:
          type: string
          example: "VALIDATION_ERROR"
        title:
          type: string
          example: "Validation Error"
        detail:
          type: string
          example: "The title field is required."
        source:
          type: object
          properties:
            pointer:
              type: string
              example: "/data/attributes/title"
    ValidationErrorResponse:
      type: object
      properties:
        errors:
          type: array
          items:
            $ref: '#/components/schemas/ValidationError'
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Global exception handler customization | Consistent format across all validation errors, not just FormRequests |
| JSON:API error spec compliance | Industry standard; existing client libraries |
| Error format contract tests | Catches breaking changes in CI |
| Accept-Language localization | Multi-region support without breaking error shape |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Global handler format | Single source of truth; catches all validation errors | Cannot customize per-endpoint |
| JSON:API errors | Standardized; self-descriptive | Verbose; more bytes transferred |
| Contract tests | Enforces consistency; prevents drift | Extra CI maintenance |
| Localized errors | Better UX for international users | Key-based lookup; falls back to English |

## Performance Considerations
- Global exception handler adds no overhead — only runs on error (rare path).
- JSON:API format is ~2x larger than flat errors — negligible for validation responses.
- Localized error lookup adds ~1ms per error — fine for typical payloads.
- Pre-compile error format template in base class to avoid recomputation.

## Production Considerations
- Document the error schema in the API reference (OpenAPI).
- Monitor validation error rate by endpoint for anomaly detection.
- Use structured logging for all validation errors with the full error payload.
- Add request ID to error meta for correlating with server logs.

## Common Mistakes
- Hard-coding error messages in `failedValidation()` override — breaks localization.
- Including raw input in error responses — security risk.
- Varying error format between endpoints — client parsing issues.
- Returning 400 for all errors — validation should return 422.
- Forgetting to update error schema in OpenAPI doc when format changes.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Error format change across versions | Client parsing failure | Version error format with API version |
| Localized message missing | Fallback to key name | Provide default English translation |
| Override catches and swallows | Silent validation failure | Always throw after custom formatting |
| Circular error format | Recursive JSON structure | Never include validator itself in response |

## Ecosystem Usage

### Spatie Laravel JsonApi Error Response
```php
// Install: composer require spatie/laravel-json-api-error-response
// Automatically formats all validation errors to JSON:API spec

class YourApiController extends Controller
{
    use \Spatie\LaravelJsonApiErrorResponse\ProvidesJsonApiErrorResponses;
}
```

### Laravel Exception Handler Formatters
```php
// App\Exceptions\Handler
protected function convertValidationExceptionToResponse(ValidationException $e, Request $request): Response
{
    if (!$request->expectsJson()) {
        return $e->getResponse();
    }

    return response()->json(
        new JsonApiErrorResource($e->validator->errors()),
        422
    );
}
```

### Client-Side SDK Generation from Error Shape
```typescript
// Generated TypeScript type from OpenAPI error schema
interface ValidationError {
  status: string;    // "422"
  code: string;      // "VALIDATION_ERROR"
  title: string;     // "Validation Error"
  detail: string;    // "The title field is required."
  source: {
    pointer: string; // "/data/attributes/title"
  };
}

interface ValidationErrorResponse {
  errors: ValidationError[];
}
```

## Related Knowledge Units

### Prerequisites
- **validation-error-shape-customization** — Phase 2 error customization basics.
- **response-structures** — overall API response architecture.

### Related Topics
- **form-request-testing** — testing error responses.
- **manual-validator-creation** — custom errors in manual validation.

### Advanced Follow-up Topics
- **error-handling-design** — comprehensive error handling across all HTTP status codes.
- **api-documentation** — documenting error shapes in OpenAPI.

## Research Notes

### Source Analysis
The `ValidationException` class extends `RuntimeException`. Its `$errors` method delegates to the validator's `MessageBag`, which returns field → array of messages. The exception handler in `Handler::convertValidationExceptionToResponse()` provides the default JSON or redirect response.

### Key Insight
Validation error format is an **API contract element** as important as the request schema. A stable, well-documented error format enables robust client-side parsing, automated error handling, and integration with API client SDKs. It's not just about aesthetics — it's about reliability.

### Version-Specific Notes
- Laravel 10: `ValidationException` accepts custom response in constructor.
- Laravel 11: No changes.
- PHP 8.3: `json_validate()` for safe JSON serialization validation.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization