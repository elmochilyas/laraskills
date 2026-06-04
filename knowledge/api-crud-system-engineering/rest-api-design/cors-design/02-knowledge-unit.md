# CORS Design

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** CORS Design
- **Last Updated:** 2026-06-02

---

## Executive Summary

Cross-Origin Resource Sharing (CORS) is a browser security mechanism that controls which web origins can access a server's resources. When a browser-based client (JavaScript fetch, XMLHttpRequest) makes a request to a different origin than the page's origin, the browser checks CORS headers to determine whether to allow the request. CORS is enforced by the browser, not by the server — the server simply declares its CORS policy via headers.

In Laravel, CORS is configured in `config/cors.php` (introduced in Laravel 7) or via the `HandleCors` middleware. The configuration covers allowed origins, methods, headers, exposed headers, credentials (cookies/authorization headers), and preflight max age. Production CORS policies should be as restrictive as possible — allow only the specific origins that need access, not wildcard `*`.

---

## Core Concepts

### Same-Origin Policy
Browsers restrict JavaScript from making requests to a different origin (different protocol, domain, or port). CORS relaxes this restriction via server-declared headers. Without CORS, browsers block cross-origin requests.

### CORS Headers

| Header | Purpose | Example |
|---|---|---|
| `Access-Control-Allow-Origin` | Which origins are allowed | `Access-Control-Allow-Origin: https://myapp.com` |
| `Access-Control-Allow-Methods` | Allowed HTTP methods | `Access-Control-Allow-Methods: GET, POST, PUT, DELETE` |
| `Access-Control-Allow-Headers` | Allowed request headers | `Access-Control-Allow-Headers: Content-Type, Authorization` |
| `Access-Control-Expose-Headers` | Headers accessible to JS | `Access-Control-Expose-Headers: X-Request-Id, Link` |
| `Access-Control-Allow-Credentials` | Allow cookies/auth headers | `Access-Control-Allow-Credentials: true` |
| `Access-Control-Max-Age` | Cache preflight response | `Access-Control-Max-Age: 86400` |

### Simple vs Preflight Requests

**Simple requests** (no preflight needed):
- Method: GET, HEAD, POST
- Headers: Accept, Accept-Language, Content-Language, Content-Type (only `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`)

**Preflight requests** (browser sends OPTIONS first):
- Method: PUT, PATCH, DELETE, or any method not in simple set
- Headers: Custom headers (Authorization, X-CSRF-TOKEN, etc.)
- Content-Type: `application/json`, `application/xml`, or any non-simple type

### Preflight Flow
1. Browser sends `OPTIONS /api/users` with `Origin`, `Access-Control-Request-Method`, `Access-Control-Request-Headers`
2. Server responds with CORS headers (or no CORS headers = deny)
3. Browser checks response headers against request origin
4. If allowed: browser sends actual request with CORS headers
5. If denied: browser blocks the actual request, shows CORS error in console

---

## Mental Models

### The Guest List Model
The server maintains a guest list (allowed origins). When a request arrives from an origin, the server checks whether that origin is on the list. If yes, access is granted. If no, the server doesn't respond with CORS headers, and the browser blocks the request.

### The Bouncer Model
CORS is like a bouncer at a club. The client (browser) asks the bouncer "can my friend (origin) come in?" If the friend is on the list, they enter. If they try to enter without checking with the bouncer, they're stopped at the door.

### The Security Envelope Model
CORS wraps requests in a security envelope that only certain origins can open. The browser enforces the envelope. Without CORS, any website could make authenticated requests to your API on behalf of your users (CSRF attack).

---

## Internal Mechanics

### Laravel CORS Configuration (`config/cors.php`)
```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'],  // Use specific origins in production
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

### Laravel HandleCors Middleware
The `HandleCors` middleware (`\Illuminate\Http\Middleware\HandleCors`) is included in the `api` middleware group by default. It:
1. Reads CORS configuration from `config/cors.php`
2. Sets CORS headers on the response for matching paths
3. For OPTIONS preflight requests: returns 204 with CORS headers
4. For non-OPTIONS requests: adds CORS headers to the response

### Sanctum CORS Integration
Laravel Sanctum requires specific CORS configuration for SPA authentication:
```php
// config/cors.php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'supports_credentials' => true,
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
```

Sanctum's `EnsureFrontendRequestsAreStateful` middleware sends `Access-Control-Allow-Credentials: true` and validates the requesting origin against allowed origins for session-based authentication.

### Dynamic Origin Resolution
```php
// config/cors.php — Allow multiple specific origins
'allowed_origins' => [
    'https://admin.myapp.com',
    'https://app.myapp.com',
    'https://staging.myapp.com',
],

