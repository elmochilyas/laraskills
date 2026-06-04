# Decomposition: Preloading Update Procedure

## Topic Overview
Updating the preloading script requires a **full PHP-FPM restart** (not just reload). Preloaded classes are loaded during php_module_startup() when the preload script is executed. Neither opcache_reset() nor reload (USR2) re-executes the preloading script. The only mechanism to refresh preloaded classes is to terminate and restart PHP-FPM.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
deployment-cache-invalidation/preloading-update-procedure/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Preloading Update Procedure
- **Purpose:** Updating the preloading script requires a **full PHP-FPM restart** (not just reload). Preloaded classes are loaded during php_module_startup() when the preload script is executed. Neither opcache_reset() nor reload (USR2) re-executes the preloading script. The only mechanism to refresh preloaded classes is to terminate and restart PHP-FPM.
- **Difficulty:** Intermediate
- **Dependencies:
  - FPM Graceful Reload | Blue-Green Deployment
  - --

## Dependency Graph
**Depends on:**
  - FPM Graceful Reload | Blue-Green Deployment
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Preload update handling
  - Not accounting for preloading reload cost
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