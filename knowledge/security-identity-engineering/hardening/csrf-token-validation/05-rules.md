# Rules: CSRF Token Validation

## Include @csrf in Every POST/PUT/PATCH/DELETE Blade Form
---
## Category
Security
---
## Rule
Add `@csrf` inside every HTML `<form>` that submits via POST, PUT, PATCH, or DELETE. Never omit it.
---
## Reason
Without `@csrf`, the form lacks a CSRF token. Laravel's `VerifyCsrfToken` middleware on POST routes validates this token. A missing token causes a 419 error. Automated submission by an external site would also lack the token, blocking CSRF attacks.
---
## Bad Example
```blade
<form method="POST" action="/posts">
    {{-- @csrf missing — 419 error or CSRF vulnerability --}}
</form>
```
---
## Good Example
```blade
<form method="POST" action="/posts">
    @csrf
</form>
```
---
## Exceptions
External webhook handlers (route excluded from CSRF protection via `except` array).
---
## Consequences Of Violation
419 errors, or CSRF vulnerability if middleware is disabled.
---

## Send X-XSRF-TOKEN Header for All SPA Stateful Requests
---
## Category
Architecture
---
## Rule
Include the `X-XSRF-TOKEN` header (the decrypted `XSRF-TOKEN` cookie) on all mutating requests from a SPA. Use Axios's `withCredentials: true` and `withXSRFToken` (Laravel Axios defaults handle this automatically).
---
## Reason
SPAs do not use `@csrf`. Instead, Sanctum provides an `XSRF-TOKEN` cookie at `/sanctum/csrf-cookie`. Axios automatically reads this cookie and sends it as the `X-XSRF-TOKEN` header. Laravel compares this header value against the session token to validate the request.
---
## Bad Example
```javascript
// No CSRF token sent — 419 on every POST
axios.post('/api/posts', data);
```
---
## Good Example
```javascript
// Axios with defaults — CSRF cookie read automatically
await axios.get('/sanctum/csrf-cookie'); // Get the CSRF cookie
axios.post('/api/posts', data); // Token sent automatically
```
---
## Exceptions
Token-based API (Sanctum tokens, Passport) — no CSRF protection needed.
---
## Consequences Of Violation
419 errors on SPA mutating requests.
---

## Use CSRF Token API for Inertia/Vue POST Requests
---
## Category
Architecture
---
## Rule
When using Inertia or a custom JS frontend, retrieve the CSRF token from a meta tag or the `csrf-token` meta tag and include it in the `X-CSRF-TOKEN` header.
---
## Reason
These frontends need an explicit CSRF token, not the Sanctum cookie mechanism. A `<meta name="csrf-token">` tag in the layout provides the token that client-side code can read and send as a header or in a POST body.
---
## Bad Example
```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```
Not read by client:
```javascript
// No CSRF header — 419 error on POST
```
---
## Good Example
```blade
<meta name="csrf-token" content="{{ csrf_token() }}">
```
```javascript
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').content;
```
---
## Exceptions
No common exceptions — CSRF token must be sent explicitly.
---
## Consequences Of Violation
419 errors, form submission failures.
---

## Exclude External Webhooks Only, Not Internal Routes
---
## Category
Security
---
## Rule
Add routes to the `$except` array in `VerifyCsrfToken` only for routes that cannot provide a CSRF token (external webhooks, payment callbacks). Never exclude internal application routes.
---
## Reason
The `$except` array disables CSRF protection for those routes. An attacker who discovers an excluded internal route can forge state-changing requests without needing to steal a CSRF token. Exclude only routes where CSRF is technically impossible.
---
## Bad Example
```php
class VerifyCsrfToken extends Middleware {
    protected $except = [
        'api/*', // Entire API excluded — unnecessary for token-based API
        'webhook/*', // External webhooks — valid
    ];
}
```
---
## Good Example
```php
class VerifyCsrfToken extends Middleware {
    protected $except = [
        'stripe/webhook', // External webhook — no CSRF possible
    ];
}
```
---
## Exceptions
No common exceptions — minimize the excluded routes.
---
## Consequences Of Violation
CSRF vulnerability on excluded internal routes.
---

## Verify CSRF Token Middleware Is Present in Kernel
---
## Category
Architecture
---
## Rule
Ensure `\App\Http\Middleware\VerifyCsrfToken::class` is listed in the `web` middleware group in `app/Http/Kernel.php`. Never remove it or move it to `api` group.
---
## Reason
The `web` middleware group includes CSRF protection by default. Removing it from the `web` group disables CSRF validation for all web routes. The `api` group does not include CSRF — this is intentional because token-based APIs use different auth.
---
## Bad Example
```php
// Remove VerifyCsrfToken from web group to "fix" 419 errors
protected $middlewareGroups = [
    'web' => [ // VerifyCsrfToken removed
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
    ],
];
```
---
## Good Example
```php
protected $middlewareGroups = [
    'web' => [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \App\Http\Middleware\VerifyCsrfToken::class, // CSRF present
    ],
];
```
---
## Exceptions
No common exceptions — CSRF middleware must be in the web group.
---
## Consequences Of Violation
CSRF vulnerability on all web routes.
---

## Use Token-Based Auth for Headless SPA/API Without CSRF
---
## Category
Architecture
---
## Rule
Route stateful SPA requests through the `web` middleware (with CSRF) and stateless API requests through the `api` middleware (no CSRF).
---
## Reason
Token-based auth does not require CSRF because tokens are not automatically sent by browsers (unlike session cookies). The `api` group intentionally omits CSRF middleware. Stateful SPA requests use session cookies and therefore require CSRF. Mixing the two patterns incorrectly causes security or compatibility issues.
---
## Bad Example
```php
// All routes in api group — no CSRF, but uses session cookies
Route::post('/posts', [PostController::class, 'store']); // CSRF needed but missing
```
---
## Good Example
```php
// SPA routes with session auth — CSRF protected
Route::post('/posts', [PostController::class, 'store'])->middleware('web');
// Token-based API routes — no CSRF needed
Route::get('/posts', [PostController::class, 'index'])->middleware('api');
```
---
## Exceptions
No common exceptions — route grouping determines CSRF requirement.
---
## Consequences Of Violation
Missing CSRF with session auth, or unnecessary CSRF with token auth.
