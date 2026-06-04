# Phase 5: Rules — API Security Headers

> Generated from 04-standardized-knowledge.md

## Use a Single Dedicated Middleware for All Security Headers
---
## Category
Code Organization
---
## Rule
Always consolidate all security headers into a single middleware class registered in the API middleware group.
---
## Reason
A single middleware ensures headers are set consistently on every response, simplifies auditing, and avoids header conflicts from multiple scattered middlewares.
---
## Bad Example
```php
// Scattered across controller or multiple middlewares
public function index() {
    return response($data)->header('X-Content-Type-Options', 'nosniff');
}
```

---
## Good Example
```php
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'no-referrer');
        return $response;
    }
}
```

---
## Exceptions
Headers set at the reverse-proxy level (Nginx, Cloudflare) should be disabled in Laravel to avoid duplication.
---
## Consequences Of Violation
Inconsistent header coverage, missing headers on some responses, hard-to-audit security posture.

---
## Set X-Content-Type-Options: nosniff on Every Response
---
## Category
Security
---
## Rule
Always include `X-Content-Type-Options: nosniff` on every API response, including errors and OPTIONS preflight.
---
## Reason
Prevents browsers from MIME-type sniffing, which can interpret API JSON responses as executable content in certain attack scenarios.
---
## Bad Example
```php
// No header set — browser may sniff response
```

---
## Good Example
```php
$response->headers->set('X-Content-Type-Options', 'nosniff');
```

---
## Exceptions
No common exceptions. This header is always safe to send.
---
## Consequences Of Violation
Vulnerability to MIME-type confusion attacks; browser may execute JSON as scripts.

---
## Always Send Strict-Transport-Security Over HTTPS Only
---
## Category
Security
---
## Rule
Only send the `Strict-Transport-Security` header when the response is served over HTTPS. Never send HSTS over plain HTTP.
---
## Reason
Browsers ignore HSTS headers received over HTTP because an active attacker could inject the header. Sending HSTS over HTTP gives a false sense of security and wastes bytes.
---
## Bad Example
```php
$response->headers->set('Strict-Transport-Security', 'max-age=31536000');
// Sent on HTTP — ignored by browser
```

---
## Good Example
```php
if ($request->isSecure()) {
    $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}
```

---
## Exceptions
Development environments where HTTPS is terminated at a proxy and Laravel sees HTTP — configure `TrustProxies` first.
---
## Consequences Of Violation
HSTS not enforced; users vulnerable to SSL stripping on first visit.

---
## Restrict CSP to default-src 'none' for JSON APIs
---
## Category
Security
---
## Rule
Always set `Content-Security-Policy: default-src 'none'` for JSON API responses instead of `default-src 'self'` or permissive policies.
---
## Reason
JSON API responses are not HTML documents — they do not load scripts, styles, or fonts. A restrictive CSP prevents any injected content from executing and adds zero server overhead.
---
## Bad Example
```php
$response->headers->set('Content-Security-Policy', "default-src 'self'");
// Meaningless for JSON — allows unnecessary resource loading
```

---
## Good Example
```php
$response->headers->set('Content-Security-Policy', "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests");
```

---
## Exceptions
APIs that serve mixed HTML/JSON responses — use route-based CSP policies.
---
## Consequences Of Violation
Unnecessarily permissive CSP; potential XSS vectors in browsers that render API responses as HTML.

---
## Set Cache-Control: no-store, private on Authenticated Routes
---
## Category
Security
---
## Rule
Always set `Cache-Control: no-store, private` on authenticated API responses to prevent shared proxy caching.
---
## Reason
Authenticated responses contain user-specific data. Without this header, shared proxies and CDNs may cache and serve one user's data to another user.
---
## Bad Example
```php
// No Cache-Control header — proxy may cache authenticated response
return response()->json($userData);
```

---
## Good Example
```php
return response()->json($userData)
    ->header('Cache-Control', 'no-store, private');
```

---
## Exceptions
Public API endpoints with non-sensitive data that explicitly want CDN caching — use `Cache-Control: public, max-age=60`.
---
## Consequences Of Violation
User data leakage via shared proxy caches; privacy compliance violations (GDPR, CCPA).

---
## Remove X-Powered-By Header
---
## Category
Security
---
## Rule
Always remove the `X-Powered-By` header from all API responses.
---
## Reason
Reveals the PHP version to attackers, aiding targeted exploit searches against known PHP vulnerabilities. Removing it increases recon cost with zero user impact.
---
## Bad Example
```php
// Default Laravel behavior — sends X-Powered-By: PHP/8.3
```

---
## Good Example
```php
// In bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->remove(['X-Powered-By']);
})
```

---
## Exceptions
No common exceptions. Never expose PHP version in production.
---
## Consequences Of Violation
Information leakage aiding vulnerability targeting; easier for attackers to identify exploitable PHP versions.

---
## Set Referrer-Policy: no-referrer on All Responses
---
## Category
Security
---
## Rule
Always set `Referrer-Policy: no-referrer` on every API response.
---
## Reason
API URLs may contain tokens, resource IDs, or sensitive query parameters. Without this header, those URLs are leaked via the `Referer` header when the client navigates to external resources.
---
## Bad Example
```php
// No Referrer-Policy — browser sends full URL as Referer
```

---
## Good Example
```php
$response->headers->set('Referrer-Policy', 'no-referrer');
```

---
## Exceptions
No common exceptions for API endpoints.
---
## Consequences Of Violation
API URLs with sensitive data leaked to third-party services via Referer header.

---
## Never Use Deprecated X-XSS-Protection Header
---
## Category
Security
---
## Rule
Never set the `X-XSS-Protection` header. Use CSP instead.
---
## Reason
`X-XSS-Protection` is deprecated and may introduce XSS vulnerabilities in certain browsers. CSP provides modern, comprehensive XSS protection.
---
## Bad Example
```php
$response->headers->set('X-XSS-Protection', '1; mode=block');
```

---
## Good Example
```php
// Remove it entirely
$response->headers->remove('X-XSS-Protection');
// Let CSP handle XSS prevention
$response->headers->set('Content-Security-Policy', "default-src 'none'");
```

---
## Exceptions
Legacy browser support requirements that explicitly need this header — pair with CSP anyway.
---
## Consequences Of Violation
False sense of XSS protection; potential XSS vulnerabilities in older browsers that handle this header incorrectly.
