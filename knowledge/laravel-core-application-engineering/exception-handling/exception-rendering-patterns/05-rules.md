# Rules for Exception Rendering Patterns

---

## Rule: Use Blade Templates for Static Error Pages, Renderable for Dynamic

---

## Category

Code Organization

---

## Rule

Always use Blade error page templates (`resources/views/errors/{status}.blade.php`) for static branded error pages (404, 403, 500, 503). Use `renderable()` callbacks when dynamic response logic is needed (API vs HTML branching, user-specific content, Inertia).

---

## Reason

Blade templates auto-resolve by status code with zero handler configuration. Renderable callbacks are needed when the response must vary by request type, user, or exception context.

---

## Bad Example

```php
// Renderable for a static 404 page — unnecessary indirection
$exceptions->renderable(function (NotFoundHttpException $e) {
    return response()->view('errors.404', [], 404);
});
```

---

## Good Example

```php
// Blade template auto-resolves — no handler code needed
// resources/views/errors/404.blade.php exists

// Renderable only for dynamic responses
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->expectsJson()) {
        return response()->json(['error' => 'Not found'], 404);
    }
    // Non-API requests fall through to Blade template
});
```

---

## Exceptions

Applications that need custom response headers or caching directives on error pages.

---

## Consequences Of Violation

Renderable for static page: more handler code than necessary. Template for dynamic response: can't branch by request type.

---

## Rule: Always Register a Catch-All Renderable for Throwable

---

## Category

Reliability

---

## Rule

Always register a catch-all `renderable()` callback for `Throwable` as the last registered callback, ensuring every exception produces a valid response.

---

## Reason

Without a catch-all, unhandled exception types fall through to Laravel's default error page, which may render HTML for API requests or Inertia requests.

---

## Bad Example

```php
// Only specific exception types have renderable callbacks
// Unhandled exceptions fall through to default HTML
$exceptions->renderable(function (ValidationException $e) { ... });
$exceptions->renderable(function (ModelNotFoundException $e) { ... });
```

---

## Good Example

```php
// Specific types first, then catch-all
$exceptions->renderable(function (ValidationException $e, Request $request) { ... });
$exceptions->renderable(function (ModelNotFoundException $e, Request $request) { ... });
$exceptions->renderable(function (Throwable $e, Request $request) { ... }); // catch-all
```

---

## Exceptions

Applications with zero API routes and no custom exceptions.

---

## Consequences Of Violation

API clients receive unparseable HTML. Inertia apps show error pages outside the app shell.

---

## Rule: Register Specific Exceptions Before Generic Ones

---

## Category

Architecture

---

## Rule

Always register renderable callbacks from most-specific exception type to most-general. Register the catch-all `Throwable` renderable last.

---

## Reason

Renderable callbacks are evaluated in registration order. The first callback that returns a non-null response wins. If `Throwable` is registered first, all exceptions match it and more specific callbacks never execute.

---

## Bad Example

```php
// Throwable registered first — matches everything
$exceptions->renderable(function (Throwable $e) { return genericResponse(); });
$exceptions->renderable(function (ValidationException $e) { /* never executes */ });
```

---

## Good Example

```php
// Specific types first, catch-all last
$exceptions->renderable(function (ValidationException $e) { return validationResponse(); });
$exceptions->renderable(function (ModelNotFoundException $e) { return notFoundResponse(); });
$exceptions->renderable(function (Throwable $e) { return genericResponse(); });
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Specific exception rendering is silently ignored. Developers may think custom rendering is active when it never executes.

---

## Rule: Never Return Void from a Renderable Callback

---

## Category

Reliability

---

## Rule

Always return a response or `null` from a renderable callback. Never return `void` (no return statement).

---

## Reason

A renderable callback that returns `void` passes `null` to the handler, which falls through to the next callback or default. The developer may believe the callback handled the response when it didn't.

---

## Bad Example

```php
// Renderable with logging but no return — falls through
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('404', ['url' => $request->url()]);
    // No return — response falls through to default
});
```

---

## Good Example

```php
// Explicit null for early return, response for handling
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->expectsJson()) {
        return response()->json(['error' => 'Not found'], 404);
    }
    return response()->view('errors.404', [], 404);
});
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Handler falls through to default rendering. API requests may get HTML, Inertia requests may get Blade templates.
