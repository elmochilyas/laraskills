# Decomposition: Memory Leak Detection Patterns

## Topic Overview
Memory leaks in PHP manifest as **monotonically increasing memory usage** over time — worker RSS grows from ~65MB at start to ~120MB+ after 12 hours. The three most common patterns are: **growing static collections** (arrays or objects stored on static properties), **closure accumulation** (closures capturing scope variables in listeners/callbacks), and **circular references** not collected by the GC (usually from third-party libraries not using WeakReference).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/memory-leak-detection-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Memory Leak Detection Patterns
- **Purpose:** Memory leaks in PHP manifest as **monotonically increasing memory usage** over time — worker RSS grows from ~65MB at start to ~120MB+ after 12 hours. The three most common patterns are: **growing static collections** (arrays or objects stored on static properties), **closure accumulation** (closures capturing scope variables in listeners/callbacks), and **circular references** not collected by the GC (usually from third-party libraries not using WeakReference).
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
  - Memory leak triage
  - Assuming pm.max_requests solves memory leaks
  - Lending library model
  - Leak detection patrol

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