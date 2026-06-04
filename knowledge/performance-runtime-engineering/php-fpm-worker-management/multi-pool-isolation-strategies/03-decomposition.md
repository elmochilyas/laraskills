# Decomposition: Multi Pool Isolation Strategies

## Topic Overview
Multi-tenant PHP-FPM deployments should use **separate pools per tenant** — each with its own `pm.max_children`, `pm.max_requests`, and `request_terminate_timeout`. This prevents one tenant's traffic spike from exhausting workers needed by other tenants. Pool isolation is the FPM equivalent of cgroups: it provides resource guarantees at the process-management level.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/multi-pool-isolation-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Multi Pool Isolation Strategies
- **Purpose:** Multi-tenant PHP-FPM deployments should use **separate pools per tenant** — each with its own `pm.max_children`, `pm.max_requests`, and `request_terminate_timeout`. This prevents one tenant's traffic spike from exhausting workers needed by other tenants. Pool isolation is the FPM equivalent of cgroups: it provides resource guarantees at the process-management level.
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Tiered pricing by pool
  - One pool for all tenants
  - Restaurant kitchen model
  - Monitor-then-size

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

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