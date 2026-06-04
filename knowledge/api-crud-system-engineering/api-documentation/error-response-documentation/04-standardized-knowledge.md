# ECC Standardized Knowledge — Error Response Documentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Error Response Documentation |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Error response documentation describes the structure, status codes, and semantics of error payloads. In OpenAPI, each operation should document every error status code with the corresponding schema. Well-documented error responses reduce support tickets by 40-60% — consumers can handle errors without contacting the API team.

## Core Concepts

- **Status code categories**: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation), 429 (rate limit), 500 (server error).
- **Error response shapes**: Standardized envelope with `message`, `errors` (field-level), `code` (machine-readable).
- **Reusable error components**: Define in `components/responses` and `$ref` across all endpoints.
- **Machine-readable error codes**: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`, `RATE_LIMITED`.
- **Scenario-based examples**: Multiple `@response` examples for different error conditions.

## When To Use

- Every endpoint documentation (all possible error status codes)
- Public APIs consumed by external developers
- APIs where error handling is non-trivial
- Documentation for contract testing reference

## When NOT To Use

- Internal APIs where consumer knows error shapes from code
- Endpoints with no possible errors (theoretically none — always document at least 500)

## Best Practices

- **Document all status codes**: 401, 403, 404, 422, 429, 500 on every endpoint via `$ref` components.
- **Reusable error schemas**: Single `ErrorResponse` schema referenced across all operations.
- **Machine-readable error codes**: Include a `code` enum in the error schema for automated handling.
- **Scenario-based examples**: Multiple examples for different failure modes (missing field, invalid format, duplicate).
- **Retry-After for 429**: Document the `Retry-After` header format in rate limit responses.
- **Standardize envelope shape**: Consistent `{message, errors, code}` across all error responses.

## Architecture Guidelines

- Define base error schema in `components/schemas/ErrorResponse`.
- Define reusable response objects in `components/responses/` (Unauthorized, ValidationError, NotFound, etc.).
- Reference via `$ref` in each operation's `responses` section.
- For Scramble: error docs require manual post-processing (Scramble does not infer errors).
- For Scribe: use `@response status=422 scenario="validation error"` annotations.
- Validate error response schemas with contract tests covering error paths.

## Performance Considerations

- Error documentation has no runtime impact.
- Spec size increases with error examples. Use `$ref` to keep spec manageable.

## Security Considerations

- Error messages in documentation must not leak internal details. Use generic examples.
- Debug/stack trace info shown only in development — document this behavior to prevent consumer dependency.
- Error code patterns should not reveal internal system structure.

## Common Mistakes

- **Documenting only success responses**: Error handling code cannot be developed from docs alone.
- **Vague error messages**: "An error occurred" — consumers cannot determine the cause.
- **Inconsistent error shape across endpoints**: Prevents generic error handler code.
- **Missing rate limit documentation**: Consumers discover limits only when hitting 429.
- **Error schema does not match actual response**: Contract test should catch this.

## Anti-Patterns

- **Error messages leaking implementation details**: MySQL errors, file paths, stack traces in production.
- **Errors as an afterthought**: Everything else documented perfectly, errors empty. Consumers cannot build robust clients.

## Examples

- Reusable 422: `'422': { $ref: '#/components/responses/ValidationError' }`.
- Error schema: `{ "message": "string", "code": "VALIDATION_ERROR | NOT_FOUND | ...", "errors": { "field": ["error message"] } }`.
- Rate limit 429 with Retry-After header documented.

## Related Topics

- **Prerequisites**: HTTP Status Code Selection, Laravel Exception Handling
- **Closely Related**: Response Schema Documentation, Endpoint Documentation Content, Standardized Error Envelope
- **Advanced**: Error code taxonomy, contract testing for errors, error response versioning

## AI Agent Notes

When generating error documentation: use reusable error response components ($ref), document every error status code per endpoint (401, 403, 404, 422, 429, 500), include machine-readable error codes, provide scenario-based examples, validate with contract tests on error paths.

## Verification

Sources: RFC 9457 Problem Details, Laravel Exception Handler, Stripe error docs, GitHub error docs, domain-analysis.md.
