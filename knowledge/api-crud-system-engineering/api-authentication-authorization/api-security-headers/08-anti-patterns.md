# ECC Anti-Patterns — API Security Headers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | API Security Headers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using Deprecated X-XSS-Protection Instead of CSP
2. Sending HSTS Over HTTP
3. Overly Permissive CSP for JSON APIs
4. Missing Cache-Control on Authenticated Routes
5. Scattered Security Headers Across Controllers

---

## Repository-Wide Anti-Patterns

- Fat Controllers

---

## Anti-Pattern 1: Using Deprecated X-XSS-Protection Instead of CSP

### Category
Security

### Description
Setting the `X-XSS-Protection: 1; mode=block` header instead of `Content-Security-Policy`, relying on a deprecated browser feature that may itself introduce XSS vulnerabilities.

### Why It Happens
Developers rely on outdated tutorials or copy-paste from legacy codebases. `X-XSS-Protection` was the standard before CSP became widely supported.

### Warning Signs
- `X-XSS-Protection` header present in response
- No `Content-Security-Policy` header configured
- Security middleware sets `X-XSS-Protection` explicitly

### Why It Is Harmful
The header is deprecated and may introduce XSS vulnerabilities in certain browsers. CSP provides comprehensive, modern XSS protection. Relying on the deprecated header creates a false sense of security.

### Real-World Consequences
Browsers that implement the header incorrectly can be tricked into reflecting injected scripts. No protection against modern XSS vectors that CSP would block.

### Preferred Alternative
Remove `X-XSS-Protection` entirely. Use `Content-Security-Policy: default-src 'none'` for JSON APIs, or appropriate CSP directives for HTML responses.

### Refactoring Strategy
1. Remove `X-XSS-Protection` from security middleware
2. Implement `Content-Security-Policy` with restrictive policy
3. Test with Mozilla Observatory or securityheaders.com
4. Verify deprecated header no longer appears in responses

### Detection Checklist
- [ ] Search for `X-XSS-Protection` in codebase
- [ ] Verify CSP header is present in all API responses
- [ ] Run `curl -I` to inspect response headers

### Related Rules
- Never Use Deprecated X-XSS-Protection Header (05-rules.md)

### Related Skills
- Implement API Security Headers (06-skills.md)

### Related Decision Trees
- CSP Strictness for JSON APIs vs HTML-Rendering Endpoints (07-decision-trees.md)

---

## Anti-Pattern 2: Sending HSTS Over HTTP

### Category
Security

### Description
Sending the `Strict-Transport-Security` header on responses served over plain HTTP, where browsers ignore it entirely, creating a false sense of HTTPS enforcement.

### Why It Happens
Middleware blindly adds HSTS to every response without checking `$request->isSecure()`. Developers assume the header works on all connections.

### Warning Signs
- HSTS header present on HTTP responses (check with curl over HTTP)
- No `isSecure()` check in HSTS middleware code
- Development environment receives same HSTS header as production

### Why It Is Harmful
Browsers ignore HSTS received over HTTP because an active attacker could inject the header on the unencrypted connection. The header adds payload size without providing any protection.

### Real-World Consequences
Users on first visit over HTTP are not upgraded to HTTPS. An attacker performing SSL stripping intercepts the initial connection and the user never receives the HSTS instruction.

### Preferred Alternative
Only send HSTS when `$request->isSecure()` returns true. Configure `TrustProxies` middleware first if HTTPS is terminated at a reverse proxy.

### Refactoring Strategy
1. Add `if ($request->isSecure())` guard around HSTS header
2. Configure TrustProxies to correctly report HTTPS behind load balancers
3. Test with curl over both HTTP and HTTPS to verify conditional behavior
4. Set environment-specific HSTS max-age values

### Detection Checklist
- [ ] Verify `isSecure()` check exists in HSTS middleware code
- [ ] Test HSTS header presence over HTTP (should be absent)
- [ ] Test HSTS header presence over HTTPS (should be present)

### Related Rules
- Always Send Strict-Transport-Security Over HTTPS Only (05-rules.md)

### Related Skills
- Implement API Security Headers (06-skills.md)

### Related Decision Trees
- HSTS Gradual Rollout Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Overly Permissive CSP for JSON APIs

### Category
Security

### Description
Setting `Content-Security-Policy: default-src 'self'` for JSON API responses instead of `default-src 'none'`, allowing unnecessary resource loading that adds no value for non-HTML content.

### Why It Happens
Developers use a single CSP policy across web and API routes without considering that JSON responses are not rendered as HTML. "Self" seems like a reasonable restriction.

### Warning Signs
- Same CSP header on web routes and API routes
- `default-src 'self'` on API responses
- CSP includes script-src, style-src directives for JSON-only endpoints

### Why It Is Harmful
A permissive CSP for JSON APIs is unnecessary and potentially dangerous — if a JSON response is interpreted as HTML (via MIME sniffing), permissive CSP allows injected scripts to execute. `default-src 'none'` prevents this entirely.

