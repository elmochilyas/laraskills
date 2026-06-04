# Rules: Sanctum SPA Cookie Auth vs Token Auth

## Use SPA Cookie Auth for Same-Domain Browser Apps
---
## Category
Security
---
## Rule
Authenticate same-domain or subdomain SPAs using Sanctum's cookie-based session auth. Reserve Bearer token auth for mobile apps, third-party clients, and cross-domain scenarios.
---
## Reason
Cookie auth uses `httpOnly` session cookies that are inaccessible to JavaScript, providing XSS resistance. Bearer tokens stored in `localStorage` or `sessionStorage` are accessible to any JS on the page. For browser apps on your domain, cookie auth is strictly more secure.
---
## Bad Example
```javascript
// Token auth stored in localStorage — XSS-vulnerable
localStorage.setItem('api_token', token);
// Every request: Authorization: Bearer <token>
```
---
## Good Example
```javascript
// SPA cookie auth — httpOnly cookie, not accessible to JS
await axios.get('/sanctum/csrf-cookie');
await axios.post('/login', { email, password });
// Session cookie set automatically by browser
```
---
## Exceptions
Cross-domain SPAs where cookie auth is not feasible due to browser same-origin policy.
---
## Consequences Of Violation
XSS vulnerability exposing tokens, session theft.
---

## Configure SANCTUM_STATEFUL_DOMAINS for SPA Cookie Auth
---
## Category
Architecture
---
## Rule
Set the `SANCTUM_STATEFUL_DOMAINS` environment variable to include all domains and subdomains from which the SPA makes requests.
---
## Reason
Sanctum uses this configuration to determine which origins should receive authenticated sessions via cookies. Without this setting, Sanctum treats the SPA as an external origin and does not set session cookies, causing all SPA auth requests to return 401 unauthenticated.
---
## Bad Example
```dotenv
# SANCTUM_STATEFUL_DOMAINS not set — SPA always returns 401
```
---
## Good Example
```dotenv
SANCTUM_STATEFUL_DOMAINS=app.example.com
SESSION_DOMAIN=.example.com
```
---
## Exceptions
Token-only applications that do not use SPA cookie auth.
---
## Consequences Of Violation
SPA returns 401 on every request, unauthenticated responses.
---

## Always Call /sanctum/csrf-cookie Before SPA Login
---
## Category
Framework Usage
---
## Rule
The SPA must call `GET /sanctum/csrf-cookie` before sending the login POST request to establish CSRF protection.
---
## Reason
Sanctum's SPA auth relies on CSRF token exchange. The `/sanctum/csrf-cookie` endpoint sets an `XSRF-TOKEN` cookie. Laravel's `VerifyCsrfToken` middleware checks this header. Without this initial call, state-changing requests (POST, PUT, DELETE) fail with 419 CSRF mismatch errors.
---
## Bad Example
```javascript
// Login without CSRF cookie — fails with 419
await axios.post('/login', { email, password });
```
---
## Good Example
```javascript
// Step 1: Get CSRF cookie
await axios.get('/sanctum/csrf-cookie');
// Step 2: Login — Axios auto-sends XSRF-TOKEN header
await axios.post('/login', { email, password });
```
---
## Exceptions
No common exceptions — this is required for all Sanctum SPA auth.
---
## Consequences Of Violation
419 errors on all login attempts, CSRF token mismatch.
---

## Use Production-Ready Session Driver for SPA Auth
---
## Category
Performance
---
## Rule
Configure the session driver to `redis`, `memcached`, or `database` in production. Never use the `file` driver with SPA cookie auth on multi-server deployments.
---
## Reason
SPA cookie auth relies on Laravel sessions. The `file` driver stores sessions on the local filesystem, which is not shared across servers in load-balanced environments. Requests to different servers lose session state, causing random 401 errors and login failures.
---
## Bad Example
```php
// config/session.php
'driver' => 'file', // Not shared across servers — SPA auth breaks
```
---
## Good Example
```php
'driver' => env('SESSION_DRIVER', 'redis'), // Shared across all servers
```
---
## Exceptions
Single-server production deployments where file sessions are acceptable.
---
## Consequences Of Violation
Intermittent 401 errors, session loss, forced re-login.
---

## Store Bearer Tokens Securely, Not in localStorage
---
## Category
Security
---
## Rule
When using token-based auth (mobile, third-party), store the Bearer token in secure device storage (iOS Keychain, Android EncryptedSharedPreferences). Never store in `localStorage` or `sessionStorage` for browser apps.
---
## Reason
`localStorage` and `sessionStorage` are accessible to any JavaScript executing on the same origin. An XSS vulnerability can read stored tokens, granting the attacker full API access. Secure device storage keeps tokens isolated from the JS runtime.
---
## Bad Example
```javascript
// Token stored in localStorage — XSS-accessible
localStorage.setItem('api_token', token);
```
---
## Good Example
```javascript
// For mobile: use secure device storage
// For browser: use httpOnly cookie auth (SPA mode) instead
// For third-party: let the client handle secure storage
```
---
## Exceptions
No common exceptions — localStorage is never secure for tokens.
---
## Consequences Of Violation
XSS vulnerability exposes all user tokens, complete account takeover.
---

## Enable CORS With Credentials for SPA Subdomain Auth
---
## Category
Architecture
---
## Rule
When the SPA is on a subdomain, configure CORS with `supports_credentials: true` and specific `allowed_origins`. Never use `allowed_origins: ['*']` with credentials.
---
## Reason
SPA cookie auth sends session cookies cross-origin. The browser requires `Access-Control-Allow-Credentials: true` and a specific origin (not `*`) for credentialed requests. Missing either causes the browser to block the response.
---
## Bad Example
```php
'allowed_origins' => ['*'],
'supports_credentials' => true, // Invalid — browser requires specific origins
```
---
## Good Example
```php
'allowed_origins' => [env('APP_FRONTEND_URL', 'https://app.example.com')],
'supports_credentials' => true,
```
---
## Exceptions
Same-origin SPA (API and frontend on same domain) — no CORS needed.
---
## Consequences Of Violation
Browser blocks credentialed responses, SPA auth fails silently.
---

## Regenerate Session ID After Login for SPA Auth
---
## Category
Security
---
## Rule
Ensure `session()->regenerate()` is called after successful authentication in SPA mode to prevent session fixation.
---
## Reason
Session fixation attacks force a user to use a known session ID. After login, the session ID must be regenerated so the attacker's known session ID becomes invalid. Sanctum and Fortify handle this automatically in standard flows, but custom auth implementations must call it explicitly.
---
## Bad Example
```php
// Custom login without session regeneration
if (Auth::attempt($credentials)) {
    return redirect()->intended('dashboard'); // Session ID unchanged
}
```
---
## Good Example
```php
if (Auth::attempt($credentials)) {
    $request->session()->regenerate();
    return redirect()->intended('dashboard');
}
```
---
## Exceptions
No common exceptions — session regeneration is mandatory after login.
---
## Consequences Of Violation
Session fixation vulnerability, attacker can hijack session.
