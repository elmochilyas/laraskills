# Controller Exception Handling

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** error-handling-design
- **Knowledge Unit:** Controller Exception Handling
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Controller Exception Handling determines how exceptions thrown during request processing are caught, interpreted, and converted into API error responses. Proper handling ensures consistent error responses, prevents sensitive data leaks, and provides meaningful debugging information for developers.

---

## Core Concepts
- **Try-Catch in Controllers**: Catching exceptions at the controller level for custom error responses
- **Exception Type Mapping**: Mapping exception types to HTTP status codes and error response structures
- **Form Request Exceptions**: How `ValidationException` is automatically converted to a JSON error response
- **Model Not Found Exceptions**: `ModelNotFoundException` becomes a `404` response automatically
- **Authorization Exceptions**: `AuthorizationException` becomes a `403` response
- **Business Logic Exceptions**: Custom exceptions for domain-specific error conditions

---

## Mental Models
1. **Exception Waterfall Model**: Exceptions fall through the handler chain — controller → global handler → framework default. Catch at the right level for the right reason.
2. **Error Translation Model**: Exceptions are internal events; error responses are external messages. The handler translates between the two languages.

---

## Internal Mechanics
When a controller throws an exception, Laravel's router catches it and passes it to the exception handler (`App\Exceptions\Handler`). The handler's `render()` or `renderable()` methods convert the exception to a response. `ValidationException` and `AuthenticationException` use specific HTTP status codes. Custom exceptions can define their own `render()` or `toResponse()` methods.

---

## Patterns

### Pattern 1: Controller-Level Try-Catch
**Purpose**: Catch and handle exceptions within specific controllers for domain-specific responses
**Benefits**: Fine-grained control over error messages
**Tradeoffs**: Controllers become cluttered with try-catch blocks

### Pattern 2: Global Exception Handler Mapping
**Purpose**: Register `renderable()` callbacks in `App\Exceptions\Handler` for exception-to-response mapping
**Benefits**: Centralized error handling; cleaner controllers
**Tradeoffs**: Less visibility into which exceptions are handled

---

## Architectural Decisions
### When To Use
- All API endpoints that need consistent error responses
- Endpoints with domain-specific exceptions
- APIs where error messages need to be consumer-friendly

### When To Avoid
- Trivial endpoints that don't throw custom exceptions
- Endpoints where framework default error responses are acceptable

### Alternatives
- Custom exception classes with `render()` methods for self-contained error handling
- Middleware-based exception handling for cross-cutting error concerns

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Consistent error responses | Centralized handler can become bloated | Organize renderable callbacks by domain |
| Controllers stay clean | Global handling can hide errors | Log exceptions before rendering |
| Custom error messages | Exception-to-response mapping adds abstraction | Document the mapping for developers |

---

## Performance Considerations
- Exception handling is slow in PHP (~10x slower than normal flow) — don't use exceptions for control flow
- The global handler processes every exception; complex `renderable()` callbacks add overhead
- Logging exceptions adds I/O overhead; use async logging for high-throughput APIs

---

## Production Considerations
- Never expose stack traces in production error responses
- Log the full exception with context for debugging
- Use different error detail levels for different environments
- Monitor exception rates to detect systemic issues
- Ensure error responses comply with your API error contract

---

## Common Mistakes
**Using exceptions for control flow**: Throwing exceptions for expected validation failures is expensive. Use validation or dedicated error result types.
**Leaking stack traces**: Catching exceptions and returning them in responses exposes application internals. Use `report()` for logging and return safe messages.
**Inconsistent exception handling**: Some controllers use try-catch, others rely on the global handler. Choose one pattern and apply consistently.

---

## Failure Modes
**Unhandled exception types**: A new exception type not registered in the handler returns the default framework error response. *Detection:* Testing with that exception type. *Mitigation:* Register catch-all renderable for fallback.
**Sensitive data in exception messages**: Exceptions carrying database query details or user PII appear in logs or responses. *Detection:* Log review. *Mitigation:* Sanitize exception messages before rendering.

---

## Ecosystem Usage
Laravel's `App\Exceptions\Handler` provides `render()` and `register()` methods. The `renderable()` closure receives the exception and request. `$this->renderable(function (CustomException $e) { ... })` registers type-specific handlers.

---

## Related Knowledge Units
### Prerequisites
- HTTP status codes
- Laravel exception handler configuration

### Related Topics
- Custom exception classes
- Error code taxonomy
- Validation error response design

### Advanced Follow-up Topics
- Domain-specific error code mapping
- Exception rendering for different content types
- Error tracking integration

---

## Research Notes
- `renderable()` callbacks are checked in order; the first match wins, not the most specific
- `$exception->render($request)` on the exception itself is checked before `renderable()` callbacks
- API resources can be returned from `renderable()` closures for consistency with normal responses
