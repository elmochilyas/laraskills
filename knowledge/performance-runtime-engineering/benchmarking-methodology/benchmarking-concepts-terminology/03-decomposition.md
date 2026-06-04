# Decomposition: Benchmarking Concepts Terminology

## Topic Overview
Performance benchmarking measures four core metrics: **throughput** (requests per second — capacity), **latency** (response time — speed, reported as percentiles p50/p95/p99), **error rate** (percentage of failed requests — reliability), and **resource utilization** (CPU/memory — efficiency). Understanding these metrics and their statistical properties is essential before running any benchmark.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
benchmarking-methodology/benchmarking-concepts-terminology/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Benchmarking Concepts Terminology
- **Purpose:** Performance benchmarking measures four core metrics: **throughput** (requests per second — capacity), **latency** (response time — speed, reported as percentiles p50/p95/p99), **error rate** (percentage of failed requests — reliability), and **resource utilization** (CPU/memory — efficiency). Understanding these metrics and their statistical properties is essential before running any benchmark.
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
  - Reporting only average latency
  - Thermometer model
  - Iterative benchmarking protocol

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