# Exception Rendering

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** error-handling-design
- **Knowledge Unit:** Exception Rendering
- **Last Updated:** 2026-06-04

---

## Executive Summary
Exception Rendering controls how exceptions are transformed into HTTP responses with the correct structure, status code, and content type. Proper rendering ensures that all API errors follow a consistent format regardless of their origin.

---

## Core Concepts
- **Render Method**: `render()` on the exception or `renderable()` in the handler converts an exception to a response
- **Content Type Negotiation**: Rendering JSON for API requests and HTML for web requests
- **Environment-Aware Rendering**: Different output in debug vs production (stack traces vs safe messages)
- **Error Response Shape**: The JSON structure of the rendered error (code, message, details, etc.)
- **Default vs Custom Rendering**: Framework default rendering vs custom rendering for specific exception types
- **Rendering Priority**: Exception method → renderable callbacks → framework default

---

## Mental Models
1. **Stage Director Model**: The exception handler is a stage director who decides how each exception "performs" its response — different costumes for different audiences (API vs web, debug vs production).
2. **Translation Kiosk Model**: Each exception type speaks a different internal language. The renderer translates each one into the unified language of HTTP responses.

---

## Internal Mechanics
When an exception reaches the handler, it first checks if the exception has a `render()` method. If not found, it iterates through registered `renderable()` callbacks. The first callback that returns a response wins. If no matching callback is found, the framework renders a default response based on the request's content type expectation.

---

## Patterns

### Pattern 1: Per-Exception Render Method
**Purpose**: Each custom exception class defines its own `render($request)` method
**Benefits**: Self-contained; exception knows how to present itself
**Tradeoffs**: Mixes presentation logic with exception domain logic

### Pattern 2: Centralized Handler Rendering
**Purpose**: All rendering logic lives in `App\Exceptions\Handler::register()`
**Benefits**: Centralized control; easier to audit
**Tradeoffs**: Handler grows with each new exception type

---

## Architectural Decisions
### When To Use
- All API projects that need consistent error response formats
- Projects with specific error response contracts (e.g., JSON:API, RFC 9457)

### When To Avoid
- Simple APIs where default error responses are acceptable
- Prototypes where error consistency isn't a priority

### Alternatives
- API resource classes for errors (treating errors as resources)
- Response macros for reusable error patterns

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Consistent error format | Rendering logic adds complexity | Standardize early; iterate later |
| Environment-specific output | Debug info leakage risk | Test with APP_DEBUG=false |
| Content-type negotiation | Multiple rendering paths to test | Test each content type separately |

---

## Performance Considerations
- Rendering adds ~2-5ms per error response
- Stack trace generation is expensive in debug mode; disable in production
- Logging inside renderers adds I/O overhead

---

## Production Considerations
- Always test error rendering with `APP_DEBUG=false`
- Ensure error responses don't contain sensitive data (DB queries, file paths)
- Log the original exception before rendering (renderer may catch it silently)
- Return appropriate `Content-Type` header matching the error response format
- Use the same JSON structure for all error responses, regardless of exception type

---

## Common Mistakes
**Inconsistent rendering across exception types**: Some exceptions return `{error}`, others return `{message}`. Use a consistent envelope for all errors.
**Rendering HTML for API requests**: HTML error pages returned for JSON-requesting clients breaks integration. Check `$request->expectsJson()` before rendering.
**Forgetting to call `report()`**: Rendering without logging means silent failures. Always call `report()` or use `$this->renderable()` with reporting.

---

## Failure Modes
**Infinite render loop**: A render callback that throws an exception triggers another render attempt. *Detection:* Timeout error. *Mitigation:* Wrap render logic in try-catch with a fallback response.
**Content-type mismatch**: The rendered response Content-Type doesn't match the request's Accept header. *Detection:* Client parsing errors. *Mitigation:* Match response Content-Type to the request.

---

## Ecosystem Usage
Laravel's `App\Exceptions\Handler` provides `$this->renderable()` to register closures. `$exception->render($request)` takes priority. The `ShouldRenderJson` interface can tag exceptions that should always render as JSON.

---

## Related Knowledge Units
### Prerequisites
- Controller exception handling
- Error response shape design

### Related Topics
- Global exception handler configuration
- Production vs dev error detail levels
- Content type negotiation

### Advanced Follow-up Topics
- Custom renderer classes for complex formatting
- RFC 9457 problem details rendering
- Multi-format error rendering (JSON, XML, Protobuf)

---

## Research Notes
- `$this->renderable()` callbacks are checked in registration order, not specificity order
- Exceptions that implement `Renderable` interface have their `render()` called automatically
- The `Responsable` interface can be implemented by exceptions to return any response type, including API resources