### Real-World Consequences
If a JSON endpoint returns user-controlled data and a browser renders it as HTML due to missing `X-Content-Type-Options`, permissive CSP allows injected scripts to execute. CSP `'none'` blocks all resource loading.

### Preferred Alternative
Set `default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests` for all JSON API responses.

### Refactoring Strategy
1. Create separate CSP policy for API routes vs web routes
2. Use `default-src 'none'` for API middleware group
3. Remove unnecessary directives (script-src, style-src) from API CSP
4. Add `upgrade-insecure-requests` directive

### Detection Checklist
- [ ] Check CSP directive for `default-src 'none'` on API routes
- [ ] Verify no script-src or style-src on JSON-only endpoints
- [ ] Test with CSP evaluator tool

### Related Rules
- Restrict CSP to default-src 'none' for JSON APIs (05-rules.md)

### Related Skills
- Implement API Security Headers (06-skills.md)

### Related Decision Trees
- CSP Strictness for JSON APIs vs HTML-Rendering Endpoints (07-decision-trees.md)

---

## Anti-Pattern 4: Missing Cache-Control on Authenticated Routes

### Category
Security

### Description
Omitting `Cache-Control: no-store, private` on authenticated API responses, allowing shared proxies and CDNs to cache user-specific data and serve it to other users.

### Why It Happens
Developers focus on authentication and authorization but forget caching behavior. Since APIs commonly return JSON, caching implications are less obvious than for HTML pages.

### Warning Signs
- No `Cache-Control` header on authenticated API responses
- `Cache-Control: public` on responses containing user data
- CDN or proxy configuration allows caching of authenticated endpoints
- User data appears in responses for different authenticated users

### Why It Is Harmful
Shared proxies and CDNs treat responses without explicit Cache-Control as potentially cacheable. Authenticated responses containing user-specific data (profile info, financial data) can be served to other users from the cache.

### Real-World Consequences
User A's dashboard data is cached by a shared proxy and served to User B. Personal information, financial data, or API tokens are leaked across user boundaries. This violates GDPR, CCPA, and SOC 2 privacy requirements.

### Preferred Alternative
Set `Cache-Control: no-store, private` on all authenticated API responses. Use `Cache-Control: public, max-age=60` only for explicitly public, non-sensitive endpoints.

### Refactoring Strategy
1. Add Cache-Control header to security middleware for all responses
2. Create route-specific overrides for public endpoints
3. Review all authenticated routes for missing Cache-Control
4. Add automated test that asserts Cache-Control on authenticated routes
5. Audit CDN/proxy configuration to respect Cache-Control directives

### Detection Checklist
- [ ] Check all authenticated route responses for Cache-Control header
- [ ] Verify no `public` cache directive on authenticated routes
- [ ] Review CDN caching rules for authenticated path patterns

### Related Rules
- Set Cache-Control: no-store, private on Authenticated Routes (05-rules.md)

### Related Skills
- Implement API Security Headers (06-skills.md)

### Related Decision Trees
- Cache-Control Policy per Route Type (07-decision-trees.md)

---

## Anti-Pattern 5: Scattered Security Headers Across Controllers

### Category
Code Organization

### Description
Setting individual security headers in individual controller methods instead of consolidating them into a single dedicated middleware class, leading to inconsistent coverage and maintenance burden.

### Why It Happens
Developers add headers reactively as security issues are discovered. Each controller sets only the headers relevant to its endpoint. No centralized approach is established.

### Warning Signs
- `->header('X-Content-Type-Options', 'nosniff')` appears in multiple controllers
- Some responses missing security headers
- Adding a new header requires touching every controller
- Header configuration spread across controllers and middleware

### Why It Is Harmful
Inconsistent header coverage means some endpoints lack protection. Adding, modifying, or removing a header requires changes across many files. Code review cannot easily verify complete coverage. Security posture depends on every developer remembering to add headers.

### Real-World Consequences
A new controller added by a junior developer omits security headers. The error endpoint might lack `Cache-Control` and serve authenticated data from cache. Penetration test finds missing headers, requiring a sprint to consolidate.

### Preferred Alternative
Consolidate all security headers into a single `SecurityHeadersMiddleware` class registered in the API middleware group. Set headers after the response is built but before it's sent.

### Refactoring Strategy
1. Create `SecurityHeadersMiddleware` with all required headers
2. Register it in the API middleware group
3. Remove all `->header()` calls from individual controllers
4. Test that all API responses include the complete header set
5. Add CI check that verifies security headers on a sample endpoint

### Detection Checklist
- [ ] Search for `->header(` calls in controller files
- [ ] Verify single middleware class handles all security headers
- [ ] Check middleware is applied to API route group

### Related Rules
- Use a Single Dedicated Middleware for All Security Headers (05-rules.md)

### Related Skills
- Implement API Security Headers (06-skills.md)

### Related Decision Trees
- Middleware-Level vs Reverse-Proxy-Level Header Injection (07-decision-trees.md)

---
