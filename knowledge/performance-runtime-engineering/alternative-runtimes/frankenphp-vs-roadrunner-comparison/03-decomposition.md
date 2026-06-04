# Decomposition: Frankenphp Vs Roadrunner Comparison

## Topic Overview
FrankenPHP and RoadRunner serve the same market but differ fundamentally: **FrankenPHP** is a single binary with embedded PHP (simplicity), **RoadRunner** is a Go application server with separate PHP workers (flexibility). FrankenPHP offers 3-5x throughput vs FPM with minimal ops overhead. RoadRunner offers 41-111% improvement with a richer plugin ecosystem. Choice depends on operational priorities.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/frankenphp-vs-roadrunner-comparison/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Frankenphp Vs Roadrunner Comparison
- **Purpose:** FrankenPHP and RoadRunner serve the same market but differ fundamentally: **FrankenPHP** is a single binary with embedded PHP (simplicity), **RoadRunner** is a Go application server with separate PHP workers (flexibility). FrankenPHP offers 3-5x throughput vs FPM with minimal ops overhead. RoadRunner offers 41-111% improvement with a richer plugin ecosystem. Choice depends on operational priorities.
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