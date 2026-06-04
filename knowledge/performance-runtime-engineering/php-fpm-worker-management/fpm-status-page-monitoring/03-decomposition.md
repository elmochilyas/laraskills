# Decomposition: Fpm Status Page Monitoring

## Topic Overview
PHP-FPM's built-in status page provides real-time pool health metrics. The critical indicators: **active processes** (should be < max_children), **max children reached** (should be 0 — if >0, pool saturation has occurred), **listen queue** (should be 0 — if >0, requests are waiting for workers). The status page is the first place to check when diagnosing 502 errors or performance degradation.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-fpm-worker-management/fpm-status-page-monitoring/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Fpm Status Page Monitoring
- **Purpose:** PHP-FPM's built-in status page provides real-time pool health metrics. The critical indicators: **active processes** (should be < max_children), **max children reached** (should be 0 — if >0, pool saturation has occurred), **listen queue** (should be 0 — if >0, requests are waiting for workers). The status page is the first place to check when diagnosing 502 errors or performance degradation.
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
  - Monitoring setup
  - Setting pm.status_path with HTTP authentication
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