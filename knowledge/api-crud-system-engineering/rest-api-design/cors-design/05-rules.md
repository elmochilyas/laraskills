# CORS Design

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: cors-design
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Use Specific Origins In Production
---
## Category
Security
---
## Rule
Always specify exact origins in `config/cors.php` `allowed_origins` for production — never use wildcard `*` in production CORS configuration.
---
## Reason
Wildcard origins (`*`) allow any website to make browser-based requests to your API. While CORS is not an authentication mechanism, open CORS expands the attack surface for CSRF-like attacks against authenticated users. Specific origins limit browser-based access to known frontends.
---
## Bad Example
```php
'allowed_origins' => ['*'], // permits any website
```

## Good Example
```php
'allowed_origins' => [
    'https://app.example.com',
    'https://admin.example.com',
],
```

## Exceptions
Truly public APIs with no authentication where any website should be able to access the data. Even then, wildcard CORS is rarely required — document why specific origins aren't feasible.

## Consequences Of Violation
Any website can make authenticated browser requests (if credentials are present); increased phishing and data exfiltration risk; compliance audit failures.
---

## Never Pair Wildcard Origins With Credentials
---
## Category
Security
---
## Rule
Never use `Access-Control-Allow-Origin: *` with `supports_credentials: true` — browsers reject this combination and block the request.
---
## Reason
The HTTP specification explicitly forbids wildcard origins when credentials are enabled. The browser will reject the CORS response entirely, breaking all credentialed requests. This configuration always results from development settings accidentally deployed to production.
---
## Bad Example
```php
'allowed_origins' => ['*'],
'supports_credentials' => true, // browser rejects this combination
```

## Good Example
```php
'allowed_origins' => ['https://app.example.com'],
'supports_credentials' => true, // works with explicit origin
```

## Exceptions
No exceptions — browsers unconditionally reject this combination. If you need credentials, list explicit origins.

## Consequences Of Violation
All credentialed CORS requests fail; SPA authentication (Sanctum) completely broken; difficult to debug because browser console shows generic CORS error.
---

## Handle OPTIONS Before Authentication Middleware
---
## Category
Architecture
---
## Rule
Always ensure CORS middleware (`HandleCors`) runs before authentication middleware for OPTIONS requests — never require auth for preflight.
---
## Reason
CORS preflight requests (OPTIONS) have no credentials — browsers send them without `Authorization` headers. If authentication middleware runs first, it rejects the preflight, the browser sees no CORS headers, and the actual request is blocked. The OPTIONS response must include CORS headers unconditionally.
---
## Bad Example
```php
// Middleware order that blocks preflight
'auth:sanctum', // rejects OPTIONS before CORS
\Fruitcake\Cors\HandleCors::class,
```

## Good Example
```php
// Middleware order that handles preflight first
\Fruitcake\Cors\HandleCors::class, // responds to OPTIONS before auth
'auth:sanctum',
```

## Exceptions
No exceptions — CORS middleware must always precede auth middleware in the pipeline. This is a browser requirement, not a design choice.

## Consequences Of Violation
All non-simple requests fail with CORS errors; PUT, PATCH, DELETE, and custom-header requests break; SPA clients cannot perform any write operations.
---

## Configure CORS In config/cors.php Only
---
## Category
Code Organization
---
## Rule
Always configure CORS in `config/cors.php` — never hardcode CORS headers in middleware, controllers, or blade templates.
---
## Reason
Centralized CORS configuration provides a single source of truth visible to any developer reviewing the codebase. Hardcoded CORS headers in individual files are hard to audit, inconsistent, and frequently forgotten when updating policies. `config/cors.php` is the Laravel-standard location.
---
## Bad Example
```php
// In a controller
return response()->json($data)
    ->header('Access-Control-Allow-Origin', '*');
```

## Good Example
```php
// config/cors.php
return [
    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
];
```

## Exceptions
When dynamic origin validation is required (e.g., validating against an allowlist in the database). Still use config for the static base policy and add dynamic validation in a dedicated middleware.

## Consequences Of Violation
CORS configuration scattered across the codebase; inconsistent policies between endpoints; security audit cannot verify CORS posture in one place.
---

## Use Environment Variables For Origins
---
## Category
Maintainability
---
## Rule
Always read allowed origins from environment variables — never hardcode CORS origins in config files or source code.
---
## Reason
Hardcoded origins differ between environments (localhost, staging, production). Using environment variables allows each deployment to specify its own origins without code changes. This prevents accidental deployment of development CORS policies to production.
---
## Bad Example
```php
'allowed_origins' => ['http://localhost:3000', 'https://app.example.com'],
// Mixed environments in source code
```

## Good Example
```php
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),
// Each environment sets CORS_ALLOWED_ORIGINS in .env
```

## Exceptions
When the application has a single deployment target and origin list never changes between environments. Even then, env vars provide future flexibility with no downside.

## Consequences Of Violation
Development origins deployed to production; security review required for every origin change; deployment process becomes error-prone with manual config editing.
---

## Expose Only Required Headers
---
## Category
Security
---
## Rule
Always limit `Access-Control-Expose-Headers` to only headers the client-side code actually reads — never expose debug, internal, or diagnostic headers.
---
## Reason
By default, browsers expose only simple response headers (Content-Type, Cache-Control) to JavaScript. The `exposed_headers` config leaks additional headers. Debug headers (`X-Debug-Token`, `X-Debug-Exception`) expose internal information, file paths, and execution details that aid attackers.
---
## Bad Example
```php
'exposed_headers' => ['X-Debug-Token', 'X-Debug-Exception', 'X-Internal-Meta'],
// Leaks internal debug information to browser clients
```

## Good Example
```php
'exposed_headers' => ['X-Request-Id', 'Link', 'X-RateLimit-Remaining'],
// Only headers the client needs to read
```

## Exceptions
When using internal debugging tools in non-production environments (staging, development). Still avoid exposing debug headers in production.

## Consequences Of Violation
Internal information leakage to browser clients; easier reconnaissance for attackers; compliance violations for data exposure requirements.
---

## Include Sanctum Endpoints In CORS Paths For SPA Auth
---
## Category
Framework Usage
---
## Rule
Always include `sanctum/csrf-cookie` in the CORS `paths` configuration when using Laravel Sanctum for SPA authentication.
---
## Reason
Sanctum's SPA authentication requires a CSRF cookie endpoint that must be accessible via CORS. Without including this path, the preflight for the CSRF cookie request fails, and the SPA cannot obtain a CSRF token. The SPA authentication flow breaks entirely.
---
## Bad Example
```php
'paths' => ['api/*'],
// Missing sanctum/csrf-cookie — SPA auth fails
```

## Good Example
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
```

## Exceptions
When using Sanctum with token-based authentication (not SPA mode). In that case, the CSRF cookie endpoint is not needed.

## Consequences Of Violation
Sanctum SPA authentication completely broken; SPA cannot obtain CSRF token; all authenticated requests fail with 419 CSRF token mismatch; hours of debugging before discovering the missing path.
---

## Review Allowed Origins Quarterly
---
## Category
Maintainability
---
## Rule
Always review and prune the allowed origins list at least once per quarter — remove unused origins to minimize the security surface.
---
## Reason
Origins accumulate over time as new frontends, admin panels, and partner applications are added. Unused origins become stale security liabilities — an attacker compromises an unused subdomain or partner application and gains CORS access. Regular pruning keeps the attack surface minimal.
---
## Bad Example
```php
// Leftover origins from abandoned projects and acquired companies
'allowed_origins' => [
    'https://old-admin.example.com', // decommissioned 2 years ago
    'https://partner-deprecated.com', // partnership ended
],
```

## Good Example
```php
// Reviewed and pruned quarterly — only current active origins
'allowed_origins' => [
    'https://app.example.com',
    'https://admin.example.com',
],
```

## Exceptions
When infrastructure automation manages origins dynamically (e.g., Kubernetes service discovery). Automate the review process via CI/CD rather than manual quarterly checks.

## Consequences Of Violation
Stale origins expand attack surface; security audits flag unused CORS entries; compromised abandoned subdomains gain CORS access to the API.
---
