# Inertia + Laravel Integration

## Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** LivewireInertia
**Knowledge Unit:** InertiaLaravel
**Difficulty:** Intermediate
**Category:** Server Integration
**Last Updated:** 2026-06-04

## Overview

Inertia + Laravel Integration covers the server-side configuration and patterns for connecting Laravel applications to Inertia.js-powered frontends. While Inertia itself is framework-agnostic, the Laravel integration provides the bridge: middleware for handling Inertia requests, response serialization, shared data, asset versioning, and validation error handling.

This integration layer exists because Inertia fundamentally changes the Laravel request-response cycle. Instead of returning Blade views or JSON responses, controllers return Inertia responses that the frontend interprets as page transitions. The integration handles: converting validation exceptions to Inertia error responses, managing redirects for client-side navigation, sharing global data across pages, and ensuring asset version consistency.

Engineers should care because the Laravel-Inertia integration determines the developer experience of building Inertia applications. Proper configuration means seamless form validation, automatic CSRF protection, and intuitive redirect behavior. Misconfiguration results in broken navigation, missing flash messages, and confusing error handling.

## Core Concepts

**Inertia Middleware:** The `HandleInertiaRequests` middleware is the core of the integration. It intercepts Inertia requests, shares global data, and manages the Inertia version. It must be registered in the web middleware group.

**Response Serialization:** When a controller returns `Inertia::render()`, the integration serializes the page component name and props into a JSON response for Inertia XHR requests, or embeds them in the initial HTML document for full page loads.

**Validation Error Handling:** Validation exceptions thrown by Form Requests are automatically caught by the integration and converted to Inertia error responses. Errors are sent back to the frontend and automatically bound to form fields by Inertia's form helper.

**Redirect Handling:** Inertia intercepts redirect responses from the server. `redirect()->back()` and `redirect()->route()` work correctly with Inertia, but `redirect()->back()` should be avoided because it triggers a full page reload on the client side.

**Shared Data:** `Inertia::share()` provides data to every page component. It is typically called in the service provider or the `HandleInertiaRequests` middleware's `share()` method. Shared data callbacks are executed per-request.

**Asset Versioning:** `Inertia::version()` returns the current asset version hash. When the version changes (after a deployment), Inertia forces a full page reload to ensure clients get the latest frontend assets.

## When To Use

- Every Laravel application rendered with Inertia.js
- Projects that need global shared data (auth, flash, locale)
- Applications requiring proper Inertia redirect and validation error handling
- Teams deploying Inertia applications with asset versioning requirements

## When NOT To Use

- Non-Inertia Laravel applications (Blade, Livewire, API-only)
- Applications that handle Inertia requests entirely on the frontend without Laravel integration

## Best Practices

**Register HandleInertiaRequests Middleware:** Add the middleware to the `web` middleware group in `bootstrap/app.php` or `Kernel.php`. Without it, Inertia requests fail.

**Use the `share()` Method in Middleware:** Override the `share()` method in `HandleInertiaRequests` for global data. This centralizes shared data and keeps service providers clean.

**Use Named Route Redirects:** Always redirect to named routes: `redirect()->route('posts.index')`. Avoid `redirect()->back()` which causes full page reloads.

**Configure Asset Versioning in Middleware:** Implement `Inertia::version()`) in the middleware to return the application's build hash or file modification timestamp.

**Pass Minimal Data:** Transform Eloquent models before passing as props. Use API resources, DTOs, or manual field selection. Each kilobyte adds to every page navigation.

**Use FormRequest for Validation:** Validation errors are automatically returned to Inertia. Never handle validation manually — let Form Requests manage errors and the integration will forward them correctly.

## Architecture Guidelines

**Controller Responsibility:** Controllers validate input via Form Requests, delegate to services, and return Inertia responses or redirects. Controllers remain thin.

**Shared Data Scope:** Keep shared data minimal. Authenticated user data, flash messages, locale, and feature flags. Avoid passing page-specific data as shared data.

**Middleware Ordering:** `HandleInertiaRequests` should run after authentication middleware (to have access to the authenticated user) and after StartSession (to have session access).

**Testing Inertia Responses:** Use `$response->assertInertia()` to verify the rendered component and props. Use `$response->assertInertiaHas()` for specific prop assertions.

## Performance Considerations

- Shared data callbacks execute on every request — ensure they are efficient and do not trigger expensive queries
- Inertia responses are serialized to JSON — minimize prop data to reduce serialization time and payload size
- Asset versioning check adds negligible overhead — the version is cached
- Validation errors are serialized and sent with every failed submission — error payload size is proportional to the number of fields with errors

