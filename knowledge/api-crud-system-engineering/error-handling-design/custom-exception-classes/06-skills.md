# Skill: Design Custom Exception Classes

## Purpose
Create domain-specific exception classes extending `HttpException` or base `Exception` with renderable methods returning consistent JSON error envelope and appropriate HTTP status codes.

## When To Use
- Domain-specific business logic errors
- Errors needing specific HTTP status codes
- Exception hierarchy for API error handling

## When NOT To Use
- Standard HTTP errors (404, 401, 403) — use framework exceptions
- Validation errors — use `ValidationException`
- Simple errors without additional context

## Prerequisites
- Exception rendering customization
- Error code taxonomy

## Inputs
- Error scenario list
- Error envelope specification

## Workflow
1. Create custom exception class extending `Symfony\Component\HttpKernel\Exception\HttpException` for API errors
2. Define constructor accepting message, status code, error code, and optional data
3. Override `render()` to return JSON error envelope: `response()->json([...], $this->getStatusCode())`
4. Include application-specific error code from taxonomy in response
5. Include relevant detail and source pointer where applicable
6. Include `report()` override for selective logging — log only server errors, not client errors
7. Use custom exceptions in action classes and controllers: `throw new UserAlreadyExistsException($email)`
8. Register exception in `App\Exceptions\Handler` `$dontReport` array if not logged
9. Keep exception hierarchy flat — one level deep, not five levels of inheritance
10. Document each exception type with trigger scenario and HTTP status code

## Validation Checklist
- [ ] Custom exception classes extend HttpException or base Exception
- [ ] Constructor accepts message, status code, error code
- [ ] `render()` returns consistent JSON error envelope
- [ ] Application-specific error code included
- [ ] Detail and source pointer included where applicable
- [ ] `report()` for selective logging
- [ ] Exceptions used in actions/services
- [ ] `$dontReport` configured in Handler
- [ ] Exception hierarchy is flat
- [ ] Exception types documented

## Common Failures
- Exception hierarchy too deep — `SpecializedUserDomainException extends UserDomainException extends DomainException`
- `render()` not returning envelope — standard HTML error page for API
- No error code — client can't programmatically identify error type
- `report()` not overridden — all 4xx errors logged as errors (noisy)
- Exception doing business logic in constructor — keep constructors light
- Catching generic Exception that then throws custom exception — lose original context

## Decision Points
- Extend HttpException vs base Exception — HttpException for HTTP-aware, base for domain-only
- render() vs exception handler — render() for exception-specific, handler for global
- Report vs don't report — 4xx client errors generally don't report, 5xx do

## Performance Considerations
- Exception construction is fast (~0.001ms)
- Stack trace generation adds 0.5-1ms — only relevant for 5xx exceptions
- Custom exceptions with additional data increase serialization overhead slightly

## Security Considerations
- Exception messages must not leak sensitive information in response
- `render()` response must use envelope format — never output raw message
- `report()` must log full context including request_id for correlation
- `__toString()` or `__debugInfo()` should mask sensitive data

## Related Rules
- Create Custom Exception Classes For Domain Errors
- Override render() For JSON Error Envelope
- Include Application-Specific Error Code
- Override report() For Selective Logging
- Keep Exception Hierarchy Flat
- Document Each Exception Type

## Related Skills
- Standardized Error Envelope — for error response format
- Exception Rendering — for handler integration
- Error Code Taxonomy — for error code design
- Controller Exception Handling — for controller catch patterns

## Success Criteria
- Custom exception for each domain business error scenario
- Consistent error envelope returned from all exceptions
- Error codes match taxonomy and are actionable
- Selective logging — 4xx not reported as errors, 5xx fully logged
- Exceptions used consistently in actions and services
- Exception types documented with triggers and status codes
