# Decomposition: PHP-FPM Tuning

## Topic Overview
PHP-FPM (FastCGI Process Manager) manages PHP worker processes. Tuning `pm.max_children`, `pm.start_servers`, `pm.max_requests`, and `pm.process_idle_timeout` directly impacts memory usage, request latency, and server cost. Over-allocation causes OOM kills; under-allocation wastes CPU. For Laravel, PHP-FPM pools must account for each worker's ~30-80MB memory footprint and the application's concurrent request patterns.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-php-fpm-tuning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### PHP-FPM Tuning
- **Purpose:** PHP-FPM (FastCGI Process Manager) manages PHP worker processes. Tuning `pm.max_children`, `pm.start_servers`, `pm.max_requests`, and `pm.process_idle_timeout` directly impacts memory usage, request latency, and server cost. Over-allocation causes OOM kills; under-allocation wastes CPU. For Laravel, PHP-FPM pools must account for each worker's ~30-80MB memory footprint and the application's concurrent request patterns.
- **Difficulty:** Foundation
- **Dependencies:** - OPcache Tuning (ku-04), - Octane Resource Usage (ku-05), - VM Sizing (ku-01)

## Dependency Graph
**Depends on:**
- OPcache Tuning (ku-04)
- Octane Resource Usage (ku-05)
- VM Sizing (ku-01)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Dynamic pool: General production use; adjusts workers based on concurrent requests
- Static pool: Predictable load with stable concurrent requests (Octane replaces FPM in this case)
- On-demand: Very low-traffic apps on memory-constrained instances (<1GB RAM)
- Increased max_requests: When using OPcache with file modification detection disabled (workers live longer)
**Out of scope:**
- Static pool for variable traffic: Fixed worker count wastes memory during low traffic, limits capacity during peaks
- Dynamic pool with very high max_children: Setting max_children > available memory/worker_size causes OOM
- On-demand for high-traffic: Worker creation overhead per request adds 50-200ms latency
- Too low pm.max_requests: Setting <100 causes frequent worker restarts (wasted CPU on boot)
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization