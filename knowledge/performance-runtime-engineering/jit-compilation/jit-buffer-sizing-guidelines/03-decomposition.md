# Decomposition: Jit Buffer Sizing Guidelines

## Topic Overview
The JIT buffer (`opcache.jit_buffer_size`) stores compiled native code in memory. An undersized buffer causes compilation thrashing (compiling, evicting, and recompiling). An oversized buffer wastes memory. The 128MB default suits most applications; 256MB is recommended for large applications or when using aggressive inlining (optimization levels 4-5).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/jit-buffer-sizing-guidelines/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Jit Buffer Sizing Guidelines
- **Purpose:** The JIT buffer (`opcache.jit_buffer_size`) stores compiled native code in memory. An undersized buffer causes compilation thrashing (compiling, evicting, and recompiling). An oversized buffer wastes memory. The 128MB default suits most applications; 256MB is recommended for large applications or when using aggressive inlining (optimization levels 4-5).
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
  - Setting jit_buffer_size too small (32MB or default minimum)
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