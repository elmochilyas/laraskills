# Anti-Patterns: Exception Rendering Patterns

## 1. The HTML Leak

API routes returning HTML error pages because no JSON render callback exists and `shouldRenderJsonWhen` is not configured.

```php
// No shouldRenderJsonWhen — API routes without Accept header get HTML
// No catch-all renderable — unhandled exceptions fall through to Blade
```

Always configure `shouldRenderJsonWhen` and register a catch-all renderable for `Throwable`.

## 2. The Void Renderable

A renderable callback that does work (logging, notification) but returns no response.

```php
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('404', ['url' => $request->url()]);
    // No return — handler falls through to default
});
```

The developer believes this callback handles the response, but it falls through to the default rendering. Always return a response or explicitly return null.

```php
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('404', ['url' => $request->url()]);
    return response()->view('errors.404', [], 404);
});
```

## 3. The Wrong Order

Registering the catch-all `Throwable` renderable before specific exception type renderables.

```php
$exceptions->renderable(function (Throwable $e) {
    return genericResponse();
});
$exceptions->renderable(function (ValidationException $e) {
    // Never executes — Throwable matches first
    return validationResponse();
});
```

Always register most-specific exception types first, catch-all last.

## 4. The Untested Error Page

Custom error pages that break silently because a layout change was not tested.

A layout refactor breaks the 404 page — users see a white screen. Always test at minimum the 404 and 500 error page views.

## 5. The Missing Inertia Handling

An Inertia application with no renderable callback for Inertia error rendering.

Inertia requests get a full page reload to a Blade error template instead of showing an error component within the application shell. Check the `X-Inertia` header in the renderable and render Inertia components.
