# Decomposition: Opcache Purpose And Mechanics

## Topic Overview
PHP OpCache eliminates the lex/parse/compile phases (60-80% of a PHP request's CPU time for uncached files) by storing compiled opcodes in **shared memory**. With OpCache enabled and properly configured, PHP serves files from memory with zero compilation overhead � resulting in 2-4x throughput improvement over uncached operation. It is the single highest-ROI optimization for any PHP application.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/opcache-purpose-and-mechanics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Opcache Purpose And Mechanics
- **Purpose:** PHP OpCache eliminates the lex/parse/compile phases (60-80% of a PHP request's CPU time for uncached files) by storing compiled opcodes in **shared memory**. With OpCache enabled and properly configured, PHP serves files from memory with zero compilation overhead � resulting in 2-4x throughput improvement over uncached operation. It is the single highest-ROI optimization for any PHP application.
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
  - Library model
  - Not enabling OpCache in production
  - Tiered cache warming

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