# Decomposition: security headers

## Topic Overview

Security headers are HTTP response headers that instruct browsers to enforce security policies: HSTS enforces HTTPS, CSP controls which resources can load, X-Frame-Options prevents clickjacking, X-Content-Type-Options prevents MIME sniffing, Referrer-Policy controls referrer information, and Permissions-Policy restricts browser API access. In Laravel, these are typically implemented as global middleware added via `bootstrap/app.php` or a dedicated middleware class. The recommended approach is...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
security-headers/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### security headers
- **Purpose:** Security headers are HTTP response headers that instruct browsers to enforce security policies: HSTS enforces HTTPS, CSP controls which resources can load, X-Frame-Options prevents clickjacking, X-Content-Type-Options prevents MIME sniffing, Referrer-Policy controls referrer information, and Permissions-Policy restricts browser API access. In Laravel, these are typically implemented as global middleware added via `bootstrap/app.php` or a dedicated middleware class. The recommended approach is...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Middleware pipeline, Blade auto-escaping and XSS prevention, Related: CSP nonce/script-src/style-src configuration, CORS configuration for cross-origin requests, Advanced Follow-up: CSP Level 3 strict-dynamic, HSTS preload submission process, and Security headers audit with Mozilla Observatory

## Dependency Graph
**Depends on:** Prerequisites: Middleware pipeline, Blade auto-escaping and XSS prevention, Related: CSP nonce/script-src/style-src configuration, CORS configuration for cross-origin requests, Advanced Follow-up: CSP Level 3 strict-dynamic, HSTS preload submission process, and Security headers audit with Mozilla Observatory
**Depended on by:** Knowledge units that leverage or extend security headers patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for security headers.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization