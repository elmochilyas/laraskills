# Security Headers

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** owasp-compliance
- **Knowledge Unit:** Security Headers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Security Headers are HTTP response headers that instruct browsers to enforce security policies, protecting Laravel applications from XSS, clickjacking, MIME-type sniffing, and data injection attacks. Properly configured security headers provide a critical layer of defense that complements application-level controls with minimal performance impact.

---

## Core Concepts

- **Content-Security-Policy (CSP)** controls which resources (scripts, styles, images) the browser is allowed to load
- **Strict-Transport-Security (HSTS)** forces HTTPS connections and prevents SSL stripping attacks
- **X-Frame-Options** prevents clickjacking by controlling whether the page can be embedded in frames
- **X-Content-Type-Options** prevents MIME-type sniffing attacks
- **Referrer-Policy** controls how much referrer information is sent with requests
- **Permissions-Policy** restricts browser API access (camera, microphone, geolocation)
- **Cross-Origin-* headers** (COOP, COEP, CORP) provide cross-origin isolation for security

---

## Mental Models

- **The VIP Guest List:** CSP is a VIP list at a club — only approved sources (guests) are allowed in. Everything else is turned away at the door (browser).
- **The Fortified Perimeter:** HSTS is a permanent lockdown order — once enforced, the fortress (website) never accepts unencrypted communication again.
- **The Embedding Ban:** X-Frame-Options is a "no photos" policy — your content cannot be placed in other people's frames (like not allowing photos in someone else's album).

---

## Internal Mechanics

Security headers are set by Laravel middleware that runs after the response is generated but before it's sent to the client. The middleware adds headers to the `Response` object's header bag. CSP headers require the most configuration — they specify allowed sources for each resource type. CSP can be used in report-only mode (`Content-Security-Policy-Report-Only`) where violations are reported but not blocked. HSTS includes a `max-age` directive (how long to enforce HTTPS) and optionally `includeSubDomains` and `preload`. The middleware can be global (all routes) or grouped.

---

## Patterns

**Global Security Header Middleware Pattern:** Apply security headers to all responses via a global middleware. Benefit: Consistent header application, no route misses. Tradeoff: All responses get headers even when not needed (API responses may not need X-Frame-Options).

**CSP Report-Only Rollout Pattern:** Deploy CSP in report-only mode first, collect violation reports, adjust policy, then switch to enforced mode. Benefit: Identifies breakage before enforcement. Tradeoff: Temporary window without CSP protection during rollout.

**Strict CSP Pattern:** Use nonce-based CSP for inline scripts (unique nonce per request) rather than hash-based or unsafe-inline. Benefit: Strongest XSS protection. Tradeoff: Requires server-side nonce generation and template updates.

---

## Architectural Decisions

Always include HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy headers globally. Implement CSP with report-only mode first, then enforce. Use nonce-based CSP for applications with dynamic inline scripts. Use hash-based CSP for applications with static inline scripts. Start with a restrictive CSP and add exceptions as needed. Set HSTS `max-age` to at least 1 year (31536000 seconds) for production.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| CSP blocks XSS and data injection | CSP configuration complexity and testing | Reduced XSS risk but blocked resources if misconfigured |
| HSTS prevents SSL stripping | Permanent HTTPS enforcement (can't downgrade) | Stronger HTTPS but longer HSTS max-age is hard to roll back |
| X-Frame-Options prevents clickjacking | Cannot embed content in legitimate frames | Security improvement but may break legitimate embedding use cases |
| Permissions-Policy limits API access | May break features that need browser APIs | Privacy improvement with potential feature breakage |

---

## Performance Considerations

Security headers add minimal response overhead (typically <1KB). CSP header size grows with the number of allowed origins — keep policies concise. CSP violation report generation creates browser network requests — configure `report-uri` endpoint to handle load. Nonce generation adds server-side processing per request — lightweight but ensure it's not a bottleneck. HSTS preload list submission requires domain verification but provides pre-built browser enforcement.

---

## Production Considerations

Use a CSP reporting endpoint to collect violation reports — monitor for attacks and configuration issues. Test security headers using online tools (securityheaders.com, CSP Evaluator). Verify headers in CI/CD pipeline — automated regression testing for header changes. Configure HSTS preload submission for maximum HTTPS enforcement. Monitor CSP violation reports for attack indicators (mass violations may indicate XSS probing). Set up alerting for CSP report endpoint errors.

---

## Common Mistakes

**Setting CSP to `default-src 'none'` without testing** — blocks all resources including legitimate ones. Start with report-only mode and iteratively adjust.

**Not including `includeSubDomains` with HSTS** — subdomains remain vulnerable to SSL stripping. Always include `includeSubDomains` for comprehensive protection.

**Overly permissive CSP (`script-src 'unsafe-inline'`)** — defeats CSP protection against XSS. Use nonces or hashes for inline scripts.

**Setting HSTS `max-age` too low** — shorter max-age reduces protection during the initial visit period. Set to minimum 1 year.

---

## Failure Modes

- **CSP violation blocking legitimate features:** User reports broken functionality. Check CSP reports and adjust policy.
- **HSTS misconfiguration:** Site becomes inaccessible over HTTP with no HTTPS fallback. Test HSTS configuration in staging first.
- **X-Frame-Options blocks legitimate embedding:** Partner sites can't embed content. Use CSP `frame-ancestors` for more granular control.
- **Missing security header after middleware change:** Header removed inadvertently. Include header verification in deployment tests.

---

## Ecosystem Usage

Laravel applications typically implement security headers via custom middleware or packages like `spatie/laravel-csp`. The `spatie/laravel-csp` package provides CSP configuration with nonce support, reporting, and environment-specific policies. Security header testing can be automated with Pest tests that assert response headers. Laravel Forge provides basic security header configuration for Nginx, but application-level headers provide more control.

---

## Related Knowledge Units

### Prerequisites
- HTTP Response Headers
- Web Security Concepts (XSS, clickjacking, MIME sniffing)
- Browser Security Policies

### Related Topics
- Laravel Security Hardening (broader context)
- OWASP Top 10 2025 (vulnerability context)
- CSP Configuration Deep Dive

### Advanced Follow-up Topics
- CSP Nonce and Hash Generation at Scale
- Cross-Origin Isolation (COOP/COEP) for Advanced Security
- Security Header Monitoring and Incident Response

---

## Research Notes

Security headers provide one of the highest-ROI security investments — they require minimal implementation effort and provide significant protection against common browser-level attacks. The CSP header is the most impactful but also the most complex to configure correctly. The report-only mode is essential for safe CSP deployment. HSTS preload submission is recommended for any production website — it ensures browsers always use HTTPS even on the first visit. The trend toward stricter browser security policies (COOP, COEP, Permissions-Policy) suggests that security header configuration will become increasingly important for maintaining browser compatibility while ensuring security.
