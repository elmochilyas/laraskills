# Skill: Implement Custom HTTP Error Pages

## Purpose

Create branded, user-friendly Blade error pages for HTTP error statuses (403, 404, 429, 500, 503) that maintain the application's visual identity, provide helpful recovery options, and never expose internal details.

## When To Use

- During initial application setup — create error pages before first deployment
- When redesigning the application UI — ensure error pages match the new design
- When adding new error status pages (e.g., 429 for rate limiting, 503 for maintenance)

## When NOT To Use

- API-only applications that never serve HTML views — skip Blade customization
- Applications using Inertia — render Inertia error components through the handler instead

## Prerequisites

- Blade templating system configured
- Application layout component (`<x-layout>` or equivalent)
- Understanding of the error page auto-resolution: `resources/views/errors/{status}.blade.php`

## Inputs

- HTTP status codes to customize (403, 404, 429, 500, 503 minimum)
- Application layout and branding assets
- Navigation structure for recovery links
- The `$exception` variable (available in the error view scope)

## Workflow

1. Create a Blade view at `resources/views/errors/{status}.blade.php` for each status code (minimum: 403, 404, 429, 500, 503).

2. Use the application's layout component to maintain branding consistency:
   ```blade
   {{-- resources/views/errors/404.blade.php --}}
   <x-layout>
       <h1>Page Not Found</h1>
       <p>The page you're looking for doesn't exist or has been moved.</p>
       <a href="/">Go Home</a>
       <a href="/contact">Contact Support</a>
   </x-layout>
   ```

3. Include the HTTP status code in the HTML response by specifying the status as the second argument:
   ```blade
   @section('title', '404 - Page Not Found')
   ```

4. Optionally use the `$exception->getMessage()` for additional context, but never expose stack traces, file paths, or line numbers:
   ```blade
   @if($exception?->getMessage())
       <p>{{ $exception->getMessage() }}</p>
   @endif
   ```

5. Keep error pages simple — no database queries, API calls, or complex logic. Use only static content, layout includes, and basic conditionals.

6. Test each error page view directly to ensure it renders:
   ```php
   public function test_404_page_has_expected_content()
   {
       $view = $this->view('errors.404', ['exception' => new NotFoundHttpException()]);
       $view->assertSee('Page Not Found');
       $view->assertSee('Go Home');
       $view->assertDontSee('Stack Trace');
   }
   ```

## Validation Checklist

- [ ] Blade error views exist for at minimum 403, 404, 429, 500, 503
- [ ] Error pages use the application's layout for brand consistency
- [ ] Stack traces, file paths, and class names are never rendered
- [ ] Error pages include helpful navigation (home link, contact, search)
- [ ] Error pages contain no database queries or API calls
- [ ] Each error page has a corresponding view test
- [ ] 500 error page shows a generic message ("Something went wrong")
- [ ] Error pages are tested and render without exceptions

## Common Failures

1. **Default Laravel pages**: Not customizing error pages — users see unbranded, unhelpful pages with no navigation.

2. **Stack traces in error views**: Accidentally rendering `$exception->getTraceAsString()` or `$exception->getFile()` on production error pages.

3. **Cascading failure**: Error page runs a database query that fails because the database connection is the root cause of the error.

4. **Missing status code**: The error page returns HTTP 200 status instead of the correct error status — browsers and search engines don't recognize it as an error.

## Decision Points

- **Layout vs standalone**: Use the main application layout for brand consistency. If the layout depends on database data (user menu, notifications), consider a stripped-down error layout that avoids those dependencies.
- **$exception usage**: Use `$exception?->getMessage()` only for non-sensitive, user-facing context. Never expose `getFile()`, `getLine()`, or `getTrace()`.

## Performance Considerations

- Error pages are served only during error conditions — performance is irrelevant
- Even complex error pages have negligible impact because they are served rarely
- However, avoid database queries to prevent cascading failures

## Security Considerations

- Default Blade error pages may expose `$exception` details — review each view for accidental leakage
- Never render `$exception->getTraceAsString()`, `$exception->getFile()`, or `$exception->getLine()` in production
- 500 error pages must always show generic messages in production — never the actual error

## Related Rules

- Use abort() Instead of Returning Raw Error Responses from Controllers
- Customize Error Pages for at Minimum 403, 404, 429, 500, and 503
- Never Include Stack Traces or Internal Details in Production Error Pages
- Keep Error Page Views Simple and Free of Complex Logic
- Log 404s with the Requested URL for Broken Link Detection

## Related Skills

- Write Exception Handler Tests (exception-testing)
- Implement Content-Negotiated HTTP Error Responses (this file, below)

## Success Criteria

- All major HTTP error statuses (403, 404, 429, 500, 503) have branded error pages
- Error pages match the application's visual design
- No stack traces or internal details appear on any production error page
- Error pages render without exceptions even when the application is in a failure state
- Each error page has a passing view test

---

# Skill: Implement Content-Negotiated HTTP Error Responses

## Purpose

Configure the exception handler to return appropriate HTTP error responses (Blade views for web, JSON for API, Inertia components for Inertia requests) by detecting the request type and dispatching to the correct renderer.

## When To Use

- Applications with both web and API routes
- Inertia-based applications that need error components instead of Blade pages
- When a single error type (e.g., 404) needs different rendering per request type
- When ensuring API clients never receive HTML error pages

## When NOT To Use

- Pure web applications with no API routes — the default handler suffices
- Pure API applications with no web routes — only JSON responses needed
- Applications where all requests go through Blade/views exclusively

