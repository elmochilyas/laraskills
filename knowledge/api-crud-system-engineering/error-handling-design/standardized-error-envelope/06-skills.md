# Skill: Implement Standardized Error Envelope

## Purpose
Define and enforce a consistent JSON error envelope (`{ error: { code, message, status, detail? } }`) across all API responses using a typed DTO class and global exception handler configuration.

## When To Use
- Any API serving external consumers (mobile apps, SPAs, third-party integrations)
- When multiple clients consume the same API and need consistent error parsing
- When implementing centralized error handling system

## When NOT To Use
- Internal-only RPC calls where both sides owned by same team
- During rapid prototyping
- When API already uses JSON:API errors or RFC 9457 — adopt that standard's envelope

## Prerequisites
- Laravel exception handler (`bootstrap/app.php`)
- PHP 8.1+ readonly classes

## Inputs
- Error code taxonomy
- Error response shape specification

## Workflow
1. Create `ErrorEnvelope` readonly DTO class with `code` (string), `message` (string), `status` (int), `detail` (mixed, optional)
2. Create `ErrorCodes` class with constants for all domain-specific error codes
3. Implement `renderable` callbacks in exception handler for: `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`, `NotFoundHttpException`
4. Guard each callback with `$request->expectsJson()` to avoid breaking web routes
5. Register global exception handler in `bootstrap/app.php` with envelope response for all uncaught exceptions
6. Pre-build common error envelopes (401 generic, 403 generic, 404 generic) as class constants for performance
7. Ensure the envelope shape is identical in dev and production — add separate `debug` key in dev mode
8. Never include stack traces, file paths, SQL queries, or internal variable values in envelope

## Validation Checklist
- [ ] All error responses use `{ error: { code, message, status, detail? } }` structure
- [ ] ErrorEnvelope implemented as typed readonly DTO class
- [ ] `error` is top-level key (no fields outside it)
- [ ] Status code duplicated in envelope body
- [ ] `detail` omitted when null (not sent as `detail: null`)
- [ ] No `success: false` or similar redundant fields
- [ ] All renderable callbacks guarded by `expectsJson()`
- [ ] Envelope shape identical in dev and production
- [ ] Common envelopes (401, 403, 404) pre-built as cached constants

## Common Failures
- Changing envelope shape between endpoints — defeats standardization
- Placing fields outside the `error` key — pollutes response namespace
- Including stack traces even in dev-only — use separate `debug` key
- Returning HTML error pages for API requests — missing `expectsJson()` check
- Including `success: false` — redundant field that can conflict with status

## Decision Points
- Custom envelope vs RFC 9457 Problem Details — custom for simpler APIs, RFC 9457 for standards alignment
- Error code format — `DOMAIN.ERROR` (`USER.NOT_FOUND`) vs flat (`USER_NOT_FOUND`)
- Detail structure — field errors array for 422, resource type for 404, retry info for 429

## Performance Considerations
- Envelope serialization overhead < 0.01ms
- Pre-serialize common envelopes as JSON string constants
- Avoid logging within envelope construction path

## Security Considerations
- Never include stack traces, file paths, SQL queries, or internal values
- Strip sensitive keys from detail before serialization
- Do not echo submitted values in validation error messages that could leak PII
- Envelope shape must be identical in dev and production (add separate `debug` key in dev)

## Related Rules
- Use error as the Top-Level Key
- Keep Envelope Fields Immutable — Code, Message, Status, Detail
- Use a Typed DTO Class for the Envelope
- Duplicate the HTTP Status Code in the Envelope Body
- Keep detail Optional — Omit When Empty
- Never Include success: false or Similar Redundant Fields
- Guard All Envelope-Producing Callbacks with expectsJson()
- Pre-Build Common Envelopes as Cached Constants
- Never Modify the Envelope Shape in Different Environments

## Related Skills
- Domain-Specific Error Codes — for code field values
- Error Type Taxonomy — for classification of errors
- Global Exception Handler Config — for handler registration
- Validation Error Shape Design — for 422 detail structure

## Success Criteria
- Every error response across all endpoints uses the exact same envelope structure
- Envelope contains only `code`, `message`, `status`, and optional `detail`
- No stack trace, file path, or SQL appears in any envelope field
- Common envelopes are pre-built and cached
- Integration tests verify envelope shape for every error scenario
