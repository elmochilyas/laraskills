# Skill: Implement Global Exception Handler Configuration

## Purpose
Configure `App\Exceptions\Handler` to render all API exceptions in consistent JSON format: override `render()` for custom handling, `register()` for custom reporting, and `$dontReport` for expected exceptions.

## When To Use
- API error handling setup
- Exception handler customization
- Consistent error response enforcement

## When NOT To Use
- Default exception handling
- Non-API applications

## Prerequisites
- Laravel exception handler
- Error envelope specification

## Inputs
- Exception-to-response mapping
- Report/don't report classification

## Workflow
1. Override `render()` in Handler to return JSON responses for API requests
2. Check request expects JSON: `$request->expectsJson()` or custom header check
3. Map exception types to HTTP status codes
4. Return error envelope: `response()->json(['errors' => [...]], $status)`
5. Configure `$dontReport` array for expected exceptions (ValidationException, AuthenticationException)
6. Use `register()` method for custom exception reporting
7. Handle `NotFoundHttpException` — generic "Resource not found"
8. Handle `MethodNotAllowedHttpException` — 405 with allowed methods
9. Log all unhandled exceptions with full context
10. Test handler for all exception types

## Validation Checklist
- [ ] `render()` overridden for JSON API responses
- [ ] Request JSON detection via `expectsJson()`
- [ ] Exception-to-status mapping defined
- [ ] Error envelope returned consistently
- [ ] `$dontReport` configured
- [ ] `register()` for custom reporting
- [ ] NotFoundHttpException handled with 404
- [ ] MethodNotAllowedHttpException handled with 405
- [ ] Unhandled exceptions logged
- [ ] All exception types tested

## Related Skills
- Exception Rendering
- Standardized Error Envelope
- Custom Exception Classes
- Error Response Testing
