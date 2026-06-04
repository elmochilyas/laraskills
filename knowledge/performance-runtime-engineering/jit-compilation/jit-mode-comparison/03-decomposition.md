# Decomposition: Jit Mode Comparison

## Topic Overview
PHP JIT supports four principal modes configured via `opcache.jit`. The mode determines compilation strategy, memory layout, and optimization aggressiveness. **Tracing (1254)** and **Function (1205)** are the most common production modes. **On (1235)** provides tracing with trace-level optimization. **Disabled (0)** turns JIT off entirely.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/jit-mode-comparison/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Jit Mode Comparison
- **Purpose:** PHP JIT supports four principal modes configured via `opcache.jit`. The mode determines compilation strategy, memory layout, and optimization aggressiveness. **Tracing (1254)** and **Function (1205)** are the most common production modes. **On (1235)** provides tracing with trace-level optimization. **Disabled (0)** turns JIT off entirely.
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