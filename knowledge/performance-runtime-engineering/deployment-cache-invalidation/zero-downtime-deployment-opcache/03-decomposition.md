# Decomposition: Zero Downtime Deployment Opcache

## Topic Overview
Zero-downtime PHP deployment combines: 1) **PHP-FPM graceful reload** (no dropped connections), 2) **OpCache pre-warming** (no slow first requests), 3) **Health check sequencing** (verify workers before serving traffic), and 4) **Load balancer orchestration** (drain/warm/rejoin). The complete sequence takes 30-120 seconds with zero user-facing impact.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/zero-downtime-deployment-opcache/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Zero Downtime Deployment Opcache
- **Purpose:** Zero-downtime PHP deployment combines: 1) **PHP-FPM graceful reload** (no dropped connections), 2) **OpCache pre-warming** (no slow first requests), 3) **Health check sequencing** (verify workers before serving traffic), and 4) **Load balancer orchestration** (drain/warm/rejoin). The complete sequence takes 30-120 seconds with zero user-facing impact.
- **Difficulty:** Foundation
- **Dependencies:
  - FPM Graceful Reload | OpCache Reset Strategies | Blue-Green Deployment
  - --

## Dependency Graph
**Depends on:**
  - FPM Graceful Reload | OpCache Reset Strategies | Blue-Green Deployment
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Pre-warm script
  - Skipping warm-up
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