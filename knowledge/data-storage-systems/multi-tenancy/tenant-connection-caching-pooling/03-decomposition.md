# Decomposition: 5.13 Tenant connection caching and pooling

## Topic Overview
In schema-per-tenant and DB-per-tenant models, every request potentially uses a different database connection. Creating a new PDO connection per request is expensive (handshake, auth, SSL). Connection pooling and caching strategies reduce overhead: persistent connections, connection pool middleware, connection factory caching.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-13-tenant-connection-caching-pooling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.13 Tenant connection caching and pooling
- **Purpose:** In schema-per-tenant and DB-per-tenant models, every request potentially uses a different database connection. Creating a new PDO connection per request is expensive (handshake, auth, SSL).
- **Difficulty:** Advanced
- **Dependencies:** 5.2 Schema-per-tenant, 5.3 DB-per-tenant, 10.4 Connection pooling

## Dependency Graph
**Depends on:** "5.2 Schema-per-tenant", "5.3 DB-per-tenant", "10.4 Connection pooling"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Connection setup cost**: TCP handshake + SSL negotiation + MySQL auth handshake ~50-200ms per new connection. For 100 tenants per minute per worker, this is unsustainable.; - **Persistent connections**: `pdo.options' => [PDO::ATTR_PERSISTENT => true]` reuses connections across requests. Risks: stale connections, maximum connection limits.; - **Connection factory caching**: Cache the resolved PDO instance keyed by tenant ID. Flush cache when credentials rotate..
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