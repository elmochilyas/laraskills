# Decomposition: csp nonce config

## Topic Overview

CSP (Content-Security-Policy) nonce configuration enables secure inline script and style execution by associating each request with a cryptographically random nonce value included in both the CSP header and the HTML attribute. `script-src 'nonce-{value}'` and `style-src 'nonce-{value}'` allow only inline scripts/styles that match the nonce, blocking injection-based XSS even if escaping fails. In Laravel, nonces are typically generated per-request and passed to Blade views via `CspNonce` middl...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
csp-nonce-config/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### csp nonce config
- **Purpose:** CSP (Content-Security-Policy) nonce configuration enables secure inline script and style execution by associating each request with a cryptographically random nonce value included in both the CSP header and the HTML attribute. `script-src 'nonce-{value}'` and `style-src 'nonce-{value}'` allow only inline scripts/styles that match the nonce, blocking injection-based XSS even if escaping fails. In Laravel, nonces are typically generated per-request and passed to Blade views via `CspNonce` middl...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Security headers (HSTS, CSP, XFO, etc.), Blade auto-escaping (CSP as secondary defense), Related: Livewire CSP configuration, Inertia CSP configuration, Advanced Follow-up: strict-dynamic deep dive, Nonce-based hash fallback for CSP Level 2 browsers, and Automated CSP violation monitoring and alerting

## Dependency Graph
**Depends on:** Prerequisites: Security headers (HSTS, CSP, XFO, etc.), Blade auto-escaping (CSP as secondary defense), Related: Livewire CSP configuration, Inertia CSP configuration, Advanced Follow-up: strict-dynamic deep dive, Nonce-based hash fallback for CSP Level 2 browsers, and Automated CSP violation monitoring and alerting
**Depended on by:** Knowledge units that leverage or extend csp nonce config patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for csp nonce config.
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