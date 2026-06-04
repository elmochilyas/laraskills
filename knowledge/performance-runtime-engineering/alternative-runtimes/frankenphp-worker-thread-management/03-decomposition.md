# Decomposition: Frankenphp Worker Thread Management

## Topic Overview
FrankenPHP's thread pool automatically scales between `num_threads` (minimum) and `max_threads` (maximum) based on concurrent request demand. Each thread transitions through a state machine: Reserved ? Booting ? Inactive ? Ready ? Done. Auto-scaling dynamically adjusts thread count to match traffic while maintaining configurable wait time limits.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/frankenphp-worker-thread-management/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Frankenphp Worker Thread Management
- **Purpose:** FrankenPHP's thread pool automatically scales between `num_threads` (minimum) and `max_threads` (maximum) based on concurrent request demand. Each thread transitions through a state machine: Reserved ? Booting ? Inactive ? Ready ? Done. Auto-scaling dynamically adjusts thread count to match traffic while maintaining configurable wait time limits.
- **Difficulty:** Intermediate
- **Dependencies:
  - FPM Pool Sizing Formula
  - --

## Dependency Graph
**Depends on:**
  - FPM Pool Sizing Formula
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Setting max_threads too high
  - Vehicle model
  - Runtime selection flow

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