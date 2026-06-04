# Decomposition: Optimization Level Bitmask

## Topic Overview
OpCache applies a series of optimization passes to compiled opcodes before storing them. The `opcache.optimization_level` bitmask (default `0x7FFEBFFF` in PHP 8.x) enables or disables specific passes. Most passes are safe (preserve semantics), but some (especially function call optimizations) can alter behavior in edge cases. Understanding the bitmask enables debugging optimization-related bugs.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/optimization-level-bitmask/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Optimization Level Bitmask
- **Purpose:** OpCache applies a series of optimization passes to compiled opcodes before storing them. The `opcache.optimization_level` bitmask (default `0x7FFEBFFF` in PHP 8.x) enables or disables specific passes. Most passes are safe (preserve semantics), but some (especially function call optimizations) can alter behavior in edge cases. Understanding the bitmask enables debugging optimization-related bugs.
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
  - Debugging optimization bugs
  - Setting `optimization_level=0`
  - Library model
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