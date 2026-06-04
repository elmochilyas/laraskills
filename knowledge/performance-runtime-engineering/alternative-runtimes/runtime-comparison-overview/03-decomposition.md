# Decomposition: Runtime Comparison Overview

## Topic Overview
Alternative PHP runtimes replace PHP-FPM's process-per-request model with memory-resident architectures delivering 3-15x throughput improvements. Four primary categories exist: **Swoole/OpenSwoole** (PHP extension, coroutine-based), **RoadRunner** (Go-based, goroutine scheduler + PHP workers), **FrankenPHP** (Caddy module, embedded PHP via CGO + threads), and **ReactPHP/AMPHP** (PHP userspace event loops). Each targets different workload profiles and operational complexity levels.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/runtime-comparison-overview/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Runtime Comparison Overview
- **Purpose:** Alternative PHP runtimes replace PHP-FPM's process-per-request model with memory-resident architectures delivering 3-15x throughput improvements. Four primary categories exist: **Swoole/OpenSwoole** (PHP extension, coroutine-based), **RoadRunner** (Go-based, goroutine scheduler + PHP workers), **FrankenPHP** (Caddy module, embedded PHP via CGO + threads), and **ReactPHP/AMPHP** (PHP userspace event loops). Each targets different workload profiles and operational complexity levels.
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
  - Choosing Swoole for low-I/O workloads
  - Vehicle model
  - Runtime selection flow

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