## Security Considerations

- Inertia uses Laravel's CSRF protection — no additional token handling needed
- Validation errors may expose schema details — ensure error messages don't leak internal structure
- Shared data callbacks execute per-request with full authentication context — ensure user-specific data is correctly scoped
- Never pass sensitive data (passwords, tokens, secrets) in Inertia props — they are serialized in the HTML
- File upload validation in Form Requests prevents resource exhaustion attacks

## Common Mistakes

**Not Registering HandleInertiaRequests:** Omitting the middleware registration. Inertia requests fail with 500 errors.

**Why developers make it:** The middleware is created by `php artisan inertia:middleware` but must be registered manually.

**Consequences:** Inertia cannot handle XHR requests. Pages load but navigation and form submissions break.

**Better approach:** Register `HandleInertiaRequests` in the web middleware group immediately after installation.

**Using redirect()->back():** Returning `redirect()->back()` in Inertia controllers. This causes a full page reload, losing client-side state.

**Why developers make it:** Developers carry forward Blade-era redirect patterns.

**Consequences:** Flash messages disappear. Modals close. Scroll positions reset. The SPA feel is broken.

**Better approach:** Redirect to named routes: `redirect()->route('posts.index')`.

**Passing Too Much Data:** Passing full Eloquent models with all relationships as Inertia props.

**Why developers make it:** Convenience — the model is already loaded. Passing it directly is faster than transforming.

**Consequences:** Large initial payload. Slow page loads. Accidental exposure of sensitive database fields.

**Better approach:** Transform models before passing as props. Use API resources or select only needed fields.

**Client-Side Only Validation:** Relying on frontend validation without server-side Form Requests.

**Why developers make it:** Frontend validation provides instant feedback. Server-side validation seems redundant.

**Consequences:** Client-side validation is trivially bypassed. Invalid data reaches the server.

**Better approach:** Always validate server-side with Form Requests. Frontend validation is UX-only.

**Handling Auth Tokens Manually:** Managing bearer tokens, CSRF tokens, or session cookies manually in Inertia requests.

**Why developers make it:** Developers coming from API-first architectures assume token-based auth is needed.

**Consequences:** Unnecessary complexity. Inertia handles session auth automatically.

**Better approach:** Use Inertia's built-in cookie-based session authentication. No token management needed.

## Anti-Patterns

**redirect()->back() Abuse:** Using `redirect()->back()` as the default response pattern. Inertia SPA behavior depends on named route redirects. Back redirects cause full page reloads.

**Full Model Props:** Passing `Post::with(['comments', 'tags', 'author'])->get()` directly as props. Transform models to minimal data arrays.

**Server-Side UI State:** Storing UI state (active tab, search terms, filters) in Laravel session for Inertia pages. Inertia manages UI state on the client.

**Mixed Rendering:** Some pages use Inertia, others use Blade, in the same navigation flow. Hard page reloads break the SPA consistency.

**Unvalidated File Uploads:** Accepting file uploads without server-side validation in Form Requests. Validate mime types and file sizes server-side.

## Examples

### HandleInertiaRequests Middleware
```php
class HandleInertiaRequests extends Middleware
{
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                ] : null,
            ],
            'flash' => [
                'message' => session('message'),
                'type' => session('type', 'info'),
            ],
            'app' => [
                'name' => config('app.name'),
                'locale' => app()->getLocale(),
            ],
        ];
    }

    public function version(Request $request): ?string
    {
        return parent::version($request) ?? md5_file(public_path('build/manifest.json'));
    }
}
```

### Controller with Inertia Response
```php
class PostsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Posts/Index', [
            'posts' => PostResource::collection(
                Post::withCount('comments')->latest()->paginate(20)
            ),
            'filters' => request()->only(['search', 'status']),
        ]);
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        Post::create($request->validated());

        return redirect()->route('posts.index')
            ->with('message', 'Post created successfully.');
    }
}
```

## Related Topics

**Prerequisites:**
- Inertia.js Frontend Architecture
- Laravel Middleware System
- Laravel Form Request Validation

**Closely Related:**
- Inertia.js Page Components
- Shared Data Pattern
- Inertia Asset Versioning

**Advanced Follow-Up:**
- Inertia SSR Configuration
- Custom Inertia Responses
- Testing Inertia Applications

**Cross-Domain Connections:**
- API Resources for Prop Transformation
- Form Request Validation
- Session-Based Authentication
