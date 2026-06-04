# Decomposition: Architecture Model Differences

## Topic Overview
All alternative runtimes implement a **memory-resident** model (boot-once, handle-many) but through different mechanisms: Swoole uses coroutines within PHP processes, RoadRunner uses Go goroutines dispatching to PHP workers, FrankenPHP uses PHP threads via ZTS + CGO, and ReactPHP/AMPHP use userspace event loops within a single PHP process.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/architecture-model-differences/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Architecture Model Differences
- **Purpose:** All alternative runtimes implement a **memory-resident** model (boot-once, handle-many) but through different mechanisms: Swoole uses coroutines within PHP processes, RoadRunner uses Go goroutines dispatching to PHP workers, FrankenPHP uses PHP threads via ZTS + CGO, and ReactPHP/AMPHP use userspace event loops within a single PHP process.
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