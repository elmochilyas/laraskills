# Decomposition: 10.5 Dynamic connection configuration (config in middleware, runtime connection switching)

## Topic Overview
Laravel allows dynamic connection configuration at runtime: `config(['database.connections.tenant.database' => 'tenant_'.$id])`. Used for multi-tenant DB-per-tenant, shard routing, and environment-specific connections. After changing config, purge the connection (`DB::purge('tenant')`) to force reconnection on next query.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-5-dynamic-connection-config/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.5 Dynamic connection configuration (config in middleware, runtime connection switching)
- **Purpose:** Laravel allows dynamic connection configuration at runtime: `config(['database.connections.tenant.database' => 'tenant_'.$id])`. Used for multi-tenant DB-per-tenant, shard routing, and environment-specific connections.
- **Difficulty:** Advanced
- **Dependencies:** 5.6 Tenant middleware, 5.25 Tenant bootstrapper, 6.5 Shard routing

## Dependency Graph
**Depends on:** "5.6 Tenant middleware", "5.25 Tenant bootstrapper", "6.5 Shard routing"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Config override**: `config()->set()` at runtime. Changes apply to subsequent calls. Does not affect existing connections.; - **DB::purge(connection)**: Removes the connection from the connection factory. Next `DB::connection('tenant')` call creates a new connection with the updated config.; - **Reconnect**: `DB::reconnect('tenant')` — convenience method that purges and reconnects..
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