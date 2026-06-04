# Skill: Implement Standardized Error Envelope

## Purpose
Return all API errors in a consistent JSON envelope with `errors` top-level key, `message`, `status`, and optional `details` per field, using Laravel's exception handler and custom renderables.

## When To Use
- Every API 4xx/5xx response
- Validation errors, authentication failures, not-found, server errors
- Public API error contracts

## When NOT To Use
- 204 No Content (no body)
- Binary/file responses (streaming errors different format)

## Prerequisites
- `App\Exceptions\Handler` customization
- Error response structure specification

## Inputs
- Error type list with HTTP status codes
- Error structure specification

## Workflow
1. Define standard error envelope: `{'errors': [{'status': '422', 'code': 'VALIDATION_ERROR', 'title': '...', 'detail': '...', 'source': {'pointer': '/data/attributes/email'}}]}`
2. Override `render()` in `App\Exceptions\Handler` for all exception types
3. Create custom exception classes extending `HttpException`: `ValidationException, AuthenticationException, NotFoundException, ConflictException`
4. Implement `render()` on custom exceptions returning consistent JSON envelope
5. Map validation errors to `source.pointer` JSON pointer format not field names
6. Set `status` as string per JSON:API convention — `'422'` not `422`
7. Use `'code'` for application-specific error codes: `VALIDATION_ERROR, UNAUTHENTICATED, NOT_FOUND, CONFLICT`
8. Include `'detail'` for human-readable message, never stack traces
9. Log all 5xx errors with full context before rendering
10. Test every error type in integration tests for envelope structure

## Validation Checklist
- [ ] All 4xx/5xx return envelope with `errors` top-level key
- [ ] Status code rendered as string in envelope
- [ ] Application-specific `code` field present per error type
- [ ] `detail` field human-readable, no stack traces
- [ ] Validation errors include `source.pointer` in JSON pointer format
- [ ] Custom exception classes for domain errors
- [ ] Exception handler overridden for all exception types
- [ ] 5xx errors logged with full context before rendering
- [ ] Integration tests verify error envelope structure per type
- [ ] Unhandled exceptions caught and rendered in consistent format

## Common Failures
- Inconsistent envelope across error types — ValidationException returns different shape than NotFoundHttpException
- Stack traces leaked to production — `APP_DEBUG=true` left on in env
- Field names used instead of JSON pointers in validation errors
- Error `code` too generic — `VALIDATION_ERROR` doesn't distinguish from business logic violation
- `status` as integer instead of string — JavaScript clients expect string in some parsers

## Decision Points
- Single `errors` array vs `errors` object — array for multiple errors, object for single field map
- JSON pointer vs dot notation — JSON pointer for JSON:API compatibility
- `source.pointer` vs `source.parameter` — pointer for body fields, parameter for query/headers

## Performance Considerations
- Error response rendering adds <0.5ms — negligible
- Logging 5xx errors adds I/O overhead — use async logging for high-traffic endpoints
- Error envelope is consistent — clients can parse generically

## Security Considerations
- Never include stack traces or internal paths in `detail` in production
- 404 errors must not reveal resource existence — generic "Resource not found" for all 404s
- 403 errors generic — "Forbidden" not "You are not the owner of this resource"
- Server error `detail` should be generic — "An unexpected error occurred" in production, full detail in log

## Related Rules
- Define Error Envelope With Top-Level `errors` Key
- Map Validation Errors to `source.pointer` Per JSON:API
- Use Application-Specific Error `code` Field
- Always Log 5xx Errors With Full Context
- Return Consistently Across All Error Types
- Never Include Stack Traces In Error Responses
- Use Custom Exception Classes for Domain Errors

## Related Skills
- Envelope Response Design — for success envelope structure
- Exception Rendering Customization — for handler implementation
- JSON Pointer Syntax — for source.pointer format
- Error Code Taxonomy — for code design

## Success Criteria
- All error responses follow the same envelope structure
- Every 4xx/5xx type returns in tests with correct envelope
- Validation errors include JSON pointer source and human-readable detail
- 5xx errors logged with full stack trace but response is generic
- Clients can parse any error generically with `errors[0].status` and `errors[0].code`
- Custom exception classes cover all domain-specific error scenarios
