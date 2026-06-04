# Decomposition: Pm Max Requests Tuning

## Topic Overview
`pm.max_requests` controls how many requests a worker handles before being killed and replaced. This **recycling** prevents memory drift � the gradual increase in worker RSS caused by per-request memory fragmentation. A worker starting at 65MB RSS will grow to ~120MB over 12 hours without recycling. Setting `pm.max_requests` to 500-1000 stabilizes RSS by recycling before memory becomes critical.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/pm-max-requests-tuning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Pm Max Requests Tuning
- **Purpose:** `pm.max_requests` controls how many requests a worker handles before being killed and replaced. This **recycling** prevents memory drift � the gradual increase in worker RSS caused by per-request memory fragmentation. A worker starting at 65MB RSS will grow to ~120MB over 12 hours without recycling. Setting `pm.max_requests` to 500-1000 stabilizes RSS by recycling before memory becomes critical.
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
  - Memory drift detection
  - pm.max_requests=0 (unlimited)
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