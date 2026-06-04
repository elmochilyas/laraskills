# Decomposition: Capacity Planning Safety Margins

## Topic Overview
Production capacity planning for PHP-FPM follows: `pm.max_children × P95_RSS × safety_factor = available_RAM`. The safety factor (1.2-1.5) accounts for RSS variance, OS page cache pressure, and measurement error. Using P95 RSS instead of average is the difference between a stable server and one that OOM-kills under peak load.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/capacity-planning-safety-margins/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Capacity Planning Safety Margins
- **Purpose:** Production capacity planning for PHP-FPM follows: `pm.max_children × P95_RSS × safety_factor = available_RAM`. The safety factor (1.2-1.5) accounts for RSS variance, OS page cache pressure, and measurement error. Using P95 RSS instead of average is the difference between a stable server and one that OOM-kills under peak load.
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Capacity planning spreadsheet
  - Ignoring database max_connections
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