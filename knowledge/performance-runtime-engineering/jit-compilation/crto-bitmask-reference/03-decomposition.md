# Decomposition: Crto Bitmask Reference

## Topic Overview
The `opcache.jit` value is a 4-digit CRTO bitmask controlling compilation strategy: **C**PU optimization level, **R**egister allocation mode, **T**rigger type (what triggers compilation), and **O**ptimization level. Each digit selects from enumerated options, making `1254` a specific combination of CPU(1), Register(2), Trigger(5), Optimization(4).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/crto-bitmask-reference/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Crto Bitmask Reference
- **Purpose:** The `opcache.jit` value is a 4-digit CRTO bitmask controlling compilation strategy: **C**PU optimization level, **R**egister allocation mode, **T**rigger type (what triggers compilation), and **O**ptimization level. Each digit selects from enumerated options, making `1254` a specific combination of CPU(1), Register(2), Trigger(5), Optimization(4).
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