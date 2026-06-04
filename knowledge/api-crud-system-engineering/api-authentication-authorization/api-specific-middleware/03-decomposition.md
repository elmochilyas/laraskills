# Decomposition: API-Specific Middleware

## Topic Overview
API-specific middleware handles cross-cutting concerns unique to API requests that are not needed for web requests. Common API middleware includes forcing JSON responses (`ForceJson`), adding request identifiers (`addRequestId`), ensuring JSON content type on incoming requests (`EnsureJsonResponse`), and logging API audit trails. These middleware components run before and/or after the controller and are grouped into an API middleware group to ensure consistent behavior across all API endpoints.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
api-specific-middleware/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### API-Specific Middleware
- **Purpose:** API-specific middleware handles cross-cutting concerns unique to API requests that are not needed for web requests. Common API middleware includes forcing JSON responses (`ForceJson`), adding request identifiers (`addRequestId`), ensuring JSON content type on incoming requests (`EnsureJsonResponse`), and logging API audit trails. These middleware components run before and/or after the controller and are grouped into an API middleware group to ensure consistent behavior across all API endpoints.
- **Difficulty:** Intermediate
- **Dependencies:** api-security-headers, cors-configuration, signed-request-pattern

## Dependency Graph
**Depends on:**
- api-security-headers
- cors-configuration
- signed-request-pattern

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- ForceJson response
- Request ID (`X-Request-Id`)
- Content negotiation middleware
- Audit middleware
- Request timing
- Response compression

**Out of scope:**
- api-security-headers topics covered in their respective KUs
- cors-configuration topics covered in their respective KUs
- signed-request-pattern topics covered in their respective KUs

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