# Decomposition: 5.4 Tenant resolution strategies (domain, subdomain, header, token, authenticated user)

## Topic Overview
Tenant resolution identifies which tenant the current request belongs to. Strategies: domain (acme.app.com), subdomain (acme.saas.com), header (X-Tenant-ID), token (JWT claim), or authenticated user relationship. Chosen at middleware level, resolved once per request.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-4-tenant-resolution-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.4 Tenant resolution strategies (domain, subdomain, header, token, authenticated user)
- **Purpose:** Tenant resolution identifies which tenant the current request belongs to. Strategies: domain (acme.app.com), subdomain (acme.saas.com), header (X-Tenant-ID), token (JWT claim), or authenticated user relationship.
- **Difficulty:** Intermediate
- **Dependencies:** 5.5 Global scopes, 5.6 Tenant-aware middleware

## Dependency Graph
**Depends on:** "5.5 Global scopes", "5.6 Tenant-aware middleware"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Subdomain resolution**: Parse `$request->getHost()`, extract subdomain. Match against tenants table. Fast, DNS-driven routing.; - **Domain resolution**: Custom domain per tenant. Requires domain verification (DNS record). CNAME or A record pointing to platform.; - **Header/token resolution**: For API-first SaaS. `X-Tenant-ID` header or tenant embedded in JWT. No DNS dependency.; - **Auth resolution**: Tenant derived from `auth()->user()->tenant_id`. Simplest for single-tenant-per-user models..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization