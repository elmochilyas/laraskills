# Rules: Security Headers

## Set Strict-Transport-Security (HSTS) in Production
---
## Category
Security
---
## Rule
Send `Strict-Transport-Security: max-age=31536000; includeSubDomains` on all responses in production. Use a lower `max-age` during initial rollout.
---
## Reason
HSTS tells browsers to always use HTTPS for the domain, preventing SSL-stripping attacks. Without HSTS, a user who types `example.com` may be redirected to HTTP first, where a man-in-the-middle can intercept the connection. `includeSubDomains` extends protection to all subdomains.
---
## Bad Example
```php
// No HSTS header — browsers may connect via HTTP
```
---
## Good Example
```php
// Middleware sets HSTS header
$response->header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```
---
## Exceptions
Staging/local environments — HSTS on `localhost` causes browser warnings.
---
## Consequences Of Violation
SSL stripping attacks, downgraded to HTTP.
---

## Set Content-Security-Policy to Mitigate XSS
---
## Category
Security
---
## Rule
Define a Content-Security-Policy header that restricts script sources to `'self'` and nonced/hashed scripts. Use a reporting endpoint during rollout.
---
## Reason
CSP is a powerful defense-in-depth against XSS. A strict policy blocks inline scripts, `eval()`, and scripts from unauthorized origins. A `report-uri` or `report-to` endpoint captures violations during rollout without breaking functionality.
---
## Bad Example
```php
// No CSP header — no defense-in-depth
```
---
## Good Example
```php
$nonce = base64_encode(random_bytes(32));
$csp = "script-src 'nonce-{$nonce}' 'strict-dynamic'; report-uri /csp-report";
$response->header('Content-Security-Policy', $csp);
```
---
## Exceptions
Report-only mode (`Content-Security-Policy-Report-Only`) during initial rollout.
---
## Consequences Of Violation
Increased XSS impact, no secondary defense.
---

## Set X-Content-Type-Options: nosniff
---
## Category
Security
---
## Rule
Send `X-Content-Type-Options: nosniff` on all responses. This is a simple, no-side-effect security header.
---
## Reason
This header prevents browsers from MIME-sniffing a response away from the declared Content-Type. Without it, a browser may interpret a script served as `text/plain` (e.g., a user-uploaded file) as JavaScript, enabling XSS.
---
## Bad Example
```php
// No X-Content-Type-Options — browser may MIME-sniff
```
---
## Good Example
```php
$response->header('X-Content-Type-Options', 'nosniff');
```
---
## Exceptions
No exceptions — this header should be present on all responses.
---
## Consequences Of Violation
XSS through MIME-type confusion.
---

## Set X-Frame-Options: DENY (or SAMEORIGIN)
---
## Category
Security
---
## Rule
Send `X-Frame-Options: DENY` (prefer) or `SAMEORIGIN` on all responses. Use `DENY` unless the application requires iframing on the same origin.
---
## Reason
This header prevents clickjacking — embedding the application in an attacker's `<iframe>`. An attacker can overlay invisible UI elements on top of an iframed login form to steal credentials. `DENY` blocks all iframing.
---
## Bad Example
```php
// No X-Frame-Options — page can be iframed by any site
```
---
## Good Example
```php
$response->header('X-Frame-Options', 'DENY');
```
---
## Exceptions
Applications that must be embeddable in same-origin iframes — use `SAMEORIGIN`.
---
## Consequences Of Violation
Clickjacking, credential theft via iframe overlay.
---

## Set Referrer-Policy: strict-origin-when-cross-origin
---
## Category
Security
---
## Rule
Send `Referrer-Policy: strict-origin-when-cross-origin` on all responses.
---
## Reason
This policy controls what information is sent in the `Referer` header to other origins. `strict-origin-when-cross-origin` sends the full URL for same-origin requests, sends only the origin for cross-origin requests, and sends nothing when downgrading to HTTP. This prevents leaking sensitive URL parameters to third-party sites.
---
## Bad Example
```php
// No Referrer-Policy — full URL sent to all origins
```
---
## Good Example
```php
$response->header('Referrer-Policy', 'strict-origin-when-cross-origin');
```
---
## Exceptions
No common exceptions — this is a safe, privacy-preserving default.
---
## Consequences Of Violation
URL parameter leakage in Referer header to third-party origins.
---

## Set Permissions-Policy to Restrict Browser Features
---
## Category
Security
---
## Rule
Send `Permissions-Policy` with features set to `'self'` or `'none'`. Disable features the application does not use.
---
## Reason
Permissions-Policy (formerly Feature-Policy) restricts which browser APIs and features (camera, microphone, geolocation) the page and its iframes can access. Disabling unused features reduces the attack surface for API abuse.
---
## Bad Example
```php
// No Permissions-Policy — all browser features enabled
```
---
## Good Example
```php
$response->header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
```
---
## Exceptions
Applications that legitimately use camera, microphone, or geolocation.
---
## Consequences Of Violation
Browser API abuse via XSS, unnecessary feature access.
---

## Remove X-Powered-By Header in Production
---
## Category
Security
---
## Rule
Ensure `X-Powered-By: PHP/<version>` is removed from responses by setting `expose_php = Off` in `php.ini` or via middleware.
---
## Reason
The `X-Powered-By` header reveals the PHP version. An attacker scanning for outdated PHP versions can target known vulnerabilities specific to that version. Removing the header adds a minor but valuable information-hiding layer.
---
## Bad Example
```php
// php.ini
expose_php = On // Response includes PHP version
```
---
## Good Example
```php
// php.ini
expose_php = Off // PHP version not exposed
```
---
## Exceptions
No common exceptions — PHP version should not be publicly visible.
---
## Consequences Of Violation
Easy PHP version fingerprinting, targeted vulnerability exploitation.
---

## Apply Headers in Middleware, Not in Individual Controllers
---
## Category
Architecture
---
## Rule
Set security headers in HTTP middleware (or via a package like `laravel-security-headers`). Never set them in individual controllers.
---
## Reason
Security headers must be present on every response. Adding them in middleware guarantees coverage across all routes. Individual controllers inevitably miss some routes, creating gaps in header coverage.
---
## Bad Example
```php
// Header set only in one controller — other routes unprotected
public function index() {
    return response('...')->header('X-Frame-Options', 'DENY');
}
```
---
## Good Example
```php
// Middleware applied to all responses
class SecurityHeadersMiddleware {
    public function handle($request, $next) {
        $response = $next($request);
        $response->header('X-Frame-Options', 'DENY');
        $response->header('X-Content-Type-Options', 'nosniff');
        return $response;
    }
}
```
---
## Exceptions
Headers that differ per route (e.g., CSP with a per-route nonce).
---
## Consequences Of Violation
Inconsistent header coverage, routes missing security headers.
