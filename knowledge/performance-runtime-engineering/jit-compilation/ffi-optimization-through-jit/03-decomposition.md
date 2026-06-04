# Decomposition: Ffi Optimization Through Jit

## Topic Overview
PHP's Foreign Function Interface (FFI) allows calling C functions directly from PHP code. With JIT enabled, FFI call overhead is significantly reduced because the JIT compiler can inline FFI function calls and optimize the calling convention, eliminating the per-call marshaling overhead that makes FFI slow without JIT.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/ffi-optimization-through-jit/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Ffi Optimization Through Jit
- **Purpose:** PHP's Foreign Function Interface (FFI) allows calling C functions directly from PHP code. With JIT enabled, FFI call overhead is significantly reduced because the JIT compiler can inline FFI function calls and optimize the calling convention, eliminating the per-call marshaling overhead that makes FFI slow without JIT.
- **Difficulty:** Advanced
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