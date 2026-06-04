# Skill: Configure Exception Rendering

## Purpose

Set up the exception rendering pipeline with appropriate renderable callbacks, error page templates, and content negotiation for HTML, JSON, and Inertia responses.

## When To Use

- During initial application setup
- When adding API routes to a web application
- When migrating to Inertia
- When adding custom exception types that need specific rendering

## Prerequisites

- Exception handler is configured
- Understanding of the application's request types (web, API, Inertia)
- List of custom exception types

## Workflow

1. Create Blade error page templates for standard HTTP statuses:
   - `resources/views/errors/403.blade.php`
   - `resources/views/errors/404.blade.php`
   - `resources/views/errors/429.blade.php`
   - `resources/views/errors/500.blade.php`
   - `resources/views/errors/503.blade.php`

2. Configure `shouldRenderJsonWhen` for API route detection.

3. Register renderable callbacks from most-specific to most-general:
   ```php
   $exceptions->renderable(function (ValidationException $e, Request $request) { ... });
   $exceptions->renderable(function (ModelNotFoundException $e, Request $request) { ... });
   $exceptions->renderable(function (Throwable $e, Request $request) { ... }); // catch-all last
   ```

4. For Inertia applications, add Inertia-specific error rendering:
   ```php
   $exceptions->renderable(function (HttpException $e, Request $request) {
       if ($request->header('X-Inertia')) {
           return Inertia::render('Error', ['status' => $e->getStatusCode()]);
       }
   });
   ```

5. For API-only applications, always return JSON:
   ```php
   $exceptions->renderable(function (Throwable $e, Request $request) {
       return response()->json(['error' => 'Server error.'], 500);
   });
   ```

6. Test each renderable callback for each request type (HTML, JSON, Inertia).

## Validation Checklist

- [ ] Blade error page templates exist for 403, 404, 429, 500, 503
- [ ] `shouldRenderJsonWhen` is configured for API routes
- [ ] Renderable callbacks are ordered most-specific to most-general
- [ ] Catch-all renderable for `Throwable` is registered last
- [ ] Inertia error rendering is configured (if applicable)
- [ ] No renderable callback returns void without a response
- [ ] Rendering is tested for HTML, JSON, and Inertia request types

## Common Failures

1. Catch-all `Throwable` registered first — specific callbacks never execute.
2. No catch-all — unhandled exceptions fall through to default HTML.
3. Renderable returns void — handler falls through to next callback or default.
4. Missing `shouldRenderJsonWhen` — API routes without Accept header get HTML.
5. No Inertia handling — Inertia requests get full page reload on errors.

---

# Skill: Implement Custom Exception Render Method

## Purpose

Implement the `render()` method on custom exception classes for self-contained response generation without handler registration.

## When To Use

- When an exception has a consistent rendering that doesn't depend on request data
- When the exception is thrown from a package or reusable code
- When reducing handler registration overhead for simple exceptions

## Workflow

1. Add `render()` method to the exception class:
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

2. Do NOT use `render()` when injected dependencies or request data are needed.

3. Document that the exception has a render method — developers modifying the exception should know it affects HTTP responses.

## Validation Checklist

- [ ] `render()` method returns a response instance
- [ ] No injected dependencies are used in `render()`
- [ ] Exception is testable without HTTP context

## Common Failures

1. `render()` with dependencies — exception breaks in non-HTTP contexts.
2. No type hint on `render()` parameter — IDE and static analysis can't verify correctness.
