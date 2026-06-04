---
## Rule Name
Benchmark Recall vs Latency Before Tuning

## Category
Performance

## Rule
Always benchmark recall vs latency curves for your specific dataset before tuning vector search parameters.

## Reason
Parameter tuning without benchmarks is guesswork. The recall/latency tradeoff varies by data distribution and query patterns.

## Bad Example
```php
// Guessing parameters without benchmarks
'hnsw_ef_search' => 200  // Arbitrary
```

## Good Example
```php
$testResults = [];
foreach ([50, 100, 200, 400] as $ef) {
    $latency = benchmark(fn() => Document::nearestNeighbors($vector, 10, efSearch: $ef));
    $testResults[] = ['ef' => $ef, 'p95' => $latency['p95'], 'recall' => $latency['recall']];
}
// Choose best tradeoff
```

## Exceptions
Prototyping with very small datasets where default parameters suffice.

## Consequences Of Violation
Suboptimal performance — either slower than necessary or lower recall than achievable.

---
## Rule Name
Tune ef_search as Primary HNSW Lever

## Category
Performance

## Rule
Use ef_search as the primary tuning lever for HNSW recall vs latency tradeoff.

## Reason
ef_search directly controls search breadth in HNSW. Increasing it improves recall with predictable latency cost. Start at 100 and increase until recall targets are met.

## Bad Example
```php
// Not tuning ef_search — stuck with default
return Document::nearestNeighbors($vector, 10);
```

## Good Example
```php
// pgvector: SET hnsw.ef_search = 200;
DB::statement('SET hnsw.ef_search = 200');
return Document::nearestNeighbors($vector, 10)->get();
```

## Exceptions
Using IVFFlat index, where probes is the primary tuning lever instead.

## Consequences Of Violation
Missed opportunity to improve recall at minimal latency cost.

---
## Rule Name
Use Quantization to Reduce Memory Footprint

## Category
Performance

## Rule
Evaluate quantization (binary, scalar, product) for any vector dataset exceeding available RAM.

## Reason
Quantization reduces memory usage 4-32x with manageable recall loss (binary + rescoring achieves ~98% recall).

## Bad Example
```php
// Full precision vectors exceed RAM
// OOM or swapping
```

## Good Example
```php
// pgvector: halfvec for half precision (2x memory savings)
DB::statement('ALTER TABLE items ADD COLUMN embedding halfvec(1536)');
// Or use binary quantization for 32x savings
```

## Exceptions
Datasets small enough to fit in RAM without compression.

## Consequences Of Violation
OOM crashes, swapping, and severely degraded query performance under load.

---
## Rule Name
Profile Memory for Vectors Plus Index Overhead

## Category
Scalability

## Rule
Always account for index overhead when sizing memory for vector search (HNSW requires 1.5-2x the raw vector size).

## Reason
Raw vector sizes underestimate total memory. HNSW graph structures add significant memory overhead beyond the vectors themselves.

## Bad Example
```bash
# 1M vectors at 1536 dims = 6GB — but HNSW needs 9-12GB total
# Under-provisioned host
```

## Good Example
```bash
# HNSW memory = vectors (6GB) + index overhead (3-6GB) = 9-12GB
# Provision 16GB host for safety margin
```

## Exceptions
Using IVFFlat indexes which have lower memory overhead.

## Consequences Of Violation
OOM errors during index build or query time, requiring emergency scaling.
