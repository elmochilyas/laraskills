# API Security Headers

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Security headers are HTTP response headers that instruct the browser (or API client) to enforce security behaviors such as content type sniffing prevention, strict transport security, clickjacking protection, and content security policy. For APIs, the most relevant security headers include `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cache-Control`. These headers protect API consumers from common web vulnerabilities and are a baseline requirement for security-conscious API design.

## Core Concepts
- **`X-Content-Type-Options: nosniff`**: Prevents MIME type sniffing. The browser trusts the `Content-Type` header and refuses to interpret files as a different type.
- **`Strict-Transport-Security` (HSTS)**: Instructs browsers to only communicate with the server over HTTPS for a specified duration. Prevents SSL stripping attacks.
- **`Content-Security-Policy` (CSP)**: Controls which resources (scripts, styles, fonts, images) the browser is allowed to load. For APIs, CSP is less critical (no HTML rendering) but relevant if the API returns HTML in error pages.
- **`X-Frame-Options: DENY`**: Prevents the page from being rendered in an iframe (clickjacking prevention).
- **`Referrer-Policy: no-referrer`**: Controls how much referrer information is sent with requests. For APIs, `no-referrer` or `same-origin` prevents leaking the API URL in `Referer` headers.
- **`Permissions-Policy`**: Controls browser features (geolocation, camera, microphone) that the page can access. APIs should deny all features.
- **`Cache-Control`**: For API responses, `no-store, private` prevents caching of sensitive data in shared caches.
- **`X-XSS-Protection: 0`**: Deprecated. Modern browsers ignore this. CSP provides better XSS protection.

## Mental Models
- **Security headers as castle defenses**: Each header is a different defense layer. HSTS is the moat (forces HTTPS). X-Content-Type-Options is the gate guard (checks IDs). CSP is the interior security (controls what runs inside).
- **Headers as browser instructions**: These are not for the user — they are machine-readable instructions telling the browser how to behave.
- **Overhead vs protection**: Each header adds a few bytes to the response but prevents specific attack classes. The cost is negligible; the protection is significant.

## Internal Mechanics
- Security headers are added via middleware that runs after the response is built but before it is sent to the client.
- Laravel provides no built-in security header middleware (except `AddLinkHeadersForPreloadedAssets` for preload). Custom middleware is required.
- Headers are set on the response object: `$response->header('X-Content-Type-Options', 'nosniff')`.
- Multiple headers can be set in a single middleware class:
  ```php
  public function handle(Request $request, Closure $next) {
      $response = $next($request);
      $response->headers->set('X-Content-Type-Options', 'nosniff');
      $response->headers->set('X-Frame-Options', 'DENY');
      return $response;
  }
  ```
- HSTS includes a `max-age` directive (seconds) and optionally `includeSubDomains` and `preload`.
- CSP uses directives separated by semicolons: `default-src 'none'; base-uri 'none'; form-action 'none'`.

## Patterns
- **API-optimized CSP**: For pure JSON APIs, use the most restrictive CSP:
  ```php
  "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
  ```
- **HSTS with preload**: For production APIs:
  ```php
  "max-age=31536000; includeSubDomains; preload"
  ```
- **Cache-Control for authenticated responses**:
  ```php
  "private, no-store, no-cache, must-revalidate, max-age=0"
  ```
- **Security headers middleware class**:
  ```php
  class SecurityHeadersMiddleware {
      public function handle($request, $next) {
          $response = $next($request);
          $response->headers->set('X-Content-Type-Options', 'nosniff');
          $response->headers->set('X-Frame-Options', 'DENY');
          $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
          $response->headers->set('Referrer-Policy', 'no-referrer');
          $response->headers->set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
          return $response;
      }
  }
  ```
- **Conditional HSTS**: Only send HSTS header in production (not over HTTP):
  ```php
  if (app()->environment('production') && $request->isSecure()) {
      $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
  }
  ```
- **Security headers through Nginx**: For higher performance, set security headers at the Nginx reverse proxy level instead of PHP middleware.

## Architectural Decisions
1. **Middleware vs Nginx**: Security headers set in PHP are easier to maintain (deploy with code). Headers set in Nginx are more performant (no PHP process for OPTIONS/static files). For dynamic APIs, middleware is fine.
2. **HSTS `includeSubDomains`**: Use with caution. If any subdomain does not support HTTPS, `includeSubDomains` will break it. Start with `max-age=86400` (1 day) and increase gradually to `31536000` (1 year).
3. **CSP for error pages**: If your API returns HTML error pages (e.g., 404, 500), CSP should restrict inline scripts and styles. For pure JSON APIs, CSP is less relevant but still a good practice.
4. **`X-Powered-By` removal**: Remove `X-Powered-By: PHP/8.x` header to avoid revealing PHP version. This is set in `fpm/fcgi.ini` or the framework's `HttpKernel`.

