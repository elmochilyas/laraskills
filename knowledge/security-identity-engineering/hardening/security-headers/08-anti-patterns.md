# Anti-Patterns: Security Headers (HSTS, CSP, XFO, etc.)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | Security Headers (HSTS, CSP, XFO, etc.) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-SH-01 | No Security Headers at All | High | High | Low |
| AP-SH-02 | HSTS With Short max-age | Medium | Medium | Low |
| AP-SH-03 | CSP Without Reporting | Medium | High | Low |
| AP-SH-04 | Headers in Controllers, Not Middleware | Medium | High | Medium |
| AP-SH-05 | Both X-Frame-Options and CSP frame-ancestors | Low | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **No Security Headers Middleware**: Headers configured ad-hoc per response
- **X-Powered-By Exposed**: PHP version visible in responses
- **CSP Enforced Without Report-Only Testing**: Production broken by CSP

---

## 1. No Security Headers at All

### Category
Security · High

### Description
Application does not set any security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

### Why It Happens
Security headers are not visible in the application interface. They work silently in the browser. Developers may not know about them, consider them optional, or plan to add them "later."

### Warning Signs
- `curl -I https://app.example.com` shows no security headers
- Security scanner reports missing headers
- No `SecurityHeadersMiddleware` class exists
- No CSP, HSTS, XFO, or Referrer-Policy in HTTP responses
- Browser dev tools show no security headers

### Why Harmful
Without security headers, the application has no browser-level defense. Pages can be embedded in iframes (clickjacking). MIME sniffing can execute malicious files as scripts. No HSTS means SSL stripping attacks are possible. No CSP means XSS has no secondary defense.

### Real-World Consequences
- Clickjacking attack on login page — credentials stolen
- SSL stripping: attacker downgrades HTTPS to HTTP
- MIME sniffing attack: uploaded SVG executed as script
- XSS vulnerability exploited because no CSP fallback

### Preferred Alternative
Implement a global middleware that sets all security headers on every response.

### Refactoring Strategy
1. Create `SecurityHeadersMiddleware`
2. Add HSTS, CSP, XFO, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
3. Register middleware globally in HTTP kernel

### Detection Checklist
- [ ] Are security headers present in all responses?
- [ ] Is there a global middleware for security headers?
- [ ] Does `curl -I` show HSTS, CSP, XFO, etc.?
- [ ] Has a security scanner been run?
- [ ] Are headers consistent across all routes?

### Related Rules/Skills/Trees
- Apply Headers in Middleware, Not in Individual Controllers (05-rules.md)
- Configure Security Headers Middleware for Browser-Level Protection (06-skills.md)

---

## 2. HSTS With Short max-age

### Category
Security · Medium

### Description
Setting `Strict-Transport-Security` with a short `max-age` (minutes or hours) that provides no meaningful long-term protection against SSL stripping.

### Why It Happens
Developers use short `max-age` values during testing and never increase them for production. Short durations are convenient for testing but defeat HSTS's purpose.

### Warning Signs
- `max-age` less than 31536000 (1 year)
- `max-age` set to 300, 3600, or 86400 in production
- No plan to increase `max-age` over time
- HSTS preload not considered

### Why Harmful
HSTS tells the browser "only connect via HTTPS for this duration." A `max-age` of 1 hour means the browser only remembers HTTPS enforcement for 1 hour. After that, the connection can be downgraded to HTTP. The protection is temporary.

### Real-World Consequences
- SSL stripping attack possible 1 hour after first HTTPS visit
- Users visiting the site after browser restart may connect via HTTP
- Preload list submission denied (requires 1 year max-age)

### Preferred Alternative
Set `max-age=31536000` (1 year) in production.

### Refactoring Strategy
1. Start with `max-age=86400` (1 day) during rollout
2. After 1 week with no issues, increase to 31536000 (1 year)
3. Consider adding `preload` for permanent protection

### Detection Checklist
- [ ] Is `max-age` ≥ 31536000 in production?
- [ ] Is there a plan to increase `max-age` over time?
- [ ] Can a user connect via HTTP after HSTS expires?
- [ ] Is HSTS preload being considered?
- [ ] Is `includeSubDomains` configured?

### Related Rules/Skills/Trees
- Set Strict-Transport-Security (HSTS) in Production (05-rules.md)
- Configure Security Headers Middleware for Browser-Level Protection (06-skills.md)
- HSTS max-age and Preload Decision decision tree (07-decision-trees.md)

---

## 3. CSP Without Reporting

### Category
Security · Medium

### Description
Configuring Content-Security-Policy without a reporting endpoint, so CSP violations go undetected.

### Why It Happens
Developers set CSP headers but forget to add `report-uri` or `report-to`. CSP works silently — violations block resources without any visible feedback. Without reporting, developers don't know if CSP is breaking legitimate functionality.

### Warning Signs
- CSP header without `report-uri` or `report-to` directive
- No CSP reporting endpoint endpoint configured
- No monitoring of CSP violations
- CSP deployed without any feedback mechanism

