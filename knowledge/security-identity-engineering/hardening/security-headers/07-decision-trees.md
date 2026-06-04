# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** Security Headers (HSTS, CSP, XFO, etc.)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | CSP: Report-Only vs Enforced Mode | CSP deployment strategy | security, reliability |
| 2 | CSP: Nonce vs Hash vs Host-Based | Inline script/style allowance strategy | security, maintainability |
| 3 | HSTS max-age and Preload Decision | HSTS configuration strategy | security, reliability |

---

# Architecture-Level Decision Trees

---

## CSP: Report-Only vs Enforced Mode

---

## Decision Context

Whether to deploy CSP in Content-Security-Policy-Report-Only mode (monitor only) or Content-Security-Policy mode (enforced blocking).

---

## Decision Criteria

* security
* reliability

---

## Decision Tree

Is this the first CSP deployment?
↓
YES → Report-Only mode (monitor violations, fix legitimate resource loading, then enforce)
NO → Have all CSP violations been reviewed and resolved?
    YES → Enforced mode (block violations)
    NO → Continue Report-Only until violations resolved

Is the application mission-critical with no tolerance for breakage?
↓
YES → Report-Only mode extended (thorough testing before enforcement)
NO → Standard enforcement timeline after violation review

Does the application use many third-party resources (analytics, CDNs, embeds)?
↓
YES → Report-Only mode recommended (third-party changes may violate CSP unexpectedly)
NO → Faster transition to enforced mode

---

## Rationale

Report-Only mode allows monitoring CSP violations without blocking legitimate resources. This is critical during initial deployment — CSP can break third-party integrations, analytics, embeds, and CDN-loaded resources. After monitoring violations and updating the policy, switch to enforced mode. Report-Only is not a security measure — it only monitors.

---

## Recommended Default

**Default:** Start with Report-Only mode; monitor for 2-4 weeks; graduate to enforced after all violations resolved
**Reason:** CSP can silently break application functionality. Report-Only provides visibility into what would be blocked without affecting users. A 2-4 week monitoring period captures typical usage patterns.

---

## Risks Of Wrong Choice

- Enforced without testing: CSP blocks legitimate scripts, styles, images — site functionality breaks
- Report-Only indefinitely: no actual XSS protection, false sense of security
- No CSP at all: no defense-in-depth against XSS
- CSP with `'unsafe-inline'`: defeats CSP's XSS protection

---

## Related Rules

- Set Content-Security-Policy to Mitigate XSS (05-rules.md)
- Set X-Frame-Options: DENY (or SAMEORIGIN) (05-rules.md)
- Set X-Content-Type-Options: nosniff (05-rules.md)

---

## Related Skills

- Configure Security Headers Middleware for Browser-Level Protection (06-skills.md)

---

## CSP: Nonce vs Hash vs Host-Based

---

## Decision Context

How to allow legitimate inline scripts/styles in CSP — using nonces (per-request random values), hashes (static content fingerprints), or host-based allowlisting.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Are inline scripts dynamically generated (different on each request)?
↓
YES → Nonce-based CSP (generate random nonce per request, apply to script tags)
NO → Are inline scripts static (identical on every request)?
    YES → Hash-based CSP (SHA hash of the script content)
    NO → Host-based CSP (allow specific external domains)

Is the application using a framework that supports nonce injection (Livewire, Alpine)?
↓
YES → Nonce-based CSP (framework handles nonce attachment)
NO → Host-based CSP may be simpler (specific allowed origins)

Do you need `'strict-dynamic'` for CDN-loaded scripts to load sub-resources?
↓
YES → Nonce + `'strict-dynamic'` (modern CSP approach)
NO → Hash or host-based sufficient

---

## Rationale

Nonces provide the best security for dynamic inline scripts — each request gets a unique nonce, and only scripts with the nonce attribute execute. Hashes work for static scripts but require updating when script content changes. Host-based CSP is simplest but least secure (allows any script from the domain). `'strict-dynamic'` enables nonced scripts to load sub-resources.

---

## Recommended Default

**Default:** Nonce-based CSP with `'strict-dynamic'` for applications with dynamic inline scripts; hash-based for static templates
**Reason:** Nonces provide strong security for dynamic content. `'strict-dynamic'` allows legitimate script loading patterns. Hash-based is simpler for applications with purely static inline scripts. Host-based CSP should be a last resort.

---

## Risks Of Wrong Choice

- `'unsafe-inline'`: completely defeats CSP XSS protection
- Nonces without `'strict-dynamic'`: CDN-loaded scripts cannot load sub-resources
- Hashes for dynamic content: hashes never match, scripts blocked
- Host-based for everything: any script from allowed domain executes, weak protection

---

## Related Rules

- Set Content-Security-Policy to Mitigate XSS (05-rules.md)
- Set X-Content-Type-Options: nosniff (05-rules.md)

---

## Related Skills

- Configure Security Headers Middleware for Browser-Level Protection (06-skills.md)
- Configure CSP Nonce/Script-Src (06-skills.md)

---

## HSTS max-age and Preload Decision

---

## Decision Context

Configuring HSTS `max-age` value and whether to submit to the browser preload list.

---

## Decision Criteria

* security
* reliability

---

## Decision Tree

Is this a production HTTPS-only application?
↓
YES → Start with short `max-age` (e.g., 1 day = 86400) during testing
NO → HSTS not applicable for HTTP-only or dev environments

Has the application been tested with HSTS for at least 1 week without issues?
↓
YES → Increase to `max-age=31536000` (1 year) for production
NO → Continue with short `max-age` until proven stable

Do all subdomains support HTTPS?
↓
YES → Include `includeSubDomains`
NO → Omit `includeSubDomains` (or fix subdomains first)

Is the domain ready for permanent HTTPS enforcement?
↓
YES → Add `preload` and submit to hstspreload.org
NO → Omit `preload` (preload cannot be easily reversed)

---

## Rationale

HSTS tells browsers to always use HTTPS. `max-age=31536000` (1 year) is the minimum for preload eligibility. Start with a short `max-age` during rollout to limit damage if HTTPS configuration is incomplete. `includeSubDomains` extends protection to all subdomains — only enable if all subdomains support HTTPS. `preload` is permanent — once submitted, removing a domain from preload lists is difficult.

---

## Recommended Default

**Default:** `Strict-Transport-Security: max-age=31536000; includeSubDomains` for production sites; add `preload` only when certain all subdomains are HTTPS-ready
**Reason:** 1-year max-age provides long-term protection. `includeSubDomains` covers all subdomains. `preload` should be a deliberate decision due to the difficulty of reversal.

---

## Risks Of Wrong Choice

- `max-age` too short (minutes/hours): no meaningful HSTS protection
- `includeSubDomains` with HTTP-only subdomain: those subdomains become inaccessible
- `preload` without testing: if HTTP is needed for any subdomain, it's blocked permanently
- No HSTS at all: SSL-stripping attacks possible

---

## Related Rules

- Set Strict-Transport-Security (HSTS) in Production (05-rules.md)
- Set X-Frame-Options: DENY (or SAMEORIGIN) (05-rules.md)

---

## Related Skills

- Configure Security Headers Middleware for Browser-Level Protection (06-skills.md)
