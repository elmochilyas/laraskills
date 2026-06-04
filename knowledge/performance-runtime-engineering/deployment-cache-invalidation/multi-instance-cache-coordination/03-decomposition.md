# Decomposition: Multi Instance Cache Coordination

## Topic Overview
In horizontally scaled PHP deployments (multiple servers behind a load balancer), each instance has its **own OpCache**. There is no shared OpCache across instances. Cache coordination requires: invalidating all instances (cachetool with multi-host support), ensuring all instances are warmed before accepting traffic, and handling the transition window where some instances serve old code and some serve new.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/multi-instance-cache-coordination/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Multi Instance Cache Coordination
- **Purpose:** In horizontally scaled PHP deployments (multiple servers behind a load balancer), each instance has its **own OpCache**. There is no shared OpCache across instances. Cache coordination requires: invalidating all instances (cachetool with multi-host support), ensuring all instances are warmed before accepting traffic, and handling the transition window where some instances serve old code and some serve new.
- **Difficulty:** Advanced
- **Dependencies:
  - Green Deployment | Containerized Deployment Cache Strategies
  - --

## Dependency Graph
**Depends on:**
  - Green Deployment | Containerized Deployment Cache Strategies
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Coordination via configuration management
  - Assuming OpCache is shared across instances
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