## Prerequisites

- Exception handler configured (see "Configure the Exception Handler" in exception-fundamentals)
- Blade error pages created (see "Implement Custom HTTP Error Pages")
- Inertia error components created (if using Inertia)
- API error envelope configured (see "Configure Global API Error Handler" in api-exception-handling)

## Inputs

- HTTP exception types (NotFoundHttpException, AccessDeniedHttpException, etc.)
- Request inspection methods: `$request->inertia()`, `$request->expectsJson()`, `$request->is('api/*')`
- Blade error view names (e.g., `errors.404`)
- Inertia error component names (e.g., `Errors/NotFound`)

## Workflow

1. Register a `renderable()` callback for `NotFoundHttpException` that performs content negotiation:
   ```php
   $exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
       if ($request->is('api/*') || $request->expectsJson()) {
           return response()->json([
               'error' => [
                   'message' => 'Resource not found.',
                   'type' => 'not_found',
                   'code' => 404,
               ],
               'request_id' => $request->header('X-Request-Id'),
           ], 404);
       }

       if ($request->inertia()) {
           return Inertia::render('Errors/NotFound', [
               'status' => 404,
           ])->toResponse($request);
       }

       return response()->view('errors.404', ['exception' => $e], 404);
   });
   ```

2. Repeat for other HTTP exceptions (403, 429, 500) with appropriate status codes and messages.

3. Ensure the `renderable()` callback returns `null` for unrecognized request types (this allows fallthrough to the default behavior).

4. Register a catch-all `renderable()` for `Throwable` as a safety net — only for JSON/API routes:
   ```php
   $exceptions->renderable(function (Throwable $e, Request $request) {
       if (!$request->is('api/*') && !$request->expectsJson()) {
           return;
       }

       return response()->json([
           'error' => [
               'message' => app()->environment('local')
                   ? $e->getMessage()
                   : 'An unexpected error occurred.',
               'type' => 'server_error',
               'code' => 500,
           ],
           'request_id' => $request->header('X-Request-Id'),
       ], 500);
   });
   ```

5. Log 404s with the requested URL for broken link detection:
   ```php
   $exceptions->reportable(function (NotFoundHttpException $e, Request $request) {
       Log::warning('Route not found', [
           'url' => $request->fullUrl(),
           'method' => $request->method(),
           'referer' => $request->header('referer'),
           'user_agent' => $request->userAgent(),
       ]);
   });
   ```

6. Use `abort()` and its variants (`abort_if()`, `abort_unless()`) in controllers rather than manual error responses to ensure all errors go through the content-negotiated handler.

## Validation Checklist

- [ ] Content negotiation is implemented per HTTP exception type
- [ ] API routes return JSON for all error types (404, 403, 422, 429, 500)
- [ ] Web routes return Blade error views for all error types
- [ ] Inertia routes return Inertia error components (if using Inertia)
- [ ] Catch-all `Throwable` handler exists for API routes
- [ ] 404s are logged with URL context for broken link detection
- [ ] Controllers use `abort()` / `abort_if()` / `abort_unless()` instead of manual error responses
- [ ] Implicit route model binding is preferred over manual `findOrFail()`

## Common Failures

1. **No content negotiation**: A single `renderable()` returns `response()->view()` for all requests, including API routes — clients receive HTML they can't parse.

2. **Missing Inertia handling**: Inertia requests fall through to Blade error pages — the SPA receives HTML instead of a JSON response with error props.

3. **Over-specific callbacks before catch-all**: Specific callbacks (e.g., `NotFoundHttpException`) handle the request but return `void` — the handler falls through to the catch-all, which returns a generic 500 instead of the correct 404.

4. **abort() not used**: Controllers return `response()->json()` or `response()->view()` directly, bypassing the handler and its content negotiation.

## Decision Points

- **Per-type callback vs single catch-all**: Use separate `renderable()` callbacks for each HTTP exception type when different types need different responses. Use a single catch-all for `Throwable` when all errors use the same envelope.
- **Route prefix vs Accept header**: Use `$request->is('api/*')` as primary check — it's independent of HTTP headers. Use `$request->expectsJson()` as fallback for non-API JSON requests.

## Performance Considerations

- Content negotiation adds ~0.001ms per check (string match + method call)
- Error pages are rare — performance is not a concern
- Keep callback count under 20–30 for negligible traversal cost

## Security Considerations

- Never expose stack traces in any response type (HTML, JSON, or Inertia)
- Error pages must not reveal internal file paths or class names
- Inertia error responses must follow same rules as JSON for sensitive data

## Related Rules

- Use abort() Instead of Returning Raw Error Responses from Controllers
- Use abort_if() and abort_unless() for Conditional HTTP Errors
- Never Include Stack Traces or Internal Details in Production Error Pages
- Handle Inertia Error Rendering in the Exception Handler, Not in Controllers
- Log 404s with the Requested URL for Broken Link Detection
- Use Explicit Route Model Binding Instead of Manual findOrFail() Where Possible

## Related Skills

- Implement Custom HTTP Error Pages (this file, above)
- Configure Global API Error Handler (api-exception-handling)
- Write Exception Handler Tests (exception-testing)

## Success Criteria

- Web routes receive Blade error pages for all HTTP errors
- API routes receive JSON error envelopes for all HTTP errors
- Inertia requests receive error components (if applicable)
- No request type receives the wrong error format
- Controllers consistently use `abort()` to trigger error responses
- 404s are logged with URL context for monitoring
