# Decomposition: Roadrunner Benchmark Performance

## Topic Overview
Independent benchmarks consistently show RoadRunner delivering **41-111% throughput improvement over PHP-FPM** across various PHP frameworks. The gain comes almost entirely from eliminating per-request bootstrap — once the Go scheduler and PHP workers are warmed up, every request avoids the 10-40ms framework initialization cost. RoadRunner's performance advantage is most pronounced for fast API endpoints (<100ms) and holds across mixed workloads.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
alternative-php-runtimes/roadrunner-benchmark-performance/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Roadrunner Benchmark Performance
- **Purpose:** Independent benchmarks consistently show RoadRunner delivering **41-111% throughput improvement over PHP-FPM** across various PHP frameworks. The gain comes almost entirely from eliminating per-request bootstrap — once the Go scheduler and PHP workers are warmed up, every request avoids the 10-40ms framework initialization cost. RoadRunner's performance advantage is most pronounced for fast API endpoints (<100ms) and holds across mixed workloads.
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