# Decomposition: CORS Configuration

## Topic Overview
Cross-Origin Resource Sharing (CORS) is a browser security mechanism that controls which origins, methods, and headers are allowed when a web application on one domain makes requests to a different domain. For Laravel APIs, CORS configuration via `config/cors.php` (Laravel 9/10) or `config/cors.php` (Laravel 11+) defines the allowed origins, HTTP methods, headers, and whether credentials (cookies) can be included. Improper CORS configuration leads to blocked browser requests or security vulnerabilities.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
cors-configuration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### CORS Configuration
- **Purpose:** Cross-Origin Resource Sharing (CORS) is a browser security mechanism that controls which origins, methods, and headers are allowed when a web application on one domain makes requests to a different domain. For Laravel APIs, CORS configuration via `config/cors.php` (Laravel 9/10) or `config/cors.php` (Laravel 11+) defines the allowed origins, HTTP methods, headers, and whether credentials (cookies) can be included. Improper CORS configuration leads to blocked browser requests or security vulnerabilities.
- **Difficulty:** Intermediate
- **Dependencies:** sanctum-spa-cookie-auth, api-security-headers

## Dependency Graph
**Depends on:**
- sanctum-spa-cookie-auth
- api-security-headers

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Origin
- Preflight request
- Simple request
- Allowed origins
- Allowed headers
- Exposed headers

**Out of scope:**
- sanctum-spa-cookie-auth topics covered in their respective KUs
- api-security-headers topics covered in their respective KUs

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