## Tradeoffs (table)
| Header | Security Benefit | Response Overhead | Implementation Complexity |
|--------|-----------------|-------------------|--------------------------|
| HSTS | SSL stripping prevention | ~50 bytes | Low |
| X-Content-Type-Options | MIME sniffing prevention | ~30 bytes | Low |
| CSP | XSS, data injection | ~100-200 bytes | Medium |
| X-Frame-Options | Clickjacking | ~25 bytes | Low |
| Referrer-Policy | Referrer leakage | ~30 bytes | Low |
| Permissions-Policy | Feature restriction | ~80 bytes | Low |
| Cache-Control | Sensitive data caching | ~50 bytes | Low |

## Performance Considerations
- Security headers add 200-400 bytes per response — negligible compared to API payloads.
- HSTS preload list registration requires no additional server load.
- CSP does not affect server performance (all enforcement is client-side).
- Headers set in middleware add ~0.01ms to response time — irrelevant.

## Production Considerations
- **HSTS preload**: After setting HSTS with `preload`, submit your domain to https://hstspreload.org. This hardcodes HTTPS enforcement in Chromium-based browsers.
- **HSTS gradual rollout**: Start with `max-age=86400`, monitor for HTTPS issues, increase to `31536000` after a week.
- **Reporting endpoints**: CSP supports `report-uri` and `report-to` directives for violation reporting. Set up an endpoint to collect CSP violations.
- **Security header testing**: Use securityheaders.com or Observatory by Mozilla to scan your API's security headers.
- **Header duplication**: If both Laravel and Nginx set security headers, they may be sent twice. Configure headers in one layer only.
- **Static file exclusion**: OPTIONS preflight responses and static assets (if served by Laravel) should also include security headers.

## Common Mistakes
- Not removing the `X-Powered-By` header, exposing PHP version to attackers.
- Setting HSTS over HTTP — browsers ignore HSTS when received over an insecure connection.
- Using `X-XSS-Protection: 1; mode=block` — this is deprecated and may introduce XSS vulnerabilities in some browsers. Use CSP instead.
- Setting CSP `default-src 'self'` for APIs that return JSON — the directive is meaningless for non-HTML responses.
- Forgetting `Cache-Control: no-store` for authenticated API responses — cached responses in shared proxies can leak user data.
- Setting `Access-Control-Allow-Origin: *` alongside credentials (covered in CORS), but also exposing the `Authorization` header in responses without proper security headers.
- Sending `Strict-Transport-Security` on non-production domains (`.dev`, `.local`) — browsers may still enforce HSTS and cause development issues.

## Failure Modes
1. **HSTS misconfiguration breaks subdomain**: Setting `includeSubDomains` when `admin.example.com` does not support HTTPS. Solution: Verify all subdomains support HTTPS before enabling `includeSubDomains`.
2. **CSP blocks legitimate API calls**: A CSP directive inadvertently blocks API responses that include scripts or inline styles. Solution: For APIs, use `default-src 'none'` and add only needed directives.
3. **Cache-Control missing causes data leak**: A shared proxy (ISP) caches an authenticated API response and serves it to another user. Solution: Always set `Cache-Control: no-store, private` on authenticated routes.
4. **Security headers stripped by CDN**: Cloudflare or Akamai may strip unknown or verbose security headers. Solution: Configure CDN to pass through custom headers.
5. **Referrer-Policy violation**: API URLs containing tokens or session IDs in the path are leaked via the `Referer` header to external resources. Solution: Use `Referrer-Policy: no-referrer` and avoid tokens in URLs.

## Ecosystem Usage
- **OWASP Secure Headers Project**: The authoritative guide for security headers. Recommends HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy, and Permissions-Policy.
- **Mozilla Observatory**: Grades websites/APIs on their security headers. A-grade requires HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy.
- **Stripe API**: Uses `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`. Stripe's API responses have minimal but essential security headers.

## Related Knowledge Units
### Prerequisites
- HTTP headers fundamentals
- HTTPS/TLS basics

### Related Topics
- [cors-configuration](./phase-2/12-cors-configuration.md)
- [api-specific-middleware](./phase-2/15-api-specific-middleware.md)

### Advanced Follow-up Topics
- HSTS preload list submission process
- CSP violation reporting (report-uri, report-to)
- Expect-CT header (deprecated, but historical context)

## Research Notes
### Source Analysis
OWASP Secure Headers Project (https://owasp.org/www-project-secure-headers/) is the primary reference. The MDN Web Docs provide detailed specification for each header.

### Key Insight
For APIs, the most impactful security headers are `Strict-Transport-Security` (HTTPS enforcement), `X-Content-Type-Options: nosniff` (MIME sniffing prevention), and `Cache-Control: no-store` (prevent caching of sensitive data). CSP is critical for HTML-rendering applications but less relevant for JSON APIs. Prioritize the essential headers over a "complete" list.

### Version-Specific Notes
- **PHP 8.x**: `header()` function unchanged. No framework-specific changes.
- **Laravel 11**: Security headers must be added via custom middleware. Laravel does not ship with a built-in security headers middleware.
- **Browser changes**: Chrome and Firefox continue to deprecate `X-XSS-Protection` (removed in Chrome). Use CSP instead.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.