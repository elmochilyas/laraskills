# Decomposition: Jit Memory Layout Fragmentation

## Topic Overview
The JIT buffer is a pre-allocated contiguous memory region divided into segments for code, metadata, and profiling data. Over time, native code segments of varying sizes cause fragmentation — small gaps between compiled functions that cannot accommodate new compilations. PHP 8.4+ introduced buffer compaction to defragment the buffer without requiring reset.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/jit-memory-layout-fragmentation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Jit Memory Layout Fragmentation
- **Purpose:** The JIT buffer is a pre-allocated contiguous memory region divided into segments for code, metadata, and profiling data. Over time, native code segments of varying sizes cause fragmentation — small gaps between compiled functions that cannot accommodate new compilations. PHP 8.4+ introduced buffer compaction to defragment the buffer without requiring reset.
- **Difficulty:** Advanced
- **Dependencies:
  - Running Processes
  - --

## Dependency Graph
**Depends on:**
  - Running Processes
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Interpreter vs translator model
  - Profile-then-enable

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