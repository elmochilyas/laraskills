# Decomposition: Worker Configuration By Driver

## Topic Overview
Each Octane driver has distinct worker configuration semantics. **RoadRunner** uses `num_workers` in `.rr.yaml`. **Swoole** uses PHP constants. **FrankenPHP** uses `num_threads` in Caddyfile. Common across all drivers: `max_requests` (worker recycling to prevent memory drift) and worker count derived from CPU cores × workload factor.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-octane-performance/worker-configuration-by-driver/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Worker Configuration By Driver
- **Purpose:** Each Octane driver has distinct worker configuration semantics. **RoadRunner** uses `num_workers` in `.rr.yaml`. **Swoole** uses PHP constants. **FrankenPHP** uses `num_threads` in Caddyfile. Common across all drivers: `max_requests` (worker recycling to prevent memory drift) and worker count derived from CPU cores × workload factor.
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
  - Worker count formula
  - Setting workers = cores for I/O-bound Octane
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