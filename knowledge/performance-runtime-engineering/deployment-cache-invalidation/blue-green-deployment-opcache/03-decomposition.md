# Decomposition: Blue Green Deployment Opcache

## Topic Overview
Blue-green deployment for PHP-FPM: maintain two identical environments (blue = current, green = new). Deploy to green with all caches warmed. Switch traffic from blue to green via load balancer. Blue remains as rollback target. Each environment has **independent OpCache instances** ? no cache sharing, no cross-contamination, immediate full cache warm without affecting production.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/blue-green-deployment-opcache/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Blue Green Deployment Opcache
- **Purpose:** Blue-green deployment for PHP-FPM: maintain two identical environments (blue = current, green = new). Deploy to green with all caches warmed. Switch traffic from blue to green via load balancer. Blue remains as rollback target. Each environment has **independent OpCache instances** ? no cache sharing, no cross-contamination, immediate full cache warm without affecting production.
- **Difficulty:** Intermediate
- **Dependencies:
  - Instance Cache Coordination
  - --

## Dependency Graph
**Depends on:**
  - Instance Cache Coordination
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Warm-up script
  - Switching traffic without warming green
  - Parking garage model
  - Zero-downtime deployment pipeline

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