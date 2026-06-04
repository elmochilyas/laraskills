# Decomposition: Profiling Vs Monitoring

## Topic Overview
**Profiling** captures detailed execution snapshots (call stacks, memory allocation, timing) for deep analysis of specific requests. **Monitoring** aggregates summary metrics (average latency, error rate, CPU/memory) continuously across all traffic. Profiling answers "why is this slow?" Monitoring answers "is the system healthy?" Both are essential and serve different purposes.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
php-engine-performance/profiling-vs-monitoring/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Profiling Vs Monitoring
- **Purpose:** **Profiling** captures detailed execution snapshots (call stacks, memory allocation, timing) for deep analysis of specific requests. **Monitoring** aggregates summary metrics (average latency, error rate, CPU/memory) continuously across all traffic. Profiling answers "why is this slow?" Monitoring answers "is the system healthy?" Both are essential and serve different purposes.
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
  - Profiling
  - Profile first, then monitor
  - Using Xdebug in production
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