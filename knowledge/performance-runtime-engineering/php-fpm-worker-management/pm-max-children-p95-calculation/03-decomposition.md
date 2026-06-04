# Decomposition: Pm Max Children P95 Calculation

## Topic Overview
`pm.max_children` is the single most important FPM safety setting. The correct formula uses **P95 RSS** (not average) multiplied by a **safety factor** (1.2-1.5). Average-based sizing creates 30-50% oversubscription risk � when workers hit peak memory simultaneously during traffic spikes, the server OOM-kills FPM processes, causing mass 502 errors.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/pm-max-children-p95-calculation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Pm Max Children P95 Calculation
- **Purpose:** `pm.max_children` is the single most important FPM safety setting. The correct formula uses **P95 RSS** (not average) multiplied by a **safety factor** (1.2-1.5). Average-based sizing creates 30-50% oversubscription risk � when workers hit peak memory simultaneously during traffic spikes, the server OOM-kills FPM processes, causing mass 502 errors.
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
  - Production measurement
  - Setting max_children = (total_RAM / memory_limit)
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