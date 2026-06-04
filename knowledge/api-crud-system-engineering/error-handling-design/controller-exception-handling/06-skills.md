# Skill: Implement Controller Exception Handling

## Purpose
Handle exceptions at controller level with try-catch blocks for recoverable errors, domain exceptions mapped to HTTP responses, and consistent error logging without breaking the global error envelope.

## When To Use
- Controller actions with exception-prone operations (external API calls, file processing)
- Business logic actions that may throw domain exceptions
- User-facing operations where error recovery is possible

## When NOT To Use
- Standard CRUD operations — exception handler covers these
- Auth failures — middleware catches these before controller

## Prerequisites
- Exception handler configuration
- Custom exception classes

## Inputs
- Controller action specifications
- Domain exception definitions

## Workflow
1. Use try-catch in controller for recoverable exceptions — API timeouts, third-party failures
2. Catch specific exception classes — never catch generic `Exception`
3. Map domain exceptions to HTTP responses with correct status codes
4. Convert caught exceptions to renderable error envelope format
5. Log caught exceptions with context (user, request_id, action) for debugging
6. Re-throw exceptions that can't be recovered at controller level
7. Return error envelope `$response->withErrors()` for validation-style errors
8. Use `report()` helper for exceptions that need logging but not blocking
9. Never swallow exceptions silently — always log or report
10. Keep try-catch logic minimal — delegate complex error handling to actions/services

## Validation Checklist
- [ ] Try-catch for recoverable exceptions only
- [ ] Specific exception classes caught, never generic `Exception`
- [ ] Domain exceptions mapped to appropriate HTTP status codes
- [ ] Caught exceptions logged with context
- [ ] Unrecoverable exceptions re-thrown to exception handler
- [ ] Error envelope returned for caught exceptions
- [ ] `report()` used for non-blocking exception logging
- [ ] No silent exception swallowing
- [ ] Try-catch blocks are minimal — logic not duplicated
- [ ] Integration tests cover controller exception scenarios

## Common Failures
- Catching generic `Exception` — masks programming errors (syntax, type errors)
- Silent catch — exception caught but not logged, invisible in monitoring
- Returning non-standard error response — breaks client error parsing
- Over-catching — catching exceptions that exception handler handles better
- No re-throw for unrecoverable — leaves system in inconsistent state
- Try-catch wrapping entire controller — logic errors within caught block masked

## Decision Points
- Controller vs action level try-catch — action for business exceptions, controller for HTTP concerns
- Log level per exception type — warn for 4xx recoverable, error for 5xx
- Report vs log — report for exceptions that shouldn't recur, log for expected failures

## Performance Considerations
- Try-catch has zero overhead when no exception thrown
- Exception stack trace generation adds ~1ms when caught — catch early where possible
- Logging IO for caught exceptions adds latency — use async logging in production

## Security Considerations
- Caught exception messages must not leak sensitive details in response
- Log caught exceptions with full detail but response is generic
- Never expose third-party API response content in error messages
- Ensure 5xx exceptions re-thrown for proper logging by exception handler

## Related Rules
- Catch Specific Exception Classes Only
- Log Caught Exceptions With Context
- Map Domain Exceptions To Appropriate HTTP Responses
- Re-throw Unrecoverable Exceptions
- Never Swallow Exceptions Silently
- Return Error Envelope For Caught Exceptions

## Related Skills
- Standardized Error Envelope — for consistent error format
- Exception Rendering — for exception handler integration
- Custom Exception Classes — for domain exception design
- Error Logging Strategy — for logging architecture

## Success Criteria
- Controllers handle recoverable exceptions gracefully with consistent error responses
- Domain exception classes correctly map to appropriate HTTP status codes
- All caught exceptions logged with request_id and user context
- Unrecoverable exceptions bubble up to exception handler
- No silent exception swallowing — every caught exception is logged or reported
- Integration tests verify controller exception behavior per scenario
