# Standardized Error Envelope

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-standardized-error-envelope |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Foundation |
| Classification | Design Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Every error response must conform to a single, predictable JSON shape — the error envelope — so that API clients can parse any error generically without knowing the endpoint. The envelope standardises how code, message, status, and context are delivered.

## Core Concepts

- **Top-Level Structure**: `{ error: { code, message, status, detail? } }`
- **Code**: Machine-readable string like `VALIDATION_ERROR` — never translated or localised.
- **Message**: Human-readable summary — may be localised per request locale.
- **Status**: HTTP status code repeated in the body for client convenience.
- **Detail**: Optional object or array with extra context (field errors, trace ID, retry info).
- **Immutable Shape**: Once published, envelope fields and their types must never change — extend only.

## When To Use

- For any API that serves external consumers (mobile apps, SPAs, third-party integrations)
- When multiple clients consume the same API and need consistent error parsing
- When implementing a centralized error handling system
- For any public-facing API where error responses are part of the contract
- When migrating from ad-hoc error responses to a standardized format

## When NOT To Use

- For internal-only RPC calls where both sides are owned by the same team
- During rapid prototyping where error handling is not yet a concern
- When the API already uses a specific standard (JSON:API errors, RFC 9457) — adopt that standard's envelope
- For streaming endpoints where errors are communicated out-of-band

## Best Practices (WHY)

- **Use `error` as the top-level key**: Matches Stripe/Twilio conventions and avoids collision with success response's `data`.
- **Duplicate status in the body**: Clients often parse the body without inspecting response headers.
- **Keep detail optional**: Omit when not needed; include only when there is contextual information.
- **Never change field meaning**: Adding fields is safe; renaming or removing is a breaking change.
- **Pre-serialize common envelopes**: Cache 401, 403, 404 responses as constants to avoid object allocation.
- **Use a typed class for the envelope**: Not an associative array — a class ensures consistent serialisation.
- **Include trace_id in detail**: Enables log correlation without leaking internals.

## Architecture Guidelines

- Define an `ErrorEnvelope` readonly DTO with `code`, `message`, `status`, and optional `detail`.
- Serialize via a dedicated `ErrorResource` or `JsonResponse` for consistent output.
- Implement a `HasErrorEnvelope` trait on exception base classes returning `toEnvelope(): ErrorEnvelope`.
- Add middleware wrapping for uncaught exceptions to ensure envelope compliance.
- Configure `Content-Type: application/problem+json` (RFC 7807) for standards alignment.
- Never include exception class, file, line, or stack trace in the envelope.
- Rate-limit error response production to prevent error flooding from exhausting response workers.

## Performance Considerations

- Envelope serialisation overhead is negligible (< 0.01ms).
- Pre-serialize common error envelopes as constants or cached closures.
- For rare errors, construct on-demand — the allocation cost is acceptable.
- Avoid logging within the envelope construction path (logging should happen in the handler).

## Security Considerations

- Never include stack traces, file paths, SQL queries, or internal variable values.
- Strip sensitive keys from detail (passwords, tokens, PII) before serialization.
- Do not echo submitted values in validation error messages that could leak PII.
- Ensure the envelope shape is identical in dev and production — only add a separate `debug` key in dev.
- Use a consistent envelope across all endpoints to prevent information leakage via shape differences.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Changing envelope shape between endpoints | Different controllers return different error formats | No centralized error handling | Clients must write endpoint-specific parsing | Use global middleware to enforce envelope shape |
| Placing fields outside the `error` key | Extra top-level keys alongside the envelope | Copy-pasting from different response formats | Pollutes the response namespace | Keep all error data inside the `error` object |
| Returning HTML error pages | Non-JSON error responses for API requests | Missing `expectsJson()` check in handler | Clients fail to parse HTML as JSON | Guard all renderable callbacks with `$request->expectsJson()` |
| Including `success: false` | Duplicating HTTP status semantics in the body | Legacy envelope patterns | Redundant field that can get out of sync | Status code is the success indicator; omit `success` |
| Empty detail crashes clients | Detail is null but clients expect an object | No type contract for detail | Client-side parsing errors | Document detail as nullable; always type-check in clients |

## Anti-Patterns

- **Different envelope per HTTP method or endpoint**: Defeats the purpose of standardization.
- **Nested error inside data**: `{ data: { error: ... } }` — mixes success and error response shapes.
- **Envelope versioning per endpoint version**: The envelope shape should be version-independent.
- **Returning raw ValidationException output**: Laravel's default is an array, not an envelope.
- **Including stack traces in dev-only**: Even in dev, use a separate `debug` key, not the envelope.

## Examples

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

// Response shape:
// {
//   "error": {
//     "code": "VALIDATION_ERROR",
//     "message": "The given data was invalid.",
//     "status": 422,
//     "detail": { "fields": { "email": ["The email field is required."] } }
//   }
// }
```

## Related Topics

- Error Type Taxonomy (classifies what goes into the envelope)
- Domain-Specific Error Codes (the `code` field in the envelope)
- RFC 9457 Problem Details (alternative envelope standard)
- Server Error Responses (safe production envelope)
- Validation Error Shape Design (detail sub-shape for 422)

## AI Agent Notes

- When generating error responses, always use the envelope class, never raw arrays.
- The envelope is the API's error contract — never generate code that modifies its shape.
- If adding new fields to the envelope, ensure existing consuming code does not break.
- For framework-generated errors (e.g., `ModelNotFoundException`), wrap in the envelope rather than returning the default.

## Verification

- [ ] Every error response across all endpoints uses the exact same envelope structure
- [ ] The envelope contains only: `code`, `message`, `status`, and optional `detail`
- [ ] No stack trace, file path, or SQL appears in any envelope field
- [ ] Common envelopes (401, 403, 404) are pre-built and cached
- [ ] All renderable callbacks in the handler are guarded by `$request->expectsJson()`
- [ ] The `error` key is always top-level; no extra keys outside it
- [ ] Integration tests verify envelope shape for every error scenario
