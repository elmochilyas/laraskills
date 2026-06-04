# Decomposition: Jit Concepts And Terminology

## Topic Overview
PHP 8.0 introduced a JIT (Just-In-Time) compiler that translates frequently executed opcodes into native machine code at runtime. Two modes exist: **tracing JIT** (profile-guided, optimizes hot loop paths) and **function JIT** (compiles entire functions). JIT provides 61-95% gains for CPU-bound code but 0-5% for typical I/O-bound web applications.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/jit-concepts-and-terminology/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Jit Concepts And Terminology
- **Purpose:** PHP 8.0 introduced a JIT (Just-In-Time) compiler that translates frequently executed opcodes into native machine code at runtime. Two modes exist: **tracing JIT** (profile-guided, optimizes hot loop paths) and **function JIT** (compiles entire functions). JIT provides 61-95% gains for CPU-bound code but 0-5% for typical I/O-bound web applications.
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
  - JIT for computation, not I/O
  - Enabling JIT expecting universal speedup
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