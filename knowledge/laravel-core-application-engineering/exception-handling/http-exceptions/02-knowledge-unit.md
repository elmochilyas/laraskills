# HTTP Exceptions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** HTTP Exceptions
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

HTTP exceptions represent HTTP-level error conditions (404 Not Found, 403 Forbidden, 500 Internal Server Error). Laravel provides `Symfony\Component\HttpKernel\Exception\HttpException` and its subclasses (`NotFoundHttpException`, `AccessDeniedHttpException`, etc.) for standard HTTP error codes.

The engineering value is consistent, standards-compliant error responses for HTTP-level failures. Instead of manually returning 404 responses from controllers, you throw `NotFoundHttpException` and let the handler render the appropriate response for any request type.

---

## Core Concepts

### HTTP Exception Classes

| Exception | HTTP Code | When Thrown |
|---|---|---|
| `NotFoundHttpException` | 404 | Route not found, model not found |
| `AccessDeniedHttpException` | 403 | Authorization failure |
| `UnauthorizedHttpException` | 401 | Authentication required |
| `BadRequestHttpException` | 400 | Malformed request |
| `MethodNotAllowedHttpException` | 405 | Wrong HTTP method |
| `TooManyRequestsHttpException` | 429 | Rate limit exceeded |
| `HttpException` | (any) | Generic HTTP error |

### Throwing HTTP Exceptions

```php
// From a controller — explicit
throw new NotFoundHttpException('User not found.');

// Via abort helper — more common
abort(404, 'User not found.');

// Via model binding — automatic
Route::get('/users/{user}', function (User $user) {
    // Automatically throws ModelNotFoundException (renders as 404)
});
```

### Custom Error Pages

```
resources/views/errors/
  403.blade.php
  404.blade.php
  419.blade.php  (CSRF token mismatch)
  429.blade.php
  500.blade.php
  503.blade.php  (maintenance mode)
```

Each file is rendered automatically when the corresponding HTTP exception is not caught by a `renderable()` callback.

---

## Mental Models

### The HTTP Status Code as Exception Type

HTTP exceptions are an elegant mapping: the exception class name IS the HTTP status code. `NotFoundHttpException` means 404. `AccessDeniedHttpException` means 403. You don't need to remember status codes — the class name tells you.

### The abort() Shortcut

`abort(404)` is syntactic sugar for `throw new NotFoundHttpException()`. It's a global helper that throws the appropriate exception. Use it for quick exits from controllers or middleware.

---

## Internal Mechanics

### ModelNotFoundException Rendering

When Eloquent's `findOrFail()` or `firstOrFail()` throws `ModelNotFoundException`, Laravel's handler converts it to a `NotFoundHttpException` in the `render()` method:

```php
// Built-in handler logic
$this->renderable(function (ModelNotFoundException $e, Request $request) {
    throw new NotFoundHttpException($e->getMessage(), $e);
});
```

### View Resolution for Error Pages

Laravel looks for `views/errors/{status}.blade.php`. If found, it renders that view with status code. If not found, it uses the framework's default error page:

```php
// Default render logic
if (view()->exists("errors.{$status}")) {
    return response()->view("errors.{$status}", [
        'exception' => $e,
        'message' => $e->getMessage(),
    ], $status);
}
```

### Custom Error Page Data

Error views receive `$exception` (the Throwable instance) and `$message` (the exception message):

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

---

## Patterns

### Inertia Error Pages

```blade
{{-- resources/views/errors/404.blade.php --}}
@inertia('Errors/NotFound', ['status' => 404])
```

Or handle in the exception handler:

```php
$this->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->inertia()) {
        return Inertia::render('Errors/NotFound', [
            'status' => 404,
            'message' => $e->getMessage(),
        ])->toResponse($request);
    }
});
```

### API Error Responses

```php
$this->renderable(function (HttpException $e, Request $request) {
    if ($request->expectsJson()) {
        return response()->json([
            'error' => [
                'code' => $e->getStatusCode(),
                'message' => $e->getMessage() ?: Response::$statusTexts[$e->getStatusCode()],
            ],
        ], $e->getStatusCode());
    }
});
```

### Dynamic Error Pages Based on Method

```php
$this->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->is('api/*')) {
        return response()->json([
            'error' => 'Resource not found',
            'type' => 'not_found',
        ], 404);
    }

    if ($request->inertia()) {
        return Inertia::render('Errors/NotFound')->toResponse($request);
    }

    return response()->view('errors.404', ['exception' => $e], 404);
});
```

### Maintenance Mode (503)

```php
// .env
APP_MAINTENANCE_MODE=true

// Or via artisan
php artisan down --retry=60 --render="errors.maintenance"
```

