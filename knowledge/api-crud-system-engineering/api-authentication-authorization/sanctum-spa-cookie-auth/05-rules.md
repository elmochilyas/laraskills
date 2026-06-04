# Phase 5: Rules — Sanctum SPA Cookie Auth

> Generated from 04-standardized-knowledge.md

## Use Session Driver of cookie for SPA Auth
---
## Category
Framework Usage
---
## Rule
Always set `SESSION_DRIVER=cookie` in the environment file when using Sanctum SPA cookie authentication.
---
## Reason
Sanctum's `EnsureFrontendRequestsAreStateful` middleware reads session data from the encrypted cookie. File, database, and Redis session drivers are incompatible with Sanctum SPA mode.
---
## Bad Example
```php
// .env
SESSION_DRIVER=file
// Sanctum SPA auth does not work — session data not in cookie
```

---
## Good Example
```php
// .env
SESSION_DRIVER=cookie
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=none
```

---
## Exceptions
API-only applications that do not use SPA cookie auth — use Sanctum token auth instead.
---
## Consequences Of Violation
Sanctum SPA authentication silently fails; all requests appear unauthenticated.

---
## Always Set SESSION_SECURE_COOKIE=true in Production
---
## Category
Security
---
## Rule
Always enable `SESSION_SECURE_COOKIE=true` in production environments.
---
## Reason
Without the secure flag, session cookies are transmitted over HTTP, exposing the session ID to network interception. Sanctum SPA auth uses session cookies as the primary auth mechanism.
---
## Bad Example
```php
// .env (production)
SESSION_SECURE_COOKIE=false
// Session cookie sent over HTTP — vulnerable to interception
```

---
## Good Example
```php
// .env (production)
SESSION_SECURE_COOKIE=true
```

---
## Exceptions
Local development without HTTPS — but never disable in production.
---
## Consequences Of Violation
Session hijacking via network sniffing; account takeover on non-HTTPS connections.

---
## Configure SANCTUM_STATEFUL_DOMAINS Precisely
---
## Category
Reliability
---
## Rule
Always set `SANCTUM_STATEFUL_DOMAINS` to the exact domain of your SPA (without protocol) in `.env`.
---
## Reason
Sanctum compares the request's `Origin` or `Referer` header against `SANCTUM_STATEFUL_DOMAINS` to decide whether to use cookie auth. A mismatch causes Sanctum to fall back to token auth, returning 401.
---
## Bad Example
```php
// .env
SANCTUM_STATEFUL_DOMAINS=app.example.com
// Missing port for local development (localhost:5173)
```

---
## Good Example
```php
// .env (production)
SANCTUM_STATEFUL_DOMAINS=app.example.com

// .env (development)
SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

---
## Exceptions
No common exceptions. Incorrect configuration is the most common source of SPA auth failures.
---
## Consequences Of Violation
SPA requests appear unauthenticated; Sanctum falls back to token auth silently.

---
## Use withCredentials: true in Axios/Fetch Requests
---
## Category
Framework Usage
---
## Rule
Always set `withCredentials: true` on all Axios requests (or `credentials: 'include'` for fetch) when using Sanctum SPA auth.
---
## Reason
Cookies are not included in cross-origin requests by default. Without this setting, the session cookie is never sent with API requests, and the server sees every request as unauthenticated.
---
## Bad Example
```php
// Axios without withCredentials
axios.get('/api/user');
// Cookie not sent — returns 401
```

---
## Good Example
```php
// Axios with withCredentials
axios.get('/api/user', { withCredentials: true });

