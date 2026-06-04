# Decomposition: sanctum spa vs token

## Topic Overview

Laravel Sanctum provides two distinct authentication mechanisms within a single package: cookie-based session authentication for first-party SPAs (same domain/subdomain) and Bearer token authentication for third-party clients (mobile apps, APIs, CLI tools). The `sanctum` guard automatically resolves which mechanism to use based on the request origin — checking stateful domains first, falling back to token auth. These mechanisms differ fundamentally in how credentials are stored, how CSRF is...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
sanctum-spa-vs-token/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### sanctum spa vs token
- **Purpose:** Laravel Sanctum provides two distinct authentication mechanisms within a single package: cookie-based session authentication for first-party SPAs (same domain/subdomain) and Bearer token authentication for third-party clients (mobile apps, APIs, CLI tools). The `sanctum` guard automatically resolves which mechanism to use based on the request origin — checking stateful domains first, falling back to token auth. These mechanisms differ fundamentally in how credentials are stored, how CSRF is...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Auth guards/providers architecture, Session configuration, CORS configuration, Related: Sanctum ability-based token scoping, CSRF token exchange and validation, Fortify headless auth backend, Advanced Follow-up: Sanctum performance at scale (token table indexing, caching), Sanctum + Passport dual-guard patterns, and Token rotation and refresh token architecture

## Dependency Graph
**Depends on:** Prerequisites: Auth guards/providers architecture, Session configuration, CORS configuration, Related: Sanctum ability-based token scoping, CSRF token exchange and validation, Fortify headless auth backend, Advanced Follow-up: Sanctum performance at scale (token table indexing, caching), Sanctum + Passport dual-guard patterns, and Token rotation and refresh token architecture
**Depended on by:** Knowledge units that leverage or extend sanctum spa vs token patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for sanctum spa vs token.
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