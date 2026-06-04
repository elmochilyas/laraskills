# Decomposition: Sanctum SPA Cookie Auth

## Topic Overview
Sanctum's SPA cookie authentication enables API authentication for single-page applications using Laravel's session cookies and CSRF protection instead of tokens. The SPA communicates with the Laravel backend on the same or subdomain, avoids token storage in browser-accessible locations, and relies on HTTP-only session cookies for authentication. This approach is simpler and more secure than token-based auth for first-party SPAs because cookies are automatically sent with requests and protected against XSS by the HTTP-only flag.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
sanctum-spa-cookie-auth/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Sanctum SPA Cookie Auth
- **Purpose:** Sanctum's SPA cookie authentication enables API authentication for single-page applications using Laravel's session cookies and CSRF protection instead of tokens. The SPA communicates with the Laravel backend on the same or subdomain, avoids token storage in browser-accessible locations, and relies on HTTP-only session cookies for authentication. This approach is simpler and more secure than token-based auth for first-party SPAs because cookies are automatically sent with requests and protected against XSS by the HTTP-only flag.
- **Difficulty:** Intermediate
- **Dependencies:** sanctum-vs-passport-decision, sanctum-token-auth, cors-configuration

## Dependency Graph
**Depends on:**
- sanctum-vs-passport-decision
- sanctum-token-auth
- cors-configuration

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Same-domain constraint
- Stateful guard
- CSRF protection
- Session driver

**Out of scope:**
- sanctum-vs-passport-decision topics covered in their respective KUs
- sanctum-token-auth topics covered in their respective KUs
- cors-configuration topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization