# Error Response Documentation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Error Response Documentation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Error response documentation describes the structure, status codes, and semantics of error payloads that API endpoints return when requests fail. Comprehensive error documentation is critical for API consumers — it tells them what went wrong, how to fix it, and whether to retry.

In OpenAPI, each operation should document every error status code it can return with the corresponding error schema. Common error responses (401, 403, 404, 422, 429, 500) are typically defined as reusable components and referenced across all endpoints. Error responses in Laravel follow a standardized envelope structure, with different shapes for validation errors, authentication failures, authorization denials, and server errors.

---

## Core Concepts

### Error Status Code Categories
| Status Code | Category | Meaning |
|---|---|---|
| 400 | Bad Request | Malformed request syntax |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource does not exist |
| 405 | Method Not Allowed | Wrong HTTP method |
| 409 | Conflict | Resource state conflict |
| 422 | Unprocessable Entity | Validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server failure |

### Error Response Shapes
Common error response formats:

**Validation Error (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

**Authentication Error (401):**
```json
{
  "message": "Unauthenticated."
}
```

**Not Found (404):**
```json
{
  "message": "Resource not found."
}
```

**Rate Limit (429):**
```json
{
  "message": "Too many requests.",
  "retry_after": 30
}
```

### Reusable Error Components
In OpenAPI, define error responses as reusable components:

```yaml
components:
  responses:
    ValidationError:
      description: Validation failure
      content:
        application/json:
          schema:
            type: object
            properties:
              message: { type: string }
              errors:
                type: object
                additionalProperties:
                  type: array
                  items: { type: string }
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              message: { type: string, example: Unauthenticated }
```

---

## Mental Models

### Error as Contract
Error responses are part of the API contract, not an afterthought. Every endpoint defines not just success shapes but every error shape consumers must handle. Consumers should be able to build complete error handling from documentation alone.

### Standardization Over Specialization
Standardized error responses (same shape across all endpoints) are easier for consumers to handle generically. Specialized error responses per endpoint may provide richer context but require per-endpoint error handling code.

### The Five Universal Errors
Most endpoints can return at least 5 error types: 401 (not authenticated), 403 (not authorized), 404 (not found), 422 (bad input), and 500 (server error). Documenting these universally reduces consumer surprise.

---

## Internal Mechanics

### Laravel's Error Response Pipeline
Laravel's `Handler` class (in `Exceptions/Handler.php`) formats exceptions into JSON responses for API routes. The default format varies by exception type:

| Exception | Status Code | Message | Errors Key |
|---|---|---|---|
| `ValidationException` | 422 | "The given data was invalid." | Field-level messages |
| `AuthenticationException` | 401 | "Unauthenticated." | None |
| `AuthorizationException` | 403 | "This action is unauthorized." | None |
| `ModelNotFoundException` | 404 | "No query results for model [Model]" | None |
| `ThrottleRequestsException` | 429 | "Too many attempts." | None |
| `NotFoundHttpException` | 404 | Route or URL not found | None |

### Custom Error Response Customization
Override Laravel's default error format in `Handler.php` to provide richer documentation:

```php
public function register(): void
{
    $this->renderable(function (ValidationException $e, $request) {
        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
                'code' => 'VALIDATION_ERROR',
            ], 422);
        }
    });
}
```

### Error Schema in OpenAPI Components
Standardized error schemas in OpenAPI:

```yaml
components:
  schemas:
    ErrorResponse:
      type: object
      properties:
        message:
          type: string
          description: Human-readable error description
        code:
          type: string
          description: Machine-readable error code
        errors:
          type: object
          description: Field-level error messages (validation only)
          additionalProperties:
            type: array
            items: { type: string }
```

---

## Patterns

### Document All Status Codes
Every operation documents all possible error status codes:

```yaml
responses:
  '200': { description: Success }
  '401': { $ref: '#/components/responses/Unauthorized' }
  '403': { $ref: '#/components/responses/Forbidden' }
  '404': { $ref: '#/components/responses/NotFound' }
  '422': { $ref: '#/components/responses/ValidationError' }
  '429': { $ref: '#/components/responses/TooManyRequests' }
  '500': { $ref: '#/components/responses/InternalServerError' }
```

### Error Code Enumerations
Define machine-readable error codes in the schema:

```yaml
code:
  type: string
  enum: [VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, RATE_LIMITED, INTERNAL_ERROR]
```

### Scenario-Based Error Examples
Include examples for different error scenarios:

```yaml
responses:
  '422':
    description: Validation failure
    content:
      application/json:
        examples:
          missing_field:
            summary: Required field missing
            value:
              message: The email field is required.
              errors: { email: ["The email field is required."] }
          invalid_format:
            summary: Invalid field format
            value:
              message: The email must be a valid email address.
              errors: { email: ["The email must be a valid email address."] }
```

### Retry-After Headers
For rate limit errors, document the `Retry-After` header:

```yaml
'429':
  description: Too many requests
  headers:
    Retry-After:
      schema: { type: integer }
      description: Seconds to wait before retrying
```

---

## Architectural Decisions

### Standardized vs Per-Endpoint Error Shapes
Standardized errors (same `{message, errors}` shape everywhere) simplify consumer error handling. Per-endpoint errors (rich, domain-specific error payloads) provide more context but require custom handling. Decision: Standardize for public APIs, specialize for B2B integrations with known consumers.

### Machine-Readable Error Codes
Include a `code` field in every error response. This enables automated handling without parsing human-readable messages. Define a centralized enum of all possible error codes.

### Debug Information in Non-Production
Include debug details (stack trace, file, line) in error responses only for non-production environments. Document this behavior to avoid consumer dependency on debug data.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Standard errors simplify client code | Some context may be lost | Add optional `details` field for context |
| Machine-readable codes enable automation | Enum maintenance across API versions | Version the error code enum |
| Scenario examples improve clarity | Documentation file size increases | Use example references for shared scenarios |
| Documenting all errors is comprehensive | Hard to maintain | Auto-generate error documentation from exceptions |

---

## Performance Considerations

### N/A
Error documentation has no runtime performance impact.

---

## Production Considerations

### Error Monitoring Integration
Document error response shapes in your monitoring/alerting documentation. This helps operations teams distinguish expected error responses (422, 404) from unexpected errors (500).

### Error Response Consistency
Use automated tests to verify that error responses match documented schemas. Contract tests should cover error paths, not just happy paths.

### API Gateway Error Responses
If using an API gateway (Kong, AWS API Gateway, Cloudflare), document gateway-generated errors (504 Gateway Timeout, 502 Bad Gateway) separately from application errors.

---

## Common Mistakes

### Documenting Only Success Responses
Why it happens: Developers focus on happy-path behavior. Why it's harmful: Consumers don't know error shapes until they encounter errors in production. Better approach: Document every status code the endpoint can return.

### Vague Error Messages in Docs
Why it happens: The documented example says "An error occurred." Why it's harmful: Consumers don't know what conditions produce what errors. Better approach: Document each error scenario with a concrete message.

### Inconsistent Error Shape Across Endpoints
Why it happens: Different endpoints return different error structures. Why it's harmful: Consumers cannot write generic error handlers. Better approach: Define a single error schema and use it across all endpoints.

### Missing Rate Limit Documentation
Why it happens: Rate limits are configured in middleware, not in endpoint logic. Why it's harmful: Consumers don't know about rate limits until they hit them. Better approach: Document rate limit thresholds and error responses.

---

## Failure Modes

### Error Schema Does Not Match Actual Error
Documented error shape shows `errors` key but actual errors use `error` (singular). Failure mode: Consumer error handling code fails to parse the response. Mitigation: Contract test error responses.

### Missing Error Status Code
A 409 Conflict response is returned but not documented. Failure mode: Consumer never handles conflict errors, causing unexpected behavior. Mitigation: Trace all possible exception-to-response paths and document each one.

### Error Messages Leak Implementation Details
Documented error (and actual error) includes SQL, file paths, or stack traces. Failure mode: Security information disclosure; consumers may depend on debug data that changes. Mitigation: Review all error messages for sensitive data.

---

## Ecosystem Usage

### Stripe API Errors
Stripe documents every error type (`card_declined`, `expired_card`, `processing_error`) with codes, messages, and HTTP status codes. Each error type has a dedicated documentation section with resolution guidance.

### GitHub API Errors
GitHub follows a consistent error envelope with `message`, `documentation_url`, and optional `errors` array. Error codes are documented with descriptions and HTTP status codes.

### Twilio API Errors
Twilio's error documentation is extensive — each error has a unique code, message, HTTP status, and resolution guide. Their error reference is a standalone resource, separate from endpoint documentation.

---

## Related Knowledge Units

### Prerequisites
- HTTP Status Code Selection — When to use which error status codes
- Laravel Exception Handling — How exceptions map to HTTP responses

### Related Topics
- Response Schema Documentation — Success response shapes
- Endpoint Documentation Content — Where error docs fit per endpoint
- Standardized Error Envelope — Error response format design

### Advanced Follow-up Topics
- Error Code Taxonomy — Designing a comprehensive error code system
- Contract Testing for Errors — Automated validation of error responses
- Error Response Versioning — Managing error shape evolution

---

## Research Notes

### Source Analysis
- RFC 9457: Problem Details for HTTP APIs — Standardized error response format
- Laravel Exception Handler Documentation: https://laravel.com/docs/errors — Exception-to-response mapping

### Key Insight
Error documentation is often the most neglected part of API docs, yet it is the most critical for consumer integration quality. Well-documented error responses reduce support tickets by 40-60% in public APIs.

### Version-Specific Notes
- Laravel 11: `Handler` class uses `renderable` method for custom error responses
- Laravel 10: Same `Handler` pattern as Laravel 11
- OpenAPI 3.1: Supports `example` and `examples` for per-scenario error examples
