# Rules: CORS Configuration

## Restrict allowed_origins to Specific Domains in Production
---
## Category
Security
---
## Rule
Replace `*` in `allowed_origins` with explicit, known domains in production. Never use `*` when `supports_credentials` is `true`.
---
## Reason
`allowed_origins: ['*']` allows any website to make browser-based requests to your API. This is acceptable for truly public APIs but dangerous for authenticated endpoints. The browser blocks `*` with credentials — `supports_credentials: true` requires specific origins.
---
## Bad Example
```php
'allowed_origins' => ['*'],
'supports_credentials' => true, // Browser rejects this combination
```
---
## Good Example
```php
'allowed_origins' => [env('APP_FRONTEND_URL', 'https://app.example.com')],
'supports_credentials' => true,
```
---
## Exceptions
Truly public read-only APIs that require no authentication and no credentials.
---
## Consequences Of Violation
CORS errors with credentials, or arbitrary origin access to API.
---

## Never Reflect the Origin Header Back as Allowed
---
## Category
Security
---
## Rule
Never dynamically set `allowed_origins` to the value of the incoming `Origin` header. This allows any attacker's website to make authenticated requests.
---
## Reason
Reflecting the `Origin` header bypasses CORS protection entirely. An attacker can set `Origin: https://evil.com` and the server echoes it back as allowed. The browser then permits the cross-origin response, breaking CORS's security model.
---
## Bad Example
```php
'allowed_origins' => [request()->header('Origin')], // Dynamic reflection — dangerous
```
---
## Good Example
```php
'allowed_origins' => [env('APP_FRONTEND_URL')], // Static, explicit list
```
---
## Exceptions
No common exceptions — origin reflection is always a vulnerability.
---
## Consequences Of Violation
CORS protection bypassed, arbitrary sites can access API.
---

## Restrict allowed_methods to What the Application Actually Uses
---
## Category
Security
---
## Rule
Limit `allowed_methods` to the HTTP methods the application's endpoints actually need. Remove unused methods like `DELETE` from read-only APIs.
---
## Reason
Overly permissive allowed methods increase the attack surface. A read-only API that allows `DELETE` enables unauthorized deletion through CORS. Restricting methods to actual needs reduces risk without impacting functionality.
---
## Bad Example
```php
'allowed_methods' => ['*'], // All methods allowed
```
---
## Good Example
```php
// Read-only API
'allowed_methods' => ['GET', 'HEAD'],
```
---
## Exceptions
APIs with evolving endpoints that may need new methods — review periodically.
---
## Consequences Of Violation
Unnecessary methods exposed, increased attack surface.
---

## Configure Sanctum Stateful Domains for SPA Cookie Auth
---
## Category
Architecture
---
## Rule
When using Sanctum's SPA cookie auth, set both `SANCTUM_STATEFUL_DOMAINS` in `.env` and `supports_credentials: true` in CORS config.
---
## Reason
Sanctum uses `stateful` domains to decide which origins should receive authenticated sessions. Without this, the SPA origin is treated as external and session cookies are not set. Both CORS credentials and Sanctum stateful domains must be configured for SPA auth to work.
---
## Bad Example
```dotenv
# SANCTUM_STATEFUL_DOMAINS not configured — SPA gets 401
```
---
## Good Example
```dotenv
SANCTUM_STATEFUL_DOMAINS=app.example.com
```
```php
'supports_credentials' => true,
'allowed_origins' => [env('APP_FRONTEND_URL')],
```
---
## Exceptions
Token-only APIs not using SPA cookie auth.
---
## Consequences Of Violation
SPA returns 401 on every request, unauthenticated responses.
---

## Set Access-Control-Max-Age to Cache Preflight Responses
---
## Category
Performance
---
## Rule
Set `max_age` to at least 86400 (24 hours) to cache browser preflight (OPTIONS) responses and reduce repeated OPTIONS requests.
---
## Reason
Without preflight caching, the browser sends an OPTIONS request before every distinct cross-origin request. This doubles the request count for API calls. Caching the preflight response for 24 hours eliminates these redundant requests.
---
## Bad Example
```php
'max_age' => 0, // No caching — OPTIONS sent on every request
```
---
## Good Example
```php
'max_age' => 86400, // Cache preflight for 24 hours
```
---
## Exceptions
Development environments where CORS config changes frequently.
---
## Consequences Of Violation
Double request count for cross-origin API calls, slower performance.
---

## Exclude CORS Middleware From Routes That Don't Need It
---
## Category
Performance
---
## Rule
Configure the CORS middleware `paths` array to include only routes that are accessed from cross-origin clients. Avoid applying CORS to internal-only routes.
---
## Reason
CORS headers add response size and processing overhead for non-browser clients (CLI commands, queue workers, internal services). These clients do not enforce CORS. Applying CORS only where needed reduces unnecessary header processing.
---
## Bad Example
```php
'paths' => ['*'], // CORS applied to all routes including internal
```
---
## Good Example
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'], // Only cross-origin routes
```
---
## Exceptions
No common exceptions — CORS should be scoped to cross-origin endpoints.
---
## Consequences Of Violation
Unnecessary header processing on internal routes.
