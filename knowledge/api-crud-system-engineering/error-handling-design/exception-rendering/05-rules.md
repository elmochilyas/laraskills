# Rules: Exception Rendering

## Rule: Define render() On Custom Exception Classes
- **Condition:** When creating custom exception classes for API errors
- **Action:** Implement the `render()` method that returns a `JsonResponse` with the standardized error envelope and appropriate HTTP status code.
- **Consequence:** Error response logic lives with the exception; handler stays clean.
- **Enforcement:** PHPStan detects custom exceptions without `render()` method.

## Rule: Use renderable() For Third-Party Exceptions Only
- **Condition:** When handling exceptions from packages or framework
- **Action:** Register `renderable()` callbacks only for exceptions your code cannot modify. Use `render()` for your own exception classes.
- **Consequence:** Handler remains maintainable; exception-render coupling is explicit.
- **Enforcement:** Review flags excessive renderable() callbacks in Handler.

## Rule: Return Consistent Error Envelopes
- **Condition:** In all exception rendering code
- **Action:** Ensure every rendered exception returns the same error envelope structure — status, code, message, and optional details.
- **Consequence:** Consumers parse errors consistently regardless of exception type.
- **Enforcement:** Integration tests verify error envelope structure for all exception types.

## Rule: Log All 5xx Exceptions With Full Context
- **Condition:** When rendering server-error exceptions
- **Action:** Log the exception with full details (stack trace, request context, user) before returning a generic error response.
- **Consequence:** Debugging information preserved without leaking to consumers.
- **Enforcement:** Monitoring alerts detect 5xx responses without corresponding log entries.

## Rule: Never Expose Stack Traces In Production
- **Condition:** When rendering exceptions in production environment
- **Action:** Strip debug information, stack traces, file paths, and environment details from responses. Return generic consumer-safe messages.
- **Consequence:** Internal system details not exposed to API consumers.
- **Enforcement:** Security tests verify production error responses don't contain debug information.

## Rule: Register JSON-Only Fallback For API Routes
- **Condition:** When configuring the exception handler for API applications
- **Action:** Register a renderable callback that catches all unhandled exceptions and returns JSON for API requests, regardless of environment.
- **Consequence:** API routes never return HTML debug pages.
- **Enforcement:** Integration tests verify API routes return JSON for all error scenarios.
