---
## Rule Name
Use Production-Representative Data for Benchmarks

## Category
Testing

## Rule
Always benchmark with production-representative data and query distributions, not synthetic data.

## Reason
Synthetic data does not reflect real-world vector distributions, query patterns, or filter selectivity. Benchmarks on synthetic data give misleading results.

## Bad Example
```python
# Random synthetic vectors — not representative
vectors = np.random.rand(100000, 1536).tolist()
```

## Good Example
```python
# Real embeddings from production data
vectors = load_production_embeddings()
```

## Exceptions
Pre-production applications with no production data yet (use proxy data from similar domains).

## Consequences Of Violation
Misleading benchmark results leading to wrong index selection, parameter tuning, and capacity planning.

---
## Rule Name
Measure P95 Latency, Not Just Average

## Category
Performance

## Rule
Always measure P95 and P99 latency in vector search benchmarks, not just average latency.

## Reason
Average latency hides tail latency that affects real user experience. A system with 10ms average but 500ms P99 provides poor UX.

## Bad Example
```python
# Average only — hides tail latency
avg_latency = sum(latencies) / len(latencies)
```

## Good Example
```python
import numpy as np
p50 = np.percentile(latencies, 50)
p95 = np.percentile(latencies, 95)
p99 = np.percentile(latencies, 99)
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Deploying a system that appears fast in benchmarks but has unacceptable tail latency for users.

---
## Rule Name
Test Multiple Index Configurations

## Category
Testing

## Rule
Always benchmark multiple index configurations (HNSW params, IVFFlat lists, quantization) before choosing.

## Reason
No single configuration is optimal for all datasets. Different data sizes and query patterns require different tuning.

## Bad Example
```bash
# Single config tested — may miss better options
```

## Good Example
```python
configs = [
    {'index': 'hnsw', 'm': 16, 'ef_construction': 200},
    {'index': 'hnsw', 'm': 32, 'ef_construction': 300},
    {'index': 'ivfflat', 'lists': 100},
    {'index': 'ivfflat', 'lists': 500},
]
results = [benchmark(c) for c in configs]
best = max(results, key=lambda r: r['recall_vs_latency'])
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Suboptimal configuration missing better recall/latency tradeoffs.

---
## Rule Name
Include Index Build Time in Evaluation

## Category
Testing

## Rule
Always measure and report index build time alongside query performance in benchmarks.

## Reason
Index build time affects deployment velocity and operational cost. A fast query index that takes 10 hours to build may be impractical.

## Bad Example
```python
# Only measuring query performance
# Index took 12 hours — not sustainable for regular rebuilds
```

## Good Example
```python
hnsw_results = {'query_latency_ms': 5, 'recall': 0.99, 'build_time_min': 120}
ivfflat_results = {'query_latency_ms': 15, 'recall': 0.95, 'build_time_min': 10}
# Tradeoff: HNSW better queries but 12x build time
```

## Exceptions
Static datasets requiring only one index build.

## Consequences Of Violation
Choosing an index type that is impractical to rebuild at required frequency.
