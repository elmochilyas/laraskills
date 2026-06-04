# Rules for HTTP Exceptions

---

## Rule: Use abort() Instead of Returning Raw Error Responses from Controllers

---

## Category

Framework Usage

---

## Rule

Always use `abort()`, `abort_if()`, or `abort_unless()` to trigger HTTP errors. Never return raw error responses (`response()->json(...)` or `response()->view(...)`) directly from controllers.

---

## Reason

`abort()` goes through the centralized exception handler, ensuring consistent rendering across all request types (HTML, JSON, Inertia). Raw responses bypass the handler and create inconsistent error formats.

---

## Bad Example

```php
class PostController
{
    public function show($id)
    {
        $post = Post::find($id);
        if (!$post) {
            return response()->json(['error' => 'Post not found'], 404);
        }
    }
}
```

---

## Good Example

```php
class PostController
{
    public function show($id)
    {
        abort_unless($post = Post::find($id), 404, 'Post not found.');
        return $post;
    }
}
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: inconsistent error formats across controllers. Reliability risks: API clients receive different response shapes for the same error from different endpoints.

---

## Rule: Use abort_if() and abort_unless() for Conditional HTTP Errors

---

## Category

Code Organization

---

## Rule

Always use `abort_if($condition, $code, $message)` and `abort_unless($condition, $code, $message)` for conditional HTTP errors instead of manual `if` blocks with `throw`.

---

## Reason

`abort_if()` and `abort_unless()` are concise, readable, and self-documenting. Manual `if/throw` blocks add unnecessary nesting and visual noise to controller logic.

---

## Bad Example

```php
public function update($id, Request $request)
{
    $post = Post::findOrFail($id);
    if (!$post->isPublished()) {
        throw new NotFoundHttpException('Post not available.');
    }
    if (!$request->user()->can('update', $post)) {
        throw new AccessDeniedHttpException('Access denied.');
    }
}
```

---

## Good Example

```php
public function update($id, Request $request)
{
    $post = Post::findOrFail($id);
    abort_if(!$post->isPublished(), 404, 'Post not available.');
    abort_unless($request->user()->can('update', $post), 403, 'Access denied.');
}
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: more boilerplate and nesting in controllers. Readability: intent is less clear compared to descriptive helper names.

---

## Rule: Customize Error Pages for at Minimum 403, 404, 429, 500, and 503

---

## Category

User Experience

---

## Rule

Always create Blade error pages at `resources/views/errors/{403,404,429,500,503}.blade.php` with branding, navigation, and helpful content. Never ship the default Laravel error pages in production.

---

## Reason

Default Laravel error pages are unbranded, contain no navigation, and provide a poor user experience. Custom error pages maintain brand consistency, help users recover (home link, search), and provide appropriate messaging.

---

## Bad Example

```blade
{{-- Default Laravel 404 — unbranded, no navigation, poor UX --}}
@extends('errors::minimal')
@section('title', __('Not Found'))
@section('code', '404')
@section('message', __('Not Found'))
```

---

## Good Example

```blade
{{-- resources/views/errors/404.blade.php --}}
<x-layout>
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <a href="/">Go Home</a>
    <a href="/contact">Contact Support</a>
</x-layout>
```

---

## Exceptions

API-only applications that never serve HTML error pages may skip Blade customization.

---

## Consequences Of Violation

User experience: users see unbranded, confusing error pages. Brand perception: lack of care for error states reflects poorly on the application.

---

## Rule: Never Include Stack Traces or Internal Details in Production Error Pages

---

## Category

Security

---

## Rule

Always ensure production error pages do not display stack traces, file paths, or internal class names. Never render `$exception->getTraceAsString()` or `$exception->getFile()` in a Blade error view.

---

## Reason

Default error pages may expose `$exception` details if the view is not carefully written. Stack traces and file paths on production error pages give attackers insight into the application's internal structure.

---

## Bad Example

```blade
{{-- Exposes internal file path --}}
<p>{{ $exception?->getMessage() }}</p>
<p>File: {{ $exception?->getFile() }}:{{ $exception?->getLine() }}</p>
```

---

## Good Example

```blade
{{-- Only displays safe content --}}
<p>{{ $exception?->getMessage() ?: 'The page you requested could not be found.' }}</p>
<a href="/">Go Home</a>
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Security risks: attackers learn internal paths and class names. Compliance risks: information disclosure vulnerabilities.

---

## Rule: Handle Inertia Error Rendering in the Exception Handler, Not in Controllers

---

## Category

Architecture

---

## Rule

Always handle Inertia error responses (error components) through the exception handler's `renderable()` callbacks. Never return Inertia error responses directly from controllers or from Blade error page fallbacks.

---

## Reason

The exception handler is the single source of truth for error rendering. Controllers should throw exceptions and let the handler negotiate between Inertia, JSON, and HTML responses.

---

## Bad Example

```php
// Controller handles Inertia error — inconsistent with other HTTP errors
class UserController
{
    public function show($id)
    {
        $user = User::find($id);
        if (!$user) {
            return Inertia::render('Errors/NotFound', ['status' => 404])->toResponse(request());
        }
    }
}
```

---

## Good Example

```php
// Handler manages Inertia rendering
$exceptions->renderable(function (NotFoundHttpException $e, Request $request) {
    if ($request->inertia()) {
        return Inertia::render('Errors/NotFound', [
            'status' => 404,
        ])->toResponse($request);
    }
    if ($request->expectsJson()) {
        return response()->json(['error' => 'Resource not found.'], 404);
    }
    return response()->view('errors.404', ['exception' => $e], 404);
});
```

---

## Exceptions

Applications not using Inertia can skip this rule.

---

## Consequences Of Violation

Maintenance risks: error rendering logic is duplicated across controllers. Reliability risks: Inertia requests may receive Blade HTML instead of Inertia components.

---

## Rule: Log 404s with the Requested URL for Broken Link Detection

---

## Category

Maintainability

---

## Rule

Always log 404 exceptions with the requested URL to detect broken links, user navigation issues, or malicious scanning. Never ignore 404 logging entirely.

---

## Reason

404s are a valuable signal. Frequent 404s on the same URL indicate a broken link that should be fixed. A sudden spike in 404s on unusual paths may indicate a security scan. Without logging, these signals are invisible.

---

## Bad Example

```php
// 404s are not reported at all — no visibility into broken links
protected $dontReport = [
    NotFoundHttpException::class,
];
```

---

## Good Example

```php
// 404s logged as WARNING with URL context
$exceptions->reportable(function (NotFoundHttpException $e, Request $request) {
    Log::warning('Route not found', [
        'url' => $request->fullUrl(),
        'method' => $request->method(),
        'referer' => $request->header('referer'),
        'user_agent' => $request->userAgent(),
    ]);
});
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: broken links go undetected. Security risks: scanning activity goes unnoticed.

---

## Rule: Use Explicit Route Model Binding Instead of Manual findOrFail() Where Possible

---

## Category

Code Organization

---

## Rule

Always use Laravel's implicit route model binding for resource lookups. Manually calling `findOrFail()` in controllers should be reserved for non-standard lookups.

---

## Reason

Implicit binding automatically throws `ModelNotFoundException`, reducing boilerplate and ensuring consistent 404 behavior for all resource endpoints. Manual `findOrFail()` in every method duplicates intent.

---

## Bad Example

```php
// Manual findOrFail() in every method — repeated boilerplate
Route::get('/users/{id}', function ($id) {
    $user = User::findOrFail($id);
    return $user;
});
```

---

## Good Example

```php
// Implicit binding — automatic 404
Route::get('/users/{user}', function (User $user) {
    return $user;
});
```

---

## Exceptions

Non-standard lookups (soft-deleted records, composite keys, UUID-to-ID mapping) may require manual `findOrFail()`.

---

## Consequences Of Violation

Maintenance risks: boilerplate code in every controller method. Reliability risks: inconsistent 404 behavior when some controllers use binding and others use manual lookups.

---

## Rule: Keep Error Page Views Simple and Free of Complex Logic

---

## Category

Reliability

---

## Rule

Never include database queries, API calls, or complex business logic in error page Blade templates. Keep error views as static as possible with minimal dependencies.

---

## Reason

If an error page itself throws an exception, users see a bare 500 response with no context. Error pages are rendered when the application is already in a failure state — adding complex logic increases the risk of cascading failures.

---

## Bad Example

```blade
{{-- Error page with DB query — risk of cascading failure --}}
@php
    $popular = DB::table('posts')->orderBy('views')->limit(5)->get();
@endphp

<h1>Page Not Found</h1>
@foreach ($popular as $post)
    <a href="/posts/{{ $post->id }}">{{ $post->title }}</a>
@endforeach
```

---

## Good Example

```blade
{{-- Static error page with no dependencies --}}
<x-layout>
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go Home</a>
</x-layout>
```

---

## Exceptions

No common exceptions. Error pages must be reliable above all else.

---

## Consequences Of Violation

Reliability risks: error pages themselves fail, producing bare 500 responses. User experience: users see no recovery path when error pages break.
