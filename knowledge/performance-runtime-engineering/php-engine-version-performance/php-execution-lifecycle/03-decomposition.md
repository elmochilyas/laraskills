# Decomposition: Php Execution Lifecycle

## Topic Overview
Every PHP request follows a three-phase pipeline: **lexing/parsing** (source code ? AST), **compilation** (AST ? opcodes), and **execution** (Zend VM runs opcodes). OpCache eliminates re-compilation by caching opcodes in shared memory. JIT compilation adds a fourth phase where hot opcodes are translated to native machine code.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/php-execution-lifecycle/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Php Execution Lifecycle
- **Purpose:** Every PHP request follows a three-phase pipeline: **lexing/parsing** (source code ? AST), **compilation** (AST ? opcodes), and **execution** (Zend VM runs opcodes). OpCache eliminates re-compilation by caching opcodes in shared memory. JIT compilation adds a fourth phase where hot opcodes are translated to native machine code.
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
  - Assembly line model
  - Pipeline model
  - Bottleneck-first approach

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