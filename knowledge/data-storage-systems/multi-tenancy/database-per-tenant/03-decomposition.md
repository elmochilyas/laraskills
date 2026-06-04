# Decomposition: 5.3 Database-per-tenant (separate DB per tenant)

## Topic Overview
Each tenant gets their own database. Strongest isolation, simplest backup/restore per tenant, clearest billing attribution. Highest operational cost — N databases to manage, monitor, and migrate.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-3-database-per-tenant/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.3 Database-per-tenant (separate DB per tenant)
- **Purpose:** Each tenant gets their own database. Strongest isolation, simplest backup/restore per tenant, clearest billing attribution.
- **Difficulty:** Advanced
- **Dependencies:** 5.1 Shared-table, 5.2 Schema-per-tenant, 5.13 Tenant connection caching

## Dependency Graph
**Depends on:** "5.1 Shared-table", "5.2 Schema-per-tenant", "5.13 Tenant connection caching"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Full isolation**: Tenant A's data never touches Tenant B's database. No possibility of cross-tenant queries.; - **Connection management**: Each tenant has a separate database connection. Connection pooling per tenant or shared pool with dynamic database selection.; - **Operational overhead**: N databases × migrations, backups, monitoring, upgrades..
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