# Decomposition: Fpm Process Manager Modes

## Topic Overview
PHP-FPM offers three process management modes: **static** (fixed pool size — constant memory usage, zero spawn latency), **dynamic** (variable pool — memory-efficient at low load, spawns on demand), and **ondemand** (zero idle workers — maximum memory saving, spawn latency on every request). Mode selection depends on traffic pattern: static for steady high traffic, dynamic for variable traffic, ondemand for low-traffic or memory-constrained environments.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/fpm-process-manager-modes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Fpm Process Manager Modes
- **Purpose:** PHP-FPM offers three process management modes: **static** (fixed pool size — constant memory usage, zero spawn latency), **dynamic** (variable pool — memory-efficient at low load, spawns on demand), and **ondemand** (zero idle workers — maximum memory saving, spawn latency on every request). Mode selection depends on traffic pattern: static for steady high traffic, dynamic for variable traffic, ondemand for low-traffic or memory-constrained environments.
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
  - Using ondemand for high-traffic APIs
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