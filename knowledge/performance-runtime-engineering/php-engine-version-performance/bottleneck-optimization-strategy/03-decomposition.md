# Decomposition: Bottleneck Optimization Strategy

## Topic Overview
The most critical performance insight is that **the optimization strategy depends on where the bottleneck lies**. CPU-bound workloads benefit from JIT (+80-95%), I/O-bound workloads require architectural changes (coroutines, persistent workers), and memory-bound scenarios demand OpCache tuning and GC management. Applying the wrong optimization yields zero or negative results.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/bottleneck-optimization-strategy/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Bottleneck Optimization Strategy
- **Purpose:** The most critical performance insight is that **the optimization strategy depends on where the bottleneck lies**. CPU-bound workloads benefit from JIT (+80-95%), I/O-bound workloads require architectural changes (coroutines, persistent workers), and memory-bound scenarios demand OpCache tuning and GC management. Applying the wrong optimization yields zero or negative results.
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
  - Bottleneck diagnosis hierarchy
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