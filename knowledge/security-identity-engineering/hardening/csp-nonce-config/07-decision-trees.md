# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** CSP Nonce/Script-Src/Style-Src Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Nonce vs Hash vs Unsafe-Inline | Allowlisting strategy for inline scripts | security, architectural |
| 2 | CSP Enforce Mode vs Report-Only Mode | CSP deployment strategy | security, operational |
| 3 | Nonce Sharing Mechanism | How to pass nonce to views and directives | architectural |

---

# Architecture-Level Decision Trees

---

## Nonce vs Hash vs Unsafe-Inline

---

## Decision Context

Choosing the CSP allowlisting strategy for inline scripts and styles — per-request nonces, static hashes, or `'unsafe-inline'`.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Are inline scripts dynamically generated per request (framework-injected, Livewire, Alpine)?
↓
YES → Nonces required (dynamic content cannot use static hashes)
NO → Are inline scripts static (same on every request)?
    YES → Hashes acceptable (more performant, no per-request token)
    NO → Nonces (default for mixed static/dynamic)

Is `'unsafe-inline'` currently configured?
↓
YES → Migrate to nonces (unsafe-inline bypasses all CSP script protection)
NO → Nonces or hashes from the start

Is the application using Vite, Livewire, or Alpine.js?
↓
YES → Nonces recommended (these frameworks inject dynamic inline scripts)
NO → Evaluate hash-based approach for purely static inline scripts

How many inline scripts exist?
↓
Few static scripts → Hashes (avoid per-request nonce generation)
Many dynamic scripts → Nonces (hashes impractical per script)
Mixed → Nonces (single approach for all scripts)

---

## Rationale

Nonces provide the strongest protection for dynamically generated inline scripts because they are per-request random tokens. Hashes work for static inline scripts but cannot handle dynamic content. `'unsafe-inline'` completely disables CSP script protection and should never be used. Most Laravel applications have some dynamic inline scripts (Livewire, Alpine, Vite), making nonces the best default.

---

## Recommended Default

**Default:** Nonces for most applications (support dynamic inline scripts); hashes for static inline scripts only (rare in Laravel apps)
**Reason:** Modern Laravel applications use Livewire, Alpine, or Vite — all inject dynamic inline scripts requiring nonces. Static hashes are only viable for apps with zero dynamic inline content. `'unsafe-inline'` is never acceptable in production.

---

## Risks Of Wrong Choice

- `'unsafe-inline'`: allows all inline scripts, no CSP XSS protection
- Hashes with dynamic scripts: blocks all dynamic inline content
- Nonces without `strict-dynamic`: blocks dynamically loaded scripts from nonced scripts
- No nonces/hashes at all: `default-src 'self'` blocks all inline scripts (app breaks)

---

## Related Rules

- Generate a Fresh Nonce Per Request (05-rules.md)
- Never Use `'unsafe-inline'` as Nonce Fallback (05-rules.md)
- Include Both Nonce and `strict-dynamic` for Complex Apps (05-rules.md)

---

## Related Skills

- Configure CSP Nonces for Inline Script and Style Allowlisting (06-skills.md)

---

## CSP Enforce Mode vs Report-Only Mode

---

## Decision Context

Whether to set CSP in enforce mode (`Content-Security-Policy`) or report-only mode (`Content-Security-Policy-Report-Only`) when deploying or updating a CSP policy.

---

## Decision Criteria

* security
* operational

---

## Decision Tree

Is this the initial CSP deployment or a major policy change?
↓
YES → Start with Report-Only mode for monitoring
NO → Has the Report-Only mode been running without violations?
    YES → Switch to enforce mode
    NO → Investigate violations before enforcing

Is there a CSP reporting endpoint configured?
↓
YES → Report-Only or enforce with reporting
NO → Configure reporting endpoint first (critical for both modes)

Are there known inline scripts that would be blocked?
↓
YES → Add nonces/hashes first, then consider enforce mode
NO → Can proceed to enforce mode

What is the risk tolerance for broken functionality?
↓
Low (production user-facing app) → Report-Only (minimum 2-4 weeks)
Medium → Report-Only (minimum 1 week)
High (internal tool, low traffic) → Can enforce directly after testing

---

## Rationale

Report-Only mode logs violations without blocking content, allowing teams to identify and fix all CSP issues before enforcement. This prevents production incidents where CSP blocks legitimate functionality. The transition to enforce mode should happen only after the violation log is clean or all known violations are addressed.

---

## Recommended Default

**Default:** Start with Report-Only for at least 2 weeks, review violations, then switch to enforce mode
**Reason:** CSP enforcement can break JavaScript functionality silently (no visible errors to users). Report-Only mode gives a safety window to identify and fix all issues. Two weeks covers most user interaction patterns.

---

## Risks Of Wrong Choice

- Direct enforce mode: CSP blocks legitimate scripts, broken functionality
- Never enforcing (staying Report-Only): CSP provides no actual protection
- No reporting endpoint: cannot monitor violations in either mode
- Short Report-Only window (days): may miss edge-case violations

---

## Related Rules

- Generate a Fresh Nonce Per Request (05-rules.md)
- Add Nonce to Every Inline Script and Style Tag (05-rules.md)

---

## Related Skills

- Configure CSP Nonces for Inline Script and Style Allowlisting (06-skills.md)

---

## Nonce Sharing Mechanism

---

## Decision Context

How to generate and share the CSP nonce across the application — middleware, View::share, request attributes.

---

## Decision Criteria

* architectural

---

## Decision Tree

Does the application use `spatie/laravel-csp`?
↓
YES → Use package's built-in nonce generation and view sharing
NO → Does the application use Vite?
    YES → Generate nonce in middleware, pass to Vite via `useNonce()` method
    NO → Manual nonce generation in middleware

Where should the nonce be generated?
↓
Middleware (recommended) → Single point, shared via `View::share()` or request attribute
Base controller → Works but requires inheritance (all controllers must extend)
Blade service provider → Works if nonce is simple

How is the nonce passed to views?
↓
`View::share('nonce', $nonce)` → Available in all views automatically
`$request->attributes->set('csp_nonce', $nonce)` → Available in controllers, passed to views manually
Both → Middleware uses View::share + nonce attached to response headers

Should nonce be accessible in controllers for API JSON?
↓
YES → Use `$request->attributes->get('csp_nonce')` (View::share only works for views)
NO → `View::share()` is sufficient

---

## Rationale

Middleware provides a single location for nonce generation, ensuring every request has a nonce. `View::share()` makes it available in all Blade views without manual passing. For non-HTTP contexts (API JSON responses), the nonce may not be needed — but if controllers need access, request attributes are better than `View::share()`.

---

## Recommended Default

**Default:** Middleware generates nonce, shares via `View::share()` for Blade views, and sets it in `$request->attributes` for controller access
**Reason:** Middleware is the earliest hook in the request lifecycle. `View::share()` automatically provides the nonce to all views. Request attributes provide controller access for response header setting and API contexts.

---

## Risks Of Wrong Choice

- Nonce generated in partials/views: multiple nonces per page, inconsistent
- Nonce not shared to layout: layout cannot access nonce for scripts
- Nonce in cached views: stale nonce, scripts blocked or insecure
- No middleware: nonce generation scattered across controllers

---

## Related Rules

- Store Nonce in View Data for Reuse Across Layout/Partials (05-rules.md)
- Include Nonce in All CSP Directives, Not Just script-src (05-rules.md)

---

## Related Skills

- Configure CSP Nonces for Inline Script and Style Allowlisting (06-skills.md)