// Or use patterns for subdomain matching
'allowed_origins_patterns' => [
    '/^https:\/\/.*\.myapp\.com$/',
],
```

---

## Patterns

### Strict CORS for Production
```php
// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    'allowed_origins' => [
        'https://app.myapp.com',
        'https://admin.myapp.com',
    ],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'exposed_headers' => ['X-Request-Id', 'Link'],
    'max_age' => 86400,  // 24 hours
    'supports_credentials' => true,
];
```

### Development CORS
```php
// config/cors.php — Environment-aware configuration
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'http://localhost:5173',  // Vite dev server
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => env('APP_ENV') === 'production' ? 86400 : 0,
    'supports_credentials' => env('APP_ENV') !== 'production',
];
```

### Wildcard with Credentials Restriction
When `supports_credentials` is true, `allowed_origins` cannot be `*`. The browser rejects `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`. Use explicit origins or dynamically echo the requesting origin.

```php
// Dynamic origin echo (use with caution)
'allowed_origins' => ['*'],  // Only when supports_credentials is false
```

### SPA with Sanctum CORS
```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('SPA_URL', 'http://localhost:3000')],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,  // Required for Sanctum SPA auth
];
```

### Custom CORS Middleware
```php
class CustomCorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $origin = $request->header('Origin');
        $allowedOrigins = config('cors.allowed_origins');
        
        $response = $next($request);
        
        if (in_array($origin, $allowedOrigins) || in_array('*', $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        
        return $response;
    }
}
```

---

## Architectural Decisions

### Specific Origins vs Wildcard
Wildcard `*` is convenient for development but dangerous in production. Use specific origins in production. If supporting multiple domains (admin panel, user-facing app), list them explicitly. Never use wildcard with `supports_credentials: true`.

### Credentials Policy
`Access-Control-Allow-Credentials: true` is required for:
- Cookie-based authentication (Sanctum SPA)
- Authorization headers that include cookies
- Session-based CSRF protection

Without credentials, the browser strips cookies and Authorization headers from cross-origin requests.

### Max-Age Strategy
`Access-Control-Max-Age` controls how long the browser caches the preflight response. A high value (86400 = 24 hours) reduces preflight requests but delays CORS policy changes. A low value (0) ensures immediate policy updates but increases preflight traffic.

### Exposed Headers
By default, browsers expose only simple response headers (Cache-Control, Content-Language, Content-Type, Expires, Last-Modified, Pragma). Custom headers (X-Request-Id, Link, X-RateLimit-*) require `Access-Control-Expose-Headers` to be readable by JavaScript.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Specific origins: Maximum security | Specific origins: Must update config when adding new clients | Deployment required for new frontend domains |
| Wildcard: Zero configuration for new clients | Wildcard: No restriction on who can access the API | Higher CSRF/abuse risk |
| Credentials enabled: Full cookie auth support | Credentials enabled: No wildcard origin allowed | Must maintain explicit origin list |
| High max-age: Fewer preflight requests | High max-age: CORS policy changes take 24h to propagate | Need to communicate changes to frontend teams |
| Expose custom headers: Better client observability | Expose custom headers: Information disclosure risk | Headers like X-Debug-Info may leak sensitive data |

---

## Performance Considerations

### Preflight Request Overhead
Every non-simple request (PUT, PATCH, DELETE, custom headers) triggers a preflight OPTIONS request. For APIs with many write operations, this doubles the request count. Mitigations:
- Use simple Content-Type (`application/x-www-form-urlencoded`) when possible
- Set high `max_age` to cache preflight responses
- Minimize custom headers

### OPTIONS Response Optimization
Laravel's `HandleCors` middleware returns 204 for preflight OPTIONS with no content. This is fast (~1ms) but still adds network round-trip time. CDN caching of OPTIONS responses is not possible (browsers don't cache preflight across origins).

### Preflight Cache TTL
`Access-Control-Max-Age: 86400` means the browser caches the preflight for 24 hours. For an API with 1000 write operations per day from a single origin, this saves ~1000 OPTIONS requests per day (1000/24 ≈ 42 saved per hour).

---

## Production Considerations

### Environment-Specific Configuration
Use environment variables for allowed origins:
```php
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),
```

In `.env.production`: `CORS_ALLOWED_ORIGINS=https://app.myapp.com,https://admin.myapp.com`

### Staging vs Production Policies
Staging environments can have broader CORS policies than production. Use different `.env` values per environment. Never point staging frontend at production API without proper CORS restrictions.