// Or set globally:
axios.defaults.withCredentials = true;
```

---
## Exceptions
Same-origin SPA and API (protocol + host + port match) — cookies are sent automatically.
---
## Consequences Of Violation
All API requests return 401; cookie never sent to the server.

---
## Send XSRF-TOKEN via X-XSRF-TOKEN Header, Not X-CSRF-TOKEN
---
## Category
Framework Usage
---
## Rule
Always use the `X-XSRF-TOKEN` header (not `X-CSRF-TOKEN`) for Sanctum SPA CSRF protection.
---
## Reason
Sanctum exposes the CSRF token via a cookie named `XSRF-TOKEN` (Angular-style convention). Laravel's VerifyCsrfToken middleware reads `X-XSRF-TOKEN` header (note the double "X"). Using `X-CSRF-TOKEN` requires separate configuration.
---
## Bad Example
```php
// Axios with wrong header name
axios.defaults.xsrfHeaderName = 'X-CSRF-TOKEN';
// Does not match Sanctum's expected X-XSRF-TOKEN
```

---
## Good Example
```php
// Axios — defaults already match Sanctum's convention
// xsrfCookieName: 'XSRF-TOKEN'
// xsrfHeaderName: 'X-XSRF-TOKEN'
```

---
## Exceptions
No common exceptions. Use Sanctum's default `X-XSRF-TOKEN` header.
---
## Consequences Of Violation
CSRF token mismatch on every mutating request; 419 errors on POST/PUT/DELETE.

---
## Handle 419 Errors with CSRF Refresh
---
## Category
Reliability
---
## Rule
Always handle 419 (CSRF token mismatch) responses by re-fetching the CSRF cookie and retrying the request.
---
## Reason
CSRF tokens expire (default 2 hours). Users with long-lived SPA sessions will hit expired tokens. Without automatic refresh, they see opaque errors and must manually refresh the page.
---
## Bad Example
```php
// No 419 handling — user sees error on token expiry
```

---
## Good Example
```php
axios.interceptors.response.use(
    response => response,
    async error => {
        if (error.response.status === 419) {
            await axios.get('/sanctum/csrf-cookie');
            error.config.headers['X-XSRF-TOKEN'] = Cookies.get('XSRF-TOKEN');
            return axios(error.config); // Retry original request
        }
        return Promise.reject(error);
    }
);
```

---
## Exceptions
No common exceptions. CSRF expiry is expected and must be handled gracefully.
---
## Consequences Of Violation
Users unable to complete mutations after CSRF token expires; confusing error messages.

---
## Never Store Sensitive Data in Session
---
## Category
Performance
---
## Rule
Always keep session data minimal. Never store large or sensitive data objects in the session when using cookie session driver.
---
## Reason
Cookie session driver stores all session data in an encrypted cookie. Proxies reject cookies larger than ~8KB. Large sessions cause request failures and increased bandwidth.
---
## Bad Example
```php
session(['large_data' => $bulkyObject]);
// Cookie grows beyond proxy limits
```

---
## Good Example
```php
// Store only identifiers in session
session(['user_preferences_version' => $prefVersion]);
// Large data on server side, not in cookie
```

---
## Exceptions
No common exceptions. Cookie session size is inherently limited.
---
## Consequences Of Violation
Request failures from oversized cookies; proxy rejection of large headers.

---
## Set SESSION_DOMAIN for Subdomain Sharing
---
## Category
Architecture
---
## Rule
Always configure `SESSION_DOMAIN` with a leading dot (`.example.com`) when the SPA and API are on different subdomains.
---
## Reason
Cookies are scoped to the exact subdomain by default. A leading dot tells the browser to share the cookie across all subdomains of the parent domain, enabling `app.example.com` SPA to authenticate with `api.example.com`.
---
## Bad Example
```php
// .env
SESSION_DOMAIN=api.example.com
// Cookie only sent to api.example.com, not app.example.com
```

---
## Good Example
```php
// .env
SESSION_DOMAIN=.example.com
// Cookie shared across all subdomains
```

---
## Exceptions
Same-origin SPA and API (identical subdomain) — no SESSION_DOMAIN override needed.
---
## Consequences Of Violation
SPA requests to API on different subdomain never include session cookie; authentication fails.

---
## Require HTTPS for Production SPA Auth
---
## Category
Security
---
## Rule
Always enforce HTTPS in production when using Sanctum SPA cookie authentication.
---
## Reason
Cookies are transmitted with every request. Without HTTPS, an attacker on the same network can intercept the session cookie and impersonate the user. SameSite=None cookies are particularly vulnerable as they are sent cross-origin.
---
## Bad Example
```php
// HTTP in production — session cookie sent in plain text
SESSION_SECURE_COOKIE=false
```

---
## Good Example
```php
// .env (production)
SESSION_SECURE_COOKIE=true
// And enforce HTTPS redirect
```

---
## Exceptions
Local development where HTTPS certificates are impractical.
---
## Consequences Of Violation
Session hijacking via network sniffing; account takeover.

---
## Make CSRF Cookie Route Publicly Accessible
---
## Category
Security
---
## Rule
Always ensure the `/sanctum/csrf-cookie` route is publicly accessible and does not require authentication.
---
## Reason
The CSRF cookie must be fetched before login — the user is not authenticated yet. If this route requires auth, the login flow is impossible.
---
## Bad Example
```php
Route::get('/sanctum/csrf-cookie', function () {
    // Route is behind auth middleware — CSRF fetch fails before login
})->middleware('auth:sanctum');
```

---
## Good Example
```php
// Sanctum registers this route automatically without auth middleware
// Do not add auth middleware to /sanctum/csrf-cookie
```

---
## Exceptions
No common exceptions. The CSRF cookie endpoint must always be unauthenticated.
---
## Consequences Of Violation
Login flow broken; users cannot authenticate because CSRF token is unobtainable.
