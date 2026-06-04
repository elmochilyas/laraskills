# Decomposition: Dynasm Framework Internals

## Topic Overview
PHP's JIT compiler is built on **DynASM** (Dynamic Assembler), a LuaJIT-derived framework that generates native machine code at runtime. DynASM takes an intermediate representation (IR) from the Zend opcodes, performs register allocation, and emits executable x86-64 or ARM64 instructions directly into the JIT buffer. Understanding DynASM is essential for debugging JIT behavior and evaluating compilation quality.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/dynasm-framework-internals/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Dynasm Framework Internals
- **Purpose:** PHP's JIT compiler is built on **DynASM** (Dynamic Assembler), a LuaJIT-derived framework that generates native machine code at runtime. DynASM takes an intermediate representation (IR) from the Zend opcodes, performs register allocation, and emits executable x86-64 or ARM64 instructions directly into the JIT buffer. Understanding DynASM is essential for debugging JIT behavior and evaluating compilation quality.
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