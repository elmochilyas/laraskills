# Exception Rendering Patterns

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Exception Rendering Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

Exception rendering patterns determine how exceptions are converted into HTTP responses — whether HTML error pages, JSON error envelopes, or Inertia error components. The rendering pipeline runs after the reporting pipeline and decides what the user actually sees.

The engineering value is appropriate error presentation for every request context. Web users see branded error pages. API clients receive structured JSON. Inertia apps show error components within the application shell. A well-configured rendering pipeline ensures the right format for every consumer.

## Core Concepts

- **Renderable Callback:** A closure registered via `$exceptions->renderable()` that receives the exception and request, and returns a response. Multiple callbacks can be registered; the first that returns a non-null response wins.
- **Error Page Templates:** Blade templates at `resources/views/errors/{status}.blade.php` that auto-resolve for specific HTTP status codes. The simplest approach for static error pages.
- **Exception render() Method:** A method on custom exception classes that returns a response directly. Self-contained rendering without handler registration.
- **Content Negotiation:** Determining JSON vs HTML response based on `$request->expectsJson()` and `shouldRenderJsonWhen()`.
- **Inertia Error Components:** Inertia applications render error components within the app shell using `Inertia::render('Error', { status })` in the renderable callback.

## When To Use

- Renderable callbacks for dynamic error responses (API vs HTML branching, user-specific content)
- Error page templates for static branded error pages (404, 403, 500, 503)
- Exception `render()` method for self-contained exception-specific responses
- Inertia error components for Inertia-based applications
- Catch-all renderable for `Throwable` as a safety net in production

## When NOT To Use

- Do NOT use renderable callbacks for static error pages — Blade templates auto-resolve by status code
- Do NOT put rendering logic in `reportable()` callbacks — pipelines must be independent
- Do NOT return void from a renderable callback — the handler falls through to default rendering
- Do NOT use the exception `render()` method when injected services or request data are needed

## Best Practices

- **Blade templates for static, renderable for dynamic:** Static branded pages use template auto-resolution. Dynamic responses (API vs HTML branching) use renderable callbacks.
- **Catch-all safety net:** Always register a catch-all `renderable()` for `Throwable` in production to ensure every exception returns a proper response.
- **Check request type first:** In renderable callbacks, check `$request->expectsJson()` or `$request->is('api/*')` before deciding the response format.
- **Keep rendering simple:** Error responses should not trigger database queries, external API calls, or complex logic.

## Architecture Guidelines

- Register renderable callbacks in order: most-specific exception types first, catch-all `Throwable` last
- Configure `shouldRenderJsonWhen` for all applications with API routes
- Use Blade error page templates for standard HTTP status codes (403, 404, 429, 500, 503)
- Use renderable callbacks for Inertia error rendering (check `X-Inertia` header)
- Keep renderable logic simple — no database calls or external API requests
- Test rendering for each request type (HTML, JSON, Inertia)

## Performance Considerations

Rendering adds minimal overhead: template resolution ~0.1ms, JSON response generation ~0.1ms. The `shouldRenderJsonWhen` check is O(1). Renderable callback traversal is O(n) over registered callbacks — keep under 20-30. Exception rendering is not a performance path.

## Security Considerations

- Never expose stack traces in production error responses (HTML or JSON)
- Keep error messages generic for production — specific details go in logs
- Ensure `shouldRenderJsonWhen` covers all API routes to prevent HTML leaks
- Test that error pages don't expose file paths or internal class names
- Inertia error components must not leak server state to the frontend

## Common Mistakes

1. **Renderable Returns Void:** A `renderable()` that calls `Log::warning()` but doesn't return a response. The handler falls through to default, which may render HTML for an API request.

2. **No Catch-All Renderable:** Unhandled exception types fall through to default error page. For API routes, this means HTML instead of JSON.

3. **Inertia Without Renderable:** Inertia requests get HTML error pages instead of error components within the app shell.

4. **Template for Dynamic Response:** Using a Blade template for an error that needs different responses per request type (API vs web).

5. **Wrong Renderable Order:** Registering the catch-all `Throwable` renderable before specific exception types. The catch-all matches everything — more specific types never execute.

## Anti-Patterns

- **The HTML Leak:** API routes returning HTML error pages because no JSON render callback exists.
- **The Single Format Assumption:** All errors rendered as HTML, breaking API clients and Inertia apps.
- **The Complex Renderable:** A renderable callback with database queries, external API calls, or business logic.
- **The Untested Error Page:** Custom error pages that break silently because no test verifies they render.

## Examples

### Catch-All API Renderable
```php
$exceptions->renderable(function (Throwable $e, Request $request) {
    if (!$request->is('api/*') && !$request->expectsJson()) {
        return;
    }

    $status = match (true) {
        $e instanceof HttpExceptionInterface => $e->getStatusCode(),
        $e instanceof ValidationException => 422,
        $e instanceof AuthenticationException => 401,
        $e instanceof ModelNotFoundException => 404,
        default => 500,
    };

    return response()->json([
        'error' => ['message' => $status >= 500 ? 'Server error.' : $e->getMessage()],
    ], $status);
});
```

### Inertia Error Rendering
```php
$exceptions->renderable(function (HttpException $e, Request $request) {
    if ($request->header('X-Inertia')) {
        return Inertia::render('Error', [
            'status' => $e->getStatusCode(),
        ])->toResponse($request);
    }
});
```

### Custom Exception render() Method
```php
class PaymentFailedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'error' => [
                'message' => $this->getMessage(),
                'type' => 'payment_failed',
                'code' => 422,
            ],
        ], 422);
    }
}
```

## Related Topics

- **Exception Handler Configuration** — base handler setup
- **JSON Error Formatting** — API error response structure
- **Error Pages Customization** — Blade error page templates
- **Inertia Integration** — Inertia error component rendering
- **Production vs Debug Display** — environment-specific rendering

## AI Agent Notes

- Use Blade templates for standard HTTP error pages (static, branded)
- Use renderable callbacks for dynamic responses (API vs HTML branching)
- Always register a catch-all renderable for `Throwable` as safety net
- Check `X-Inertia` header for Inertia-specific error rendering
- Register most-specific exception types first, catch-all last
- Test rendering for each request type the application supports
