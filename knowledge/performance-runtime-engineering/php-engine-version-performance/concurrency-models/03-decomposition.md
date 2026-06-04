# Decomposition: Concurrency Models

## Topic Overview
PHP applications can handle concurrent requests via four models: **process-based** (PHP-FPM — isolated, high overhead), **thread-based** (FrankenPHP — shared memory, lower overhead), **coroutine-based** (Swoole — cooperative multitasking within a single thread), and **goroutine-based** (RoadRunner — Go-managed goroutines dispatching to PHP workers). Each trades isolation for efficiency differently.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/concurrency-models/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Concurrency Models
- **Purpose:** PHP applications can handle concurrent requests via four models: **process-based** (PHP-FPM — isolated, high overhead), **thread-based** (FrankenPHP — shared memory, lower overhead), **coroutine-based** (Swoole — cooperative multitasking within a single thread), and **goroutine-based** (RoadRunner — Go-managed goroutines dispatching to PHP workers). Each trades isolation for efficiency differently.
- **Difficulty:** Foundation
- **Dependencies:
  - Nothing Architecture | Memory-Resident Architecture | PHP-FPM Process Manager Modes
  - --

## Dependency Graph
**Depends on:**
  - Nothing Architecture | Memory-Resident Architecture | PHP-FPM Process Manager Modes
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