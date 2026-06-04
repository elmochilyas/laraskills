# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | Security Headers (HSTS, CSP, XFO, etc.) |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Security headers are HTTP response headers that instruct browsers to apply security protections. Key headers: **HSTS** (enforce HTTPS), **CSP** (Content-Security-Policy — control which resources can be loaded), **X-Frame-Options** (prevent clickjacking), **X-Content-Type-Options** (prevent MIME sniffing), **Referrer-Policy** (control referrer information), and **Permissions-Policy** (limit browser API access). Security headers are typically set globally via middleware. CSP should start in Report-Only mode and graduate to enforced mode.

---

## Core Concepts

- **HSTS (Strict-Transport-Security)**: `max-age=31536000; includeSubDomains; preload` — forces HTTPS for the domain and subdomains.
- **CSP (Content-Security-Policy)**: Controls which sources are allowed for scripts, styles, images, fonts, frames, etc. `default-src 'self'; script-src 'self'`.
- **X-Frame-Options**: `DENY` or `SAMEORIGIN` — prevents clickjacking by controlling if the page can be embedded in an iframe.
- **X-Content-Type-Options**: `nosniff` — prevents browsers from MIME-type sniffing (interpreting files as a different type).
- **Referrer-Policy**: `strict-origin-when-cross-origin` — controls what referrer information is sent with requests.
- **Permissions-Policy**: Controls browser features (geolocation, camera, microphone, payment). `geolocation=(), camera=()`.
- **Report-Only vs Enforced**: CSP can be set as `Content-Security-Policy-Report-Only` to monitor violations without blocking. Graduate to `Content-Security-Policy` when ready.

---

## When To Use

- Every web application — security headers are baseline security hardening
- HSTS for all HTTPS-only applications
- CSP dynamically for applications loading external resources
- X-Frame-Options for any application that should not be embedded in iframes

## When NOT To Use

- CSP in enforced mode without testing (start in Report-Only)
- HSTS in preload mode if subdomains may not support HTTPS
- X-Frame-Options if the application legitimately needs to be embedded (use CSP `frame-ancestors` instead)

---

## Best Practices

- **Build as Global Middleware**: Apply security headers on every response from day one.
- **CSP in Report-Only First**: Monitor violations. Fix legitimate resource loading issues. Then switch to enforced mode.
- **Use CSP Reporting**: Configure `report-uri` or `report-to` to collect CSP violation reports.
- **HSTS Preload for Public Sites**: Once HSTS is proven (no mixed content), submit domain to the HSTS preload list.
- **Test with All Clients**: Security headers can break legacy clients. Test header configurations before rolling out.

---

## Architecture Guidelines

- Global middleware adds security headers to every response
- CSP policy size affects browser parsing — keep directives focused on actual requirements
- HSTS `max-age`: minimum 1 year (31536000) for preload eligibility; start with 1 week during testing
- Use the `spatie/laravel-cookie-consent` or custom middleware for security header management
- For large CSP policies, consider CSP with nonces (for inline scripts/styles)

---

## Performance Considerations

- Security headers are set once per response — negligible overhead
- CSP policy size: 500-2000 bytes typical. Larger policies affect browser parsing time — keep focused.
- HSTS: one-time header check per domain visit — no per-request impact
- No significant server-side performance impact from any security header

---

## Security Considerations

- **CSP as Fallback, Not Primary**: CSP is a secondary XSS defense. Primary defense is Blade escaping (`{{ }}`).
- **HSTS Downgrade Protection**: HSTS prevents SSL stripping attacks but requires HTTPS to be working first.
- **Report-Only Bypass**: Report-Only modes do not block violations — they only report. Ensure violations are reviewed.
- **Permissions-Policy**: Limits damage if XSS is exploited — prevents access to camera, microphone, geolocation.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| CSP enforced without testing | Jumping straight to enforced | Legitimate resources blocked; site broken | Start in Report-Only; monitor; graduate |
| HSTS too short max-age | Short test values | No long-term enforcement | Use 31536000 (1 year) for production |
| Missing `includeSubDomains` | Copying partial config | Subdomains not protected by HSTS | Include `includeSubDomains` |
| No CSP reporting | No monitoring | CSP violations go undetected | Configure `report-uri` or `report-to` |
| CSP too restrictive | Blocking everything | Breaks third-party integrations (analytics, embeds, CDNs) | Test with all clients; use Report-Only first |

---

## Anti-Patterns

- **No security headers at all**: Baseline hardening is missing
- **CSP with wildcards**: `script-src 'unsafe-inline' 'unsafe-eval'` — defeats CSP's purpose
- **HSTS with short max-age**: Does not provide meaningful protection
- **X-Frame-Options and CSP frame-ancestors both set**: CSP `frame-ancestors` supersedes X-Frame-Options — use one

---

## Examples

**Security headers middleware:**
```php
// app/Http/Middleware/SecurityHeaders.php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    
    $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
    $response->headers->set('X-Content-Type-Options', 'nosniff');
    $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->headers->set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    
    return $response;
}
```

**CSP header:**
```php
// Content-Security-Policy header
$response->headers->set('Content-Security-Policy', 
    "default-src 'self'; " .
    "script-src 'self' https://analytics.example.com; " .
    "style-src 'self' 'unsafe-inline'; " .
    "img-src 'self' data: https://*.cloudfront.net; " .
    "report-uri /csp-report"
);
```

**HSTS header:**
```php
// Strict-Transport-Security
$response->headers->set('Strict-Transport-Security', 
    'max-age=31536000; includeSubDomains; preload'
);
```

---

## Related Topics

- Server header removal and hardening
- CORS configuration
- CSP nonce/script-src configuration
- Blade XSS prevention

---

## AI Agent Notes

- Security headers are the easiest hardening win — they require minimal code and provide significant browser-level protection.
- If the project has no security headers middleware, this is a quick gap to close.
- CSP Report-Only mode is strongly recommended for initial deployment. Monitor violations for a few weeks before switching to enforced.

---

## Verification

- [ ] Global security headers middleware implemented
- [ ] HSTS configured with appropriate max-age (31536000 for production)
- [ ] CSP configured (start in Report-Only, graduate to enforced)
- [ ] CSP reporting endpoint configured
- [ ] X-Frame-Options set (DENY or SAMEORIGIN)
- [ ] X-Content-Type-Options set (nosniff)
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy configured (restrict camera, mic, geolocation)
- [ ] Headers tested with curl in CI pipeline
- [ ] No legacy client breakage from headers
