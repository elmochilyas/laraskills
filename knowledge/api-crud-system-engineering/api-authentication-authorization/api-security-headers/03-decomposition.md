# Decomposition: API Security Headers

## Topic Overview
Security headers are HTTP response headers that instruct the browser (or API client) to enforce security behaviors such as content type sniffing prevention, strict transport security, clickjacking protection, and content security policy. For APIs, the most relevant security headers include `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cache-Control`. These headers protect API consumers from common web vulnerabilities and are a baseline requirement for security-conscious API design.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
api-security-headers/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### API Security Headers
- **Purpose:** Security headers are HTTP response headers that instruct the browser (or API client) to enforce security behaviors such as content type sniffing prevention, strict transport security, clickjacking protection, and content security policy. For APIs, the most relevant security headers include `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cache-Control`. These headers protect API consumers from common web vulnerabilities and are a baseline requirement for security-conscious API design.
- **Difficulty:** Intermediate
- **Dependencies:** cors-configuration, api-specific-middleware

## Dependency Graph
**Depends on:**
- cors-configuration
- api-specific-middleware

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy`

**Out of scope:**
- cors-configuration topics covered in their respective KUs
- api-specific-middleware topics covered in their respective KUs

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