### CORS Error Debugging
CORS errors appear only in the browser console, not in server logs (the server doesn't know the browser blocked the request). Debug common issues:
- Check `Origin` header is sent (it's not sent for same-origin requests)
- Verify `Access-Control-Allow-Origin` matches exactly (including trailing slash, protocol)
- Check for credentials mismatch (wildcard + credentials = blocked)
- Verify preflight OPTIONS returns 200/204 with correct headers

---

## Common Mistakes

### Using Wildcard with Credentials
Why it happens: Development convenience carries to production. Why it's harmful: Browsers reject `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`. Requests fail silently. Better approach: List explicit origins when using credentials.

### Forgetting to Configure CSRF Cookie Path
Why it happens: Sanctum CORS configuration allows requests but CSRF cookie path isn't updated. Why it's harmful: SPA can make requests but CSRF token validation fails. Better approach: Add `sanctum/csrf-cookie` to the `paths` array.

### Not Handling OPTIONS for Preflight
Why it happens: Custom middleware or route groups don't handle OPTIONS method. Why it's harmful: Preflight requests don't get CORS headers, browser blocks actual request. Better approach: Ensure `HandleCors` middleware runs before any authentication middleware for OPTIONS requests.

### Allowing Too Many Origins
Why it happens: Additive origin list grows over time. Why it's harmful: Any listed origin can access the API; unused origins become security liabilities. Better approach: Review and prune the origin list quarterly.

### Exposing Sensitive Custom Headers
Why it happens: `X-Debug-Token`, `X-Debug-Time`, or internal tracing headers are exposed to JavaScript. Why it's harmful: Exposes internal information to browser-side code. Better approach: Only expose headers that the client needs to read (X-Request-Id, Link, Rate-Limit headers).

---

## Failure Modes

### Preflight Bypass
CORS is only enforced by browsers. Server-to-server requests, mobile apps, CLI tools, and Postman are not subject to CORS. CORS is not a replacement for authentication — it's a browser mechanism that prevents a malicious website from making authenticated requests on behalf of a user.

### CORS as Security Theater
Misconfigured CORS (wildcard + credentials → rejected by browser) creates a false sense of security. The server is accessible from non-browser clients regardless. Always implement proper authentication and CSRF protection.

### CORS Policy Drift
Frontend teams add new origins (development servers, staging environments, preview deployments) without updating backend CORS configuration. Establish a process for origin changes: frontend team requests addition, backend team validates and deploys.

---

## Ecosystem Usage

### GitHub API
GitHub allows all origins (`*`) for API v3, no credentials support. GitHub's API is publicly accessible and doesn't use cookie-based auth for API endpoints. PAT (personal access tokens) used in Authorization header.

### Stripe API
Stripe's API servers do not set CORS headers compatible with browser-based usage. Stripe recommends using server-side SDKs for API access, not browser-side fetch calls. Stripe Elements (embedding UI) uses Stripe.js on a separate domain with its own CORS configuration.

### Laravel Sanctum SPA Authentication
Sanctum requires specific CORS configuration for SPA auth: specific allowed origins, credentials enabled, and `sanctum/csrf-cookie` path included. Sanctum's `EnsureFrontendRequestsAreStateful` middleware validates the origin for every request.

---

## Related Knowledge Units

### Prerequisites
- REST Architectural Constraints — Client-server separation
- HTTP Method Semantics — Preflight method handling

### Related Topics
- API Authentication & Authorization — CORS for credential-bearing requests
- Response Structures — Exposed headers for metadata
- URL Structure Design — Paths that need CORS coverage

### Advanced Follow-up Topics
- Content Security Policy (CSP) — Complementary browser security mechanism
- CSRF Protection — Relationship between CORS and CSRF tokens

---

## Research Notes

### Source Analysis
- MDN Web Docs: CORS (https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) — Comprehensive CORS reference
- W3C: Cross-Origin Resource Sharing specification
- Laravel Documentation: CORS Configuration

### Key Insight
CORS is a browser mechanism, not an API security mechanism. It prevents malicious websites from making authenticated requests on behalf of a user, but it does not protect the API from direct access. Authentication (tokens) and proper security headers are still required.

### Version-Specific Notes
- Laravel 11: CORS configuration in `config/cors.php` unchanged from Laravel 10
- Laravel 7+: `HandleCors` middleware included by default in HTTP kernel
- Laravel < 7: CORS required third-party packages (barryvdh/laravel-cors)
- Sanctum CORS requirements consistent across Laravel 10-13
