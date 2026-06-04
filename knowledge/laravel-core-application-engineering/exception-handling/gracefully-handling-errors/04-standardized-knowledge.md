# Gracefully Handling Errors

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Gracefully Handling Errors
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

Graceful error handling is the practice of catching and responding to errors in a way that maintains application stability and provides useful feedback to users. It encompasses deciding where to catch exceptions (controller vs service vs global handler), how to signal failure (null vs exception vs error response), and what information to surface to users.

The engineering value is resilience. A gracefully handling application degrades partially instead of failing completely. Users see helpful messages instead of white screens. Logs contain actionable context. The application continues serving unaffected features while individual operations fail.

## Core Concepts

- **Catch Where You Can Recover:** Catch exceptions at the layer that has the context to handle them. The service layer catches recoverable failures (fall back to cache, degrade feature). The controller catches HTTP-specific errors (redirect with flash, different status code). The global handler catches everything else.
- **Expected vs Unexpected Failures:** Expected failures (not found, validation error, rate limit) are normal application states and should not trigger error-level logging. Unexpected failures (database down, queue failure) need immediate attention.
- **Recoverable vs Non-Recoverable:** Recoverable failures allow the application to continue (fall back to cached data, queue a retry). Non-recoverable failures require user notification and logging.
- **User-Facing Messages:** Users need actionable error messages (fix input, retry later) or nothing at all. Internal details (stack traces, SQL queries) belong in logs.

## When To Use

- Every user-facing operation that can fail needs graceful handling
- Service layer operations that can fall back to degraded behavior
- API endpoints that need consistent error responses
- Any operation where the user can take corrective action based on the error message

## When NOT To Use

- Infrastructure-level failures (disk full, out of memory) — let them bubble to the global handler
- Expected "not found" situations — return null, not an exception
- Operations where the failure doesn't affect the user experience (background cache warming)

## Best Practices

- **Catch at the right layer:** Service layer catches recoverable failures. Controller catches HTTP-specific errors. Global handler catches everything else.
- **Return null for expected absences:** Methods that might not find a result should return null (or use Maybe/Option pattern), not throw an exception.
- **Throw custom exceptions for unexpected failures:** Custom exception types carry context and enable type-specific handling.
- **Never expose internals to users:** Stack traces, SQL queries, and file paths belong in logs, not error messages.
- **Use error reference IDs:** A reference ID in the user-facing message links user reports to log entries.

## Architecture Guidelines

- Let unhandled exceptions bubble to the global handler — don't catch what you can't handle
- Catch at service layer for recoverable failures (fall back, cache, degrade)
- Catch at controller for HTTP-specific error responses (redirect, flash, status code)
- Return null for expected absences, throw exceptions for unexpected failures
- Never return error responses from non-controller layers — couples method to HTTP
- Show generic messages with reference IDs for system errors, specific messages for user errors

## Performance Considerations

Catching exceptions is cheap (~0.001ms). Creating exception instances is cheap (~0.01ms). Stack trace generation in logging adds cost (~1-5ms). Do NOT use exceptions for control flow — expected conditions should use return values, not exceptions. The performance cost is in logging, not exception creation.

## Security Considerations

- Never expose stack traces, file paths, or internal error details to users
- Keep error messages generic for production — specific details go in logs
- Error reference IDs should be unique but not sequential (prevents enumeration attacks)
- Avoid leaking user identification in error messages ("User john@example.com not found")
- Error messages must not reveal database schema or application internals

## Common Mistakes

1. **Catching Too High:** Catching every exception in the controller with a generic handler. The controller can't provide specific recovery — it should let domain exceptions bubble to the global handler.

2. **Silent Swallow:** `catch (Exception $e) {}` with no logging, reporting, or recovery. The error is invisible.

3. **Exposing Internals:** `return response()->json(['error' => $e->getTraceAsString()], 500)` exposes file paths, line numbers, and class names.

4. **Exception for Control Flow:** Throwing and catching exceptions for expected conditions (user not found during login). Use return values for expected outcomes.

5. **Wrong Layer, Wrong Concern:** Service layer returning redirect responses — couples business logic to HTTP. Services should throw exceptions; controllers handle HTTP concerns.

## Anti-Patterns

- **The Catch-All Controller:** Every controller method wrapped in try/catch that returns generic error responses. Bypasses handler customization, creates duplication.
- **The Exposed Trace:** Stack traces, file paths, and internal IDs shown in user-facing error messages.
- **The Silent Failure:** A caught exception that's neither logged nor recovered — the user sees success but the operation failed.
- **The HTTP-Coupled Service:** A service method that returns redirect responses or calls `abort()`, making it unusable from queue jobs or CLI commands.

## Examples

### Service Layer Recovery
```php
class ProductService
{
    public function getRecommended(int $userId): Collection
    {
        try {
            return RecommendationEngine::forUser($userId);
        } catch (RecommendationEngineException $e) {
            Log::warning('Recommendation engine failed, using fallback', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return Product::popular()->limit(10)->get(); // degraded fallback
        }
    }
}
```

### Controller HTTP-Specific Handling
```php
class OrderController
{
    public function store(OrderRequest $request)
    {
        try {
            $this->orderService->placeOrder($request->validated());
        } catch (InsufficientInventoryException $e) {
            return redirect()->back()
                ->withInput()
                ->withErrors(['inventory' => 'Selected items are no longer available.']);
        }
    }
}
```

### Global Handler Catch-All
```php
$exceptions->renderable(function (Throwable $e, Request $request) {
    $ref = Str::uuid();
    Log::error('Unhandled exception', [
        'reference' => $ref,
        'exception' => get_class($e),
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
    ]);

    if ($request->expectsJson()) {
        return response()->json([
            'error' => ['message' => "Something went wrong. Reference: {$ref}"],
        ], 500);
    }

    return response()->view('errors.500', ['reference' => $ref], 500);
});
```

## Related Topics

- **Exception Handler Configuration** — base handler setup
- **Service Layer Design** — service boundaries and error handling
- **Custom Exception Classes** — domain-specific exceptions
- **Production vs Debug Display** — environment-specific error display
- **Error Tracking Integration** — error monitoring and alerting

## AI Agent Notes

- Catch at the layer that can recover: service for fallbacks, controller for HTTP, handler for everything else
- Return null for expected absences, throw exceptions for unexpected failures
- Never return HTTP responses from non-controller layers
- Use error reference IDs to link user reports to log entries
- Never expose internal details in user-facing error messages
- Log full context for debugging, show generic messages to users
