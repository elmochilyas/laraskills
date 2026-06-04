# Decomposition: Gc Enable Disable Patterns

## Topic Overview
`gc_disable()` turns off automatic cycle collection, preventing stop-the-world GC pauses during time-sensitive code. `gc_enable()` re-enables it. The correct pattern: disable GC before a latency-critical section, call `gc_collect_cycles()` at boundaries, and re-enable after. Never permanently disable GC in long-running processes � unbounded root buffer growth will eventually exhaust memory.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/gc-enable-disable-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Gc Enable Disable Patterns
- **Purpose:** `gc_disable()` turns off automatic cycle collection, preventing stop-the-world GC pauses during time-sensitive code. `gc_enable()` re-enables it. The correct pattern: disable GC before a latency-critical section, call `gc_collect_cycles()` at boundaries, and re-enable after. Never permanently disable GC in long-running processes � unbounded root buffer growth will eventually exhaust memory.
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
  - High-frequency trading / real-time
  - Permanently disabling GC in PHP-FPM
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