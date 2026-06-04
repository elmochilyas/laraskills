# Decomposition: Consistency Models Cache Invalidation

## Topic Overview
Cache invalidation during deployment follows a **consistency model**. **Strong consistency**: all workers serve new code simultaneously (requires coordination, typically via load balancer drain + atomic cutover). **Eventual consistency**: workers gradually pick up new code as they restart (simpler but mixed versions serve during transition). Choose based on tolerance for mixed-version execution.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/consistency-models-cache-invalidation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Consistency Models Cache Invalidation
- **Purpose:** Cache invalidation during deployment follows a **consistency model**. **Strong consistency**: all workers serve new code simultaneously (requires coordination, typically via load balancer drain + atomic cutover). **Eventual consistency**: workers gradually pick up new code as they restart (simpler but mixed versions serve during transition). Choose based on tolerance for mixed-version execution.
- **Difficulty:** Foundation
- **Dependencies:
  - Green Deployment with Separate OpCache | Containerized Deployment Cache Strategies
  - --

## Dependency Graph
**Depends on:**
  - Green Deployment with Separate OpCache | Containerized Deployment Cache Strategies
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Rolling + strong OpCache
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