```blade
{{-- resources/views/errors/503.blade.php --}}
<x-layout>
    <h1>Under Maintenance</h1>
    <p>We'll be back soon.</p>
</x-layout>
```

---

## Architectural Decisions

### abort() vs throwing Specific Exceptions

| Concern | abort() | Specific Exception |
|---|---|---|
| Readability | Concise | Explicit |
| Controller logic | Simple (single line) | More code |
| Custom data | Limited (message only) | Full context |
| Testability | Harder to assert | Easy to assert |

Use `abort()` for simple exits. Throw specific exceptions when you need custom context.

### Single Error Page vs Multiple

| Approach | When |
|---|---|
| Single `errors/500.blade.php` | Small app, generic styling |
| Per-status pages | Branded, helpful error pages per code |
| Inertia error components | Inertia app with SSR |

---

## Tradeoffs

| Concern | Custom Error Pages | Default Error Pages |
|---|---|---|
| Brand consistency | Full control | Framework-styled |
| User experience | Helpful (suggestions, search) | Minimal |
| Development effort | Design each page | Zero effort |

---

## Performance Considerations

Error pages are served only during error conditions — performance is irrelevant. Even complex error pages have negligible impact because they're served rarely.

---

## Production Considerations

- Customize `resources/views/errors/403.blade.php`, `404.blade.php`, `429.blade.php`, `500.blade.php`, `503.blade.php`
- Include helpful information on 404s (similar pages, search, home link)
- Never expose stack traces on production error pages
- Log 404s with the requested URL to detect broken links or attacks
- Use `abort_if()` and `abort_unless()` for conditional HTTP errors:
  ```php
  abort_if(!$user->isAdmin(), 403, 'Admin access required.');
  abort_unless($post->isPublished(), 404, 'Post not found.');
  ```
- Monitor 404/500 rates — a spike indicates problems

---

## Common Mistakes

### Not Customizing Error Pages

Default Laravel error pages are unbranded and unhelpful. Users see a plain white page with "Sorry, the page you are looking for could not be found." Customize at least 404 and 500.

### Hardcoded Error Responses in Controllers

```php
// Bad — inconsistent with handler
public function show($id)
{
    $user = User::find($id);
    if (!$user) {
        return response()->json(['error' => 'Not found'], 404);
    }
}

// Good — let the handler manage rendering
public function show($id)
{
    $user = User::findOrFail($id);
}
```

### Forgetting JSON Error Responses for API Routes

A 404 is thrown in an API route, but no JSON render callback is registered. The API client gets HTML instead of JSON. Configure `shouldRenderJsonWhen` in the handler.

---

## Failure Modes

### Error Page Exception

The error page itself throws an exception (e.g., missing variable, broken layout). Laravel returns a bare 500 response (no HTML). The user sees a white screen. Test error pages to ensure they render under all conditions.

### Lost Exception Context

A 404 with an empty message (`abort(404)` without a second argument). The error page shows no helpful information. Always include a descriptive message for non-obvious errors.

---

## Ecosystem Usage

### Laravel Error Page Templates

Community packages like laravel-error-pages provide pre-designed, branded error page templates that can be published and customized.

### Inertia.js

Inertia error components (Errors/NotFound, Errors/Forbidden, etc.) can replace Blade error pages, providing a consistent SPA-like experience for HTTP errors.

### Laravel Telescope

Telescope captures HTTP exceptions with request context, making it easier to debug 404s, 403s, and other HTTP errors during development.

### Laravel Debugbar

The debugbar displays HTTP exception information, including the exception class, message, and stack trace.

---

## Related Knowledge Units

- **Exception Fundamentals** (this workspace) — how HTTP exceptions fit into the handler
- **Global Exception Handling** (this workspace) — customizing HTTP exception rendering
- **API Exception Handling** (this workspace) — JSON responses for HTTP exceptions
- **Custom Exception Classes** (this workspace) — domain exceptions that extend HttpException
- **Exception Testing** (this workspace) — testing HTTP exception rendering

---

## Research Notes

- `abort()` helper throws `Symfony\Component\HttpKernel\Exception\HttpException`
- Error views go in `resources/views/errors/` — Laravel resolves them by status code
- Error views receive `$exception` (the Throwable) and `$message` (from `$exception->getMessage()`)
- `ModelNotFoundException` is automatically converted to a 404 response
- `AuthenticationException` redirects to login (not a 401 page) by default
- `AuthorizationException` renders as 403
- `ThrottleRequestsException` renders as 429
- `MaintenanceModeException` renders as 503
- Error pages can use Blade components, layouts, and Alpine/Livewire
- Inertia error pages require handler customization to return `Inertia::render()` for error codes