### Why Harmful
If CSP blocks legitimate scripts, styles, or resources, the page breaks silently. Users may see a broken page without console errors. Service desk tickets may not mention the real cause. Violations from potential XSS attacks also go undetected.

### Real-World Consequences
- CSP blocks analytics script — no one notices for weeks
- CSP blocks legitimate inline script — page feature broken but unreported
- XSS attack attempt not detected because CSP violations aren't monitored
- CSP policy refinement is guesswork without violation reports

### Preferred Alternative
Configure a CSP reporting endpoint (`report-uri` or `report-to`) to collect violations.

### Refactoring Strategy
1. Add `report-uri /csp-report` to the CSP header
2. Create the reporting endpoint
3. Set up monitoring/alerting on CSP violations
4. Review reports regularly to refine CSP policy

### Detection Checklist
- [ ] Does CSP include `report-uri` or `report-to`?
- [ ] Is there a CSP reporting endpoint?
- [ ] Are CSP violations monitored?
- [ ] Can the team see when CSP blocks resources?
- [ ] Is there an alert on CSP violation spikes?

### Related Rules/Skills/Trees
- Set Content-Security-Policy to Mitigate XSS (05-rules.md)
- Configure Security Headers Middleware for Browser-Level Protection (06-skills.md)
- CSP: Report-Only vs Enforced Mode decision tree (07-decision-trees.md)

---

## 4. Headers in Controllers, Not Middleware

### Category
Architecture · Medium

### Description
Setting security headers in individual controller methods instead of a global middleware, leaving many routes unprotected.

### Why It Happens
Developers add headers in the controller for the specific page they're working on. The headers are only set on that route. Other routes — including new ones added later — are not covered.

### Warning Signs
- `response()->header('X-Frame-Options', 'DENY')` in controller methods
- Some routes have security headers, others don't
- No global `SecurityHeadersMiddleware`
- Headers duplicated across multiple controllers
- New routes created without security headers

### Why Harmful
Security headers must be present on every response. Controller-level application inevitably misses some routes. Each gap is a potential attack vector.

### Real-World Consequences
- Admin panel routes have headers, public routes don't — inconsistent protection
- New feature added without headers — clickjacking possible on that page
- Security scan shows inconsistent header coverage

### Preferred Alternative
Set headers in global middleware applied to all routes.

### Refactoring Strategy
1. Create `SecurityHeadersMiddleware`
2. Move header logic from controllers to middleware
3. Register middleware globally
4. Remove header-setting code from controllers

### Detection Checklist
- [ ] Are headers set in middleware or controllers?
- [ ] Are headers present on every response?
- [ ] Is there a single source of truth for header configuration?
- [ ] Could a new route be created without headers?
- [ ] Are headers duplicated across controllers?

### Related Rules/Skills/Trees
- Apply Headers in Middleware, Not in Individual Controllers (05-rules.md)
- Configure Security Headers Middleware for Browser-Level Protection (06-skills.md)

---

## 5. Both X-Frame-Options and CSP frame-ancestors

### Category
Configuration · Low

### Description
Setting both `X-Frame-Options` and CSP `frame-ancestors` to control clickjacking, with the CSP directive being ignored in favor of XFO in some browsers.

### Why It Happens
Developers add both for redundancy. However, CSP's `frame-ancestors` supersedes `X-Frame-Options` in modern browsers. Having both causes confusion about which one is effective.

### Warning Signs
- Both `X-Frame-Options: DENY` and `frame-ancestors 'none'` configured
- Two clickjacking protections in place
- CSP `frame-ancestors` contradicts `X-Frame-Options` (e.g., XFO says DENY, CSP allows specific origins)
- Mixed configuration: some routes set XFO, others set CSP frame-ancestors

### Why Harmful
If both are set and CSP `frame-ancestors` allows a specific origin while `X-Frame-Options` is `DENY`, the `X-Frame-Options` takes precedence in older browsers and blocks all framing. In modern browsers, CSP supersedes XFO. The inconsistency creates confusion.

### Real-World Consequences
- Iframe embed not working for legitimate embed partner despite CSP allowing it
- False sense of security: CSP allows embedding but XFO blocks it
- Different behavior across browser versions

### Preferred Alternative
Use CSP `frame-ancestors` (more flexible, supersedes XFO in modern browsers). Drop `X-Frame-Options` if CSP is already configured.

### Refactoring Strategy
1. Choose one mechanism: CSP `frame-ancestors` (modern, flexible) or `X-Frame-Options` (simpler)
2. Remove the redundant header
3. Test embed behavior across browsers

### Detection Checklist
- [ ] Are both XFO and CSP `frame-ancestors` configured?
- [ ] Do they agree on clickjacking policy?
- [ ] Which mechanism is intended to be the primary?
- [ ] Have embed requirements been validated?

### Related Rules/Skills/Trees
- Set X-Frame-Options: DENY (or SAMEORIGIN) (05-rules.md)
- Configure Security Headers Middleware for Browser-Level Protection (06-skills.md)
