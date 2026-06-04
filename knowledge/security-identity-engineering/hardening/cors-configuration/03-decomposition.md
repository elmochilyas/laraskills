# Decomposition: cors configuration

## Topic Overview

CORS (Cross-Origin Resource Sharing) configuration in Laravel is managed via `config/cors.php` and the `HandleCors` middleware. It controls which origins, methods, and headers browsers permit for cross-origin requests. For Sanctum SPA authentication, `supports_credentials` must be `true` and `allowed_origins` must contain the exact SPA origin (not `*`). For public APIs, CORS can be permissive, but for cookie-based auth, CORS must be precisely configured — the most common cause of "phantom 4...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
cors-configuration/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### cors configuration
- **Purpose:** CORS (Cross-Origin Resource Sharing) configuration in Laravel is managed via `config/cors.php` and the `HandleCors` middleware. It controls which origins, methods, and headers browsers permit for cross-origin requests. For Sanctum SPA authentication, `supports_credentials` must be `true` and `allowed_origins` must contain the exact SPA origin (not `*`). For public APIs, CORS can be permissive, but for cookie-based auth, CORS must be precisely configured — the most common cause of "phantom 4...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: HTTP headers basics, Sanctum SPA cookie auth, Related: CSRF token exchange and validation (CSRF + CORS work together for SPA auth), Security headers (HSTS, CSP, XFO), Advanced Follow-up: CORS with multiple subdomains, Custom CORS origin resolver, and CORS for WebSocket (WSS) connections

## Dependency Graph
**Depends on:** Prerequisites: HTTP headers basics, Sanctum SPA cookie auth, Related: CSRF token exchange and validation (CSRF + CORS work together for SPA auth), Security headers (HSTS, CSP, XFO), Advanced Follow-up: CORS with multiple subdomains, Custom CORS origin resolver, and CORS for WebSocket (WSS) connections
**Depended on by:** Knowledge units that leverage or extend cors configuration patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for cors configuration.
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