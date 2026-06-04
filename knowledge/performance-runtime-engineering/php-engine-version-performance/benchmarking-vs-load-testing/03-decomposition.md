# Decomposition: Benchmarking Vs Load Testing

## Topic Overview
**Benchmarking** measures maximum throughput capacity under idealized conditions (synthetic load, fixed endpoint). **Load testing** simulates realistic user journeys with think times, variable concurrency, and multiple endpoints. Benchmarking tells you the ceiling; load testing tells you how your system behaves under that ceiling.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/benchmarking-vs-load-testing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Benchmarking Vs Load Testing
- **Purpose:** **Benchmarking** measures maximum throughput capacity under idealized conditions (synthetic load, fixed endpoint). **Load testing** simulates realistic user journeys with think times, variable concurrency, and multiple endpoints. Benchmarking tells you the ceiling; load testing tells you how your system behaves under that ceiling.
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
  - Benchmarking
  - Benchmarking with Hello World
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