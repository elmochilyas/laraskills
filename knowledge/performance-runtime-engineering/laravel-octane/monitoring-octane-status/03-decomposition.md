# Decomposition: Monitoring Octane Status

## Topic Overview
Octane provides built-in monitoring commands. `php artisan octane:status` shows worker state (alive, dead, working), request count, and uptime. `php artisan octane:profile-memory` (Swoole) profiles per-worker memory usage. For production, integrate Octane metrics with APM/observability — monitor worker RSS growth, request count per worker, and recycling frequency to detect memory leaks.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-octane-performance/monitoring-octane-status/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Monitoring Octane Status
- **Purpose:** Octane provides built-in monitoring commands. `php artisan octane:status` shows worker state (alive, dead, working), request count, and uptime. `php artisan octane:profile-memory` (Swoole) profiles per-worker memory usage. For production, integrate Octane metrics with APM/observability — monitor worker RSS growth, request count per worker, and recycling frequency to detect memory leaks.
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
  - Health check endpoint
  - Not monitoring Octane workers in production
  - Power plant model
  - Safe migration pattern

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