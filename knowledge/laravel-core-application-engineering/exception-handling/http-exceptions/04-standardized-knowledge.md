# HTTP Exception Rendering

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** HTTP Exception Rendering
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

HTTP exceptions represent HTTP-level error conditions (404 Not Found, 403 Forbidden, 500 Internal Server Error). Laravel provides `Symfony\Component\HttpKernel\Exception\HttpException` and its subclasses (`NotFoundHttpException`, `AccessDeniedHttpException`, etc.) for standard HTTP error codes. The handler converts these exceptions into appropriate responses — HTML error pages for web routes, JSON for API routes.

The engineering value is consistent, standards-compliant error responses for HTTP-level failures. Instead of manually returning 404 responses from controllers, you throw `NotFoundHttpException` and let the handler render the appropriate response for any request type.

## Core Concepts

- **HTTP Exception Classes:** `NotFoundHttpException` (404), `AccessDeniedHttpException` (403), `UnauthorizedHttpException` (401), `BadRequestHttpException` (400), `TooManyRequestsHttpException` (429), `HttpException` (generic/any).
- **The abort() Helper:** `abort(404, 'message')` is syntactic sugar for `throw new NotFoundHttpException()`. Concise, globally available.
- **Custom Error Pages:** Blade templates in `resources/views/errors/{status}.blade.php` are rendered automatically when no `renderable()` callback matches. Pages receive `$exception` and `$message`.
- **ModelNotFoundException → 404:** Eloquent's `findOrFail()` throws `ModelNotFoundException`, which the handler converts to `NotFoundHttpException`.
- **Content Negotiation:** Laravel checks `$request->expectsJson()` to decide HTML vs JSON response for HTTP exceptions.

## When To Use

- `abort(404)` for quick exits from controllers or middleware
- Custom error pages for branded 403, 404, 429, 500, 503 responses
- `renderable()` callbacks for HTTP exceptions when custom response logic is needed
- Inertia error components for SPA-like error experiences

## When NOT To Use

- Do NOT return raw error responses from controllers — throw HTTP exceptions and let the handler manage rendering
- Do NOT use `abort()` for domain-level errors — use custom exception classes
- Do NOT forget JSON error responses for API routes — a 404 in an API that returns HTML breaks API clients
- Do NOT put business logic in error page views — error views should be simple and reliable

## Best Practices (WHY)

- **Why use abort() over manual responses:** Consistent rendering through the handler. Every 404 goes through the same pipeline, ensuring consistent format across the application.
- **Why custom error pages:** Default Laravel error pages are unbranded and unhelpful. Custom pages provide helpful navigation, branding, and a better user experience.
- **Why test error pages:** A layout change can break the 404 page. Users see a white screen instead of a branded error. Always test at least 404 and 500 pages.
- **Why handle Inertia errors in the handler:** Inertia requests expect error components, not Blade pages. Handle content negotiation in the handler, not in controllers.

## Architecture Guidelines

- Customize at minimum `resources/views/errors/403.blade.php`, `404.blade.php`, `429.blade.php`, `500.blade.php`, `503.blade.php`
- Include helpful information on 404s (similar pages, search, home link)
- Never expose stack traces on production error pages
- Log 404s with the requested URL to detect broken links or attacks
- Use `abort_if()` and `abort_unless()` for conditional HTTP errors
- For Inertia apps, render error components via handler callbacks

## Performance

Error pages are served only during error conditions — performance is irrelevant. Even complex error pages have negligible impact because they're served rarely.

## Security

- Never expose stack traces, file paths, or internal error details in production error pages
- Error page views should not include sensitive data accessible via `$exception`
- For 500 errors, always show a generic message in production — never the actual error

## Common Mistakes

1. **Not Customizing Error Pages:** Default Laravel error pages are unbranded and unhelpful. Users see a plain page with no navigation or branding.

2. **Hardcoded Error Responses in Controllers:** `return response()->json(['error' => 'Not found'], 404)` in controllers instead of throwing exceptions. Bypasses the centralized handler and creates inconsistency.

3. **Forgetting JSON Error Responses for API Routes:** A 404 in an API route returns HTML if `shouldRenderJsonWhen` is not configured. API clients can't parse HTML.

4. **Error Page Exception:** The error page itself throws an exception (missing variable, broken layout). User sees a bare 500 response. Test error pages thoroughly.

## Anti-Patterns

- **The Inline Error Response:** Every controller has its own `return response()->json(...)` for errors. Creates inconsistent formats across endpoints. Use the centralized handler.
- **The Unbranded Error Page:** Using Laravel's default error pages in production. No branding, no navigation, poor user experience. Customize at minimum 404 and 500.
- **The Missing JSON Handler:** API routes that return HTML error pages because no JSON render callback is configured. API clients crash on HTML responses.

## Examples

### Throwing HTTP Exceptions
```php
// Via abort helper
abort(404, 'User not found.');
abort_if(!$user->isAdmin(), 403, 'Admin access required.');
abort_unless($post->isPublished(), 404, 'Post not found.');

// Via model binding (automatic)
Route::get('/users/{user}', function (User $user) {
    // Automatically throws ModelNotFoundException (renders as 404)
});
```

### Custom Error Page
```blade
{{-- resources/views/errors/404.blade.php --}}
<x-layout>
    <h1>Page Not Found</h1>
    @if($exception?->getMessage())
        <p>{{ $exception->getMessage() }}</p>
    @endif
    <a href="/">Go Home</a>
</x-layout>
```

### Inertia Error Handling in Handler
```php
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->inertia()) {
        return Inertia::render('Errors/NotFound', [
            'status' => 404,
            'message' => $e->getMessage(),
        ])->toResponse($request);
    }
});
```

### Dynamic Error Pages Based on Route
```php
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->is('api/*')) {
        return response()->json(['error' => 'Resource not found', 'type' => 'not_found'], 404);
    }
    if ($request->inertia()) {
        return Inertia::render('Errors/NotFound')->toResponse($request);
    }
    return response()->view('errors.404', ['exception' => $e], 404);
});
```

## Related Topics

- **Exception Handler Configuration** — how HTTP exceptions fit into the handler
- **JSON Error Formatting** — JSON responses for HTTP exceptions
- **Production vs Debug Display** — environment-specific display
- **Custom Exceptions** — domain exceptions that extend HttpException

## AI Agent Notes

- Use `abort()` for simple HTTP exits from controllers/middleware
- Customize `resources/views/errors/{403,404,429,500,503}.blade.php`
- Configure `shouldRenderJsonWhen` for API routes to ensure JSON error responses
- Handle Inertia error rendering in the handler, not in controllers
- Test error page views to ensure they render without errors

## Verification

- [ ] Custom error pages exist for at least 404 and 500
- [ ] `shouldRenderJsonWhen` is configured for API routes
- [ ] Inertia error components are rendered via handler (if using Inertia)
- [ ] Error pages are tested and render without exceptions
- [ ] No stack traces are exposed in production error pages
- [ ] `abort_if()` and `abort_unless()` are used for conditional HTTP errors
- [ ] 404s are logged with the requested URL for monitoring
