# Decomposition: Performance Profiling & Bottleneck Detection

## Topic Overview
Performance profiling goes beyond APM's request-level tracing to identify exactly which functions, queries, and I/O operations consume CPU time and memory. Blackfire is the dominant profiling tool in the Laravel ecosystem, providing flame graphs, call graphs, and CI-enforced performance budgets. Profiling is essential for diagnosing latency that APM aggregates cannot explain — such as slow functions, memory leaks, or excessive object allocations.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
application-performance-monitoring/performance-profiling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Performance Profiling & Bottleneck Detection
- **Purpose:** Performance profiling goes beyond APM's request-level tracing to identify exactly which functions, queries, and I/O operations consume CPU time and memory. Blackfire is the dominant profiling tool in the Laravel ecosystem, providing flame graphs, call graphs, and CI-enforced performance budgets. Profiling is essential for diagnosing latency that APM aggregates cannot explain — such as slow functions, memory leaks, or excessive object allocations.
- **Difficulty:** Advanced
- **Dependencies:
  - APM Tool Integration & Comparison (complementary always-on monitoring)
  - N+1 Query Detection (common Laravel bottleneck found via profiling)
  - OpenTelemetry PHP SDK (OTel profiling signal, emerging)

## Dependency Graph
**Depends on:**
  - APM Tool Integration & Comparison (complementary always-on monitoring)
  - N+1 Query Detection (common Laravel bottleneck found via profiling)
  - OpenTelemetry PHP SDK (OTel profiling signal, emerging)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Flame graph
  - Call graph
  - Sampling profiler
  - Instrumenting profiler
  - Wall-clock time vs CPU time
  - Memory profiling
  - CI performance regression detection

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