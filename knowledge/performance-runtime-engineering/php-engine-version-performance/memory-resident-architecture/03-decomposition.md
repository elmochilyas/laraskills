# Decomposition: Memory Resident Architecture

## Topic Overview
Memory-resident architectures (Laravel Octane, Swoole, RoadRunner, FrankenPHP) boot the PHP application **once per worker** and handle hundreds to thousands of requests within the same process. This eliminates per-request bootstrap overhead — the dominant cost for fast requests — and achieves 3-15x throughput gains over traditional PHP-FPM for API workloads.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/memory-resident-architecture/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Memory Resident Architecture
- **Purpose:** Memory-resident architectures (Laravel Octane, Swoole, RoadRunner, FrankenPHP) boot the PHP application **once per worker** and handle hundreds to thousands of requests within the same process. This eliminates per-request bootstrap overhead — the dominant cost for fast requests — and achieves 3-15x throughput gains over traditional PHP-FPM for API workloads.
- **Difficulty:** Foundation
- **Dependencies:
  - Nothing Architecture | Concurrency Models | Laravel Octane Architecture
  - --

## Dependency Graph
**Depends on:**
  - Nothing Architecture | Concurrency Models | Laravel Octane Architecture
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Pipeline model
  - Bottleneck-first approach

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