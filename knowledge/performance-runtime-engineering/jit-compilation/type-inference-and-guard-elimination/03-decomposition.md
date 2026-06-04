# Decomposition: Type Inference And Guard Elimination

## Topic Overview
Type inference is the JIT compiler's ability to deduce variable types at compile time by analyzing the code path. When types are known, the JIT eliminates runtime type checks (**guard elimination**), producing tighter native code. This is the single largest source of JIT's speedup. PHP 8.0+ typed properties significantly improve inference quality compared to docblock-only types.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/type-inference-and-guard-elimination/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Type Inference And Guard Elimination
- **Purpose:** Type inference is the JIT compiler's ability to deduce variable types at compile time by analyzing the code path. When types are known, the JIT eliminates runtime type checks (**guard elimination**), producing tighter native code. This is the single largest source of JIT's speedup. PHP 8.0+ typed properties significantly improve inference quality compared to docblock-only types.
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