# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Controller Exception Handling
**Difficulty:** Intermediate
**Category:** Error Handling
**Last Updated:** 2026-06-03

---

# Overview

Controller Exception Handling is the practice of catching and handling exceptions within controller actions — mapping domain exceptions to HTTP responses, logging with context, and maintaining consistent error envelopes. It exists as a complement to Laravel's global exception handler, handling recoverable exceptions that need controller-specific response logic.

Engineers must care because improper exception handling in controllers is the most common source of inconsistent API error responses. Some endpoints return structured errors, others return raw exception messages, and others silently swallow errors. Structured controller exception handling ensures every code path produces a consistent, consumer-friendly error response.

---

# Core Concepts

**Recoverable vs Unrecoverable Exceptions:** Recoverable exceptions (validation failure, not found, conflict) can be handled at the controller level with appropriate HTTP responses. Unrecoverable exceptions (database connection failure, programming errors) should be re-thrown to the global exception handler.

**Domain Exception Mapping:** Business logic exceptions (e.g., `InsufficientInventoryException`) are caught in the controller and mapped to specific HTTP responses with appropriate status codes and error envelopes.

**Try-Catch Scope:** Catch blocks should be as narrow as possible — wrapping only the code that can throw the specific exception, not the entire controller method.

**Error Envelope Consistency:** All caught exceptions must produce the standardized error envelope format — code, message, and optional details.

**Exception Logging:** Caught exceptions must be logged with sufficient context (user ID, request ID, action name) for debugging, but the response must not leak sensitive details.

**Re-throw vs Handle Decision:** The controller must decide whether an exception is recoverable (handle with error response) or unrecoverable (re-throw for global handler).

---

# When To Use

- Controller actions with exception-prone operations (external API calls, file processing)
- Actions that call business logic throwing domain-specific exceptions
- Operations where different exception types need different HTTP status codes
- Actions requiring custom error response content

---

# When NOT To Use

- Standard CRUD operations — let the global exception handler handle standard exceptions
- Authentication failures — auth middleware catches these before the controller
- Validation failures — FormRequest handles these before controller execution
- Operations where no controller-specific error handling is needed

---

# Best Practices

**Catch specific exception classes only.** Never catch the base `\Exception` or `\Throwable` in controllers. Specific catches preserve error type information.

**Map domain exceptions to appropriate HTTP status codes.** `ModelNotFoundException` → 404, `AuthorizationException` → 403, `DuplicateResourceException` → 409.

**Log caught exceptions with context.** Include user identifier, request ID, action name, and exception message. Use structured logging for searchability.

**Re-throw exceptions that can't be handled at controller level.** If the controller can't recover from an exception, let the global handler process it.

**Never swallow exceptions silently.** Every caught exception must be logged or reported. Silent catches hide production issues.

**Use report() for non-blocking exceptions.** For exceptions that should be tracked but don't require blocking the request, use `report()` instead of logging manually.

---

# Architecture Guidelines

**Controller exception handling is the last line of defense.** Actions and services should throw domain exceptions. The controller catches them and converts to HTTP responses.

**Keep try-catch blocks minimal.** The try block should contain only the code that throws the specific exception. General controller logic should remain outside try-catch.

**Error envelope creation should be delegated to a responder.** Controllers should not construct error arrays inline. Use `ErrorResponse::fromException()` or similar.

**Exception-to-HTTP mapping belongs in a dedicated mapper** or in custom exception classes with `render()` methods, not in controller catch blocks.

---

# Performance Considerations

**Try-catch has zero overhead when no exception is thrown.** The performance cost is only incurred in error paths.

**Exception stack trace generation adds ~1ms** when an exception is thrown and caught. Catch early in the call stack to minimize trace depth.

**Logging IO for caught exceptions adds latency.** Use async logging or queued log channels for production.

---

# Security Considerations

**Caught exception messages must not leak sensitive details in responses.** Map exceptions to generic consumer-facing messages. Keep detailed messages in logs.

**Never expose third-party API response content in error messages.** Log the full response for debugging; return a generic "external service error" to the consumer.

**Ensure 5xx exceptions are re-thrown** for proper logging by the global exception handler. Controllers should not catch and handle 5xx exceptions.

---

# Common Mistakes

**Catching generic Exception.** Masks programming errors (syntax errors, type errors, logic bugs). These should crash and be caught by the global handler.

**Silent catch.** Exception caught with empty catch block — not logged, not reported, invisible in monitoring.

**Non-standard error response.** Returning `['error' => 'Something went wrong']` when other endpoints return structured error envelopes.

**Over-catching.** Catching exceptions that the global exception handler handles better (model not found, authorization failure).

**No re-throw.** Catching an unrecoverable exception and returning a 200 response, leaving the system in an inconsistent state.

---

# Anti-Patterns

**Giant Try-Catch:** Wrapping the entire controller method in a single try-catch that catches `\Throwable`. Every error becomes a generic 500 response.
**Better approach:** Try-catch only the specific operation that can throw. Let the global handler manage unexpected exceptions.

**Swallowed Exceptions:** Empty catch blocks or catch blocks that only log without re-throwing. Errors disappear from monitoring.
**Better approach:** Always log or report. Re-throw unrecoverable exceptions.

**Error Response Inconsistency:** Different controllers returning different error formats for the same exception type.
**Better approach:** Use a centralized error response builder or rely on the global exception handler.

---

# Examples

**Controller exception handling:**
```
public function store(CreateOrderRequest $request): JsonResponse
{
    try {
        $order = $this->createOrder->__invoke($request->toDto());
        return response()->json($order, 201);
    } catch (InsufficientInventoryException $e) {
        report($e);
        return response()->json([
            'error' => [
                'code' => 'CONFLICT_003',
                'message' => 'Insufficient inventory to fulfill order',
            ]
        ], 409);
    }
}
```

---

# Related Topics

**Prerequisites:**
- Laravel Exception Handler
- Custom Exception Classes

**Closely Related Topics:**
- Standardized Error Envelope — error response format
- Exception Rendering — exception handler integration
- Custom Exception Classes — domain exception design

**Advanced Follow-Up Topics:**
- Error Logging Strategy — logging architecture
- Exception-to-Code Mapping — mapping exceptions to error codes

**Cross-Domain Connections:**
- Global Exception Handler Configuration
- Production vs Dev Error Detail
