# Decomposition: Octane Resource Usage

## Topic Overview
Laravel Octane boots the application once in long-lived worker processes (Swoole or RoadRunner), then handles requests within the same process. This eliminates the per-request boot overhead that PHP-FPM incurs. Octane reduces CPU usage by 30-50% compared to PHP-FPM for the same throughput, enabling fewer servers or lower instance sizes. However, Octane workers consume more memory per process because they persist between requests and hold connections, caches, and state.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-05-octane-resource-usage/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Octane Resource Usage
- **Purpose:** Laravel Octane boots the application once in long-lived worker processes (Swoole or RoadRunner), then handles requests within the same process. This eliminates the per-request boot overhead that PHP-FPM incurs. Octane reduces CPU usage by 30-50% compared to PHP-FPM for the same throughput, enabling fewer servers or lower instance sizes. However, Octane workers consume more memory per process because they persist between requests and hold connections, caches, and state.
- **Difficulty:** Foundation
- **Dependencies:** - RoadRunner Binary (ku-06), - Worker Pool Sizing (ku-07), - PHP-FPM Tuning (ku-03), - OPcache Tuning (ku-04)

## Dependency Graph
**Depends on:**
- RoadRunner Binary (ku-06)
- Worker Pool Sizing (ku-07)
- PHP-FPM Tuning (ku-03)
- OPcache Tuning (ku-04)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- High-traffic apps: >500 req/s benefit most from Octane's CPU efficiency
- Latency-sensitive apps: <100ms target response time (Octane eliminates boot latency)
- CPU-bound workloads: Octane reduces CPU by eliminating repeated boot overhead
- Cost-sensitive: Same throughput with 30-50% fewer servers = proportional cost reduction
- RoadRunner: When Go binary helps with deployment simplicity (single binary)
**Out of scope:**
- Low-traffic apps: <50 req/s; PHP-FPM savings don't justify Octane complexity
- Memory-constrained environments: Octane workers use 2-3x memory per process
- Apps with global state leaks: Octane amplifies memory leak problems (persistent between requests)
- Development environment: Octane adds complexity; PHP-FPM is simpler for local dev
- Incompatible packages: Some packages assume per-request lifecycle (singletons reset)
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