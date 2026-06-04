# Anti-Patterns: HTTP Exception Rendering

## 1. The Inline Error Response

Returning raw error responses directly from controllers instead of using `abort()` or throwing HTTP exceptions.

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

Returning `response()->json(...)` or `response()->view(...)` directly from controllers bypasses the centralized handler and creates inconsistent error formats. Always use `abort()`, `abort_if()`, or `abort_unless()` which go through the centralized exception handler, ensuring consistent rendering across all request types:

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

## 2. The Unbranded Error Page

Shipping the default Laravel error pages in production with no branding, navigation, or helpful content.

```blade
{{-- Default Laravel 404 — unbranded, no navigation, poor UX --}}
@extends('errors::minimal')
@section('title', __('Not Found'))
@section('code', '404')
@section('message', __('Not Found'))
```

Default Laravel error pages are unbranded, contain no navigation, and provide a poor user experience. Custom error pages maintain brand consistency, help users recover (home link, search), and provide appropriate messaging. Create Blade error pages at minimum for 403, 404, 429, 500, and 503:

```blade
<x-layout>
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <a href="/">Go Home</a>
    <a href="/contact">Contact Support</a>
</x-layout>
```

## 3. The Missing JSON Handler

API routes that return HTML error pages because no JSON render callback is configured and `shouldRenderJsonWhen` is not set.

API clients receiving HTML error pages cannot parse them, causing client-side crashes. Always configure `shouldRenderJsonWhen` using both route prefix and Accept header checks. Implement content-negotiated `renderable()` callbacks that detect the request type (JSON, HTML, Inertia) and return the appropriate format.

## 4. The Cascading Error Page

An error page that includes database queries, API calls, or complex business logic, causing a cascading failure when the application is already in a failure state.

```blade
{{-- Error page with DB query — risk of cascading failure --}}
@php
    $popular = DB::table('posts')->orderBy('views')->limit(5)->get();
@endphp
```

If an error page itself throws an exception, users see a bare 500 response with no context. Error pages are rendered when the application is already in a failure state — adding complex logic increases the risk of cascading failures. Keep error views static with no database queries, API calls, or complex logic.

## 5. The Leaky Error Page

Rendering stack traces, file paths, or internal class names in production error pages.

```blade
{{-- Exposes internal file path --}}
<p>{{ $exception?->getMessage() }}</p>
<p>File: {{ $exception?->getFile() }}:{{ $exception?->getLine() }}</p>
```

Default error pages may expose `$exception` details if the view is not carefully written. Stack traces and file paths on production error pages give attackers insight into the application's internal structure. Never render `$exception->getTraceAsString()`, `$exception->getFile()`, or `$exception->getLine()` in a Blade error view.

## 6. The Mixed Error Bag

Using both `abort()` in controllers for some errors and manual `response()->json()` for others, creating inconsistent handling.

Some errors go through the centralized handler while others bypass it. This leads to inconsistent formats where API clients receive JSON for some 404s and HTML for others. Pick one approach — `abort()` through the handler — and use it consistently. The only exception is for domain errors detected in service layers, which should throw custom exceptions rather than using `abort()`.

## 7. The Blind 404

Neither logging 404s nor monitoring them for broken link detection.

```php
// 404s are not reported at all — no visibility into broken links
protected $dontReport = [
    NotFoundHttpException::class,
];
```

Frequent 404s on the same URL indicate a broken link that should be fixed. A sudden spike in 404s on unusual paths may indicate a security scan. Without logging, these signals are invisible. Log 404s with the requested URL at WARNING level:

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
