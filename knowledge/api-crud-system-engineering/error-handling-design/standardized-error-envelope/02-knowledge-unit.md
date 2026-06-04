# Standardized Error Envelope

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
Every error response must conform to a single, predictable JSON shape — the error envelope — so that API clients can parse any error generically without knowing the endpoint. The envelope standardises how code, message, status, and context are delivered.

## Core Concepts
- **Top-Level Structure**: `{ error: { code, message, status, detail? } }`
- **Code**: Machine-readable string like `VALIDATION_ERROR` — never translated.
- **Message**: Human-readable summary — may be localized.
- **Status**: HTTP status code repeated in the body for convenience.
- **Detail**: Optional object or array with extra context (e.g., field errors, trace ID).
- **Immutable Shape**: Once published, the envelope fields and their types must never change (extend only).

## Mental Models
Think of the envelope like an HTTP response's twin — the status line tells you success/failure at a glance; the envelope tells you exactly why and how to fix it.

```
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid.",
    "status": 422,
    "detail": {
      "email": ["The email field is required."],
      "name": ["The name must be at least 3 characters."]
    }
  }
}
```

## Internal Mechanics
1. Exception is thrown in application code.
2. Exception handler catches it, determines envelope fields.
3. A `ErrorResponse` DTO is populated.
4. The DTO is serialised via a dedicated `ErrorResource` or `JsonResponse`.
5. The response is returned with the proper Content-Type and status code.

```php
class ErrorEnvelope
{
    public function __construct(
        public readonly string $code,
        public readonly string $message,
        public readonly int $status,
        public readonly mixed $detail = null,
    ) {}
}
```

## Patterns
- **Envelope as an Object**: Use a typed class, not an associative array.
- **Laravel JSON Resource**: `ErrorResource implements JsonSerializable` for consistent serialisation.
- **Trait on Exception**: `HasErrorEnvelope` trait adds `toEnvelope(): ErrorEnvelope` to any exception class.
- **Middleware Envelope Wrapping**: Catch any uncaught exceptions in middleware and wrap in envelope.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Key name | `error` (not `errors`, `data`) | Matches Stripe/Twilio conventions |
| Detail type | `mixed` (object or array) | Flexible for validation errors vs trace IDs |
| Status duplication | Yes, both header and body | Clients often read body without inspecting headers |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Wrapping vs flat | `{ error: { ... } }` wrapping | Flat `{ code, message }` | Wrapping — namespace safety |
| Detail optional | Always present (null) | Present only when needed | Present only when needed — reduces noise |
| Array of errors | Single error | Array of errors | Single error per response; validation uses `detail` for sub-errors |

## Performance Considerations
- Envelope serialisation overhead is negligible (< 0.01ms).
- Pre-serialize common error envelopes (e.g., 401, 403) as constants to avoid object allocation per request.
- For rare errors, construct on-demand.

## Production Considerations
- Add `Content-Type: application/problem+json` (RFC 7807) for standards compliance.
- Include `trace_id` in the `detail` object for log correlation.
- Never include `exception` class, file, line, or stack trace in the envelope.
- Rate-limit error response production (don't let error flooding exhaust response workers).

## Common Mistakes
- Changing the envelope shape between endpoints (inconsistent).
- Placing error fields outside the `error` key (polyfill pollution).
- Returning HTML or plain text error pages instead of JSON.
- Including `success: false` alongside the envelope (unnecessary duplication).

## Failure Modes
- **Envelope Inconsistency**: One controller returns raw validation, another returns envelope. Solution: global middleware enforces shape.
- **Breaking Changes**: Adding a new field to `error` is safe; renaming or removing fields is not. Treat the envelope as a contract.
- **Empty Detail**: Clients crash expecting an object and receiving null. Document detail as nullable and always type-check in clients.

## Ecosystem Usage
- **Stripe**: `{ error: { type, message, code, param } }`
- **Twilio**: `{ code, message, more_info, status }`
- **Laravel**: `$request->validate()` returns an array shape, not envelope. Our envelope wraps it.
- **OpenAPI**: `ErrorResponse` schema is shared via `$ref` across all endpoints.

## Related Knowledge Units
### Prerequisites
- KU-01 Error Type Taxonomy

### Related Topics
- KU-06 Validation Error Shape Design (detail sub-shape)
- KU-07–KU-12 Status-Specific Error Shapes

### Advanced Follow-up Topics
- RFC 7807 (Problem Details) as an alternative envelope — possible Phase 4 migration.

## Research Notes
### Source Analysis
Adopts Stripe API conventions (v2023-10). The `error` top-level key avoids collision with top-level `data` in success responses. RFC 7807 is considered but deferred — the simpler envelope meets current needs with less spec overhead.

### Key Insight
The envelope is the **API's error contract**. Once consumers depend on the shape, changing it becomes a breaking change. Model it as a versioned schema from day one.

### Version-Specific Notes
- Laravel 9+ `JsonResponse::fromJsonString()` can pre-build common envelopes.
- PHP 8.2+ `readonly` classes make envelope DTOs immutable by default.
