## Start with HNSW for Production Search

---
## Category
Performance | Architecture

---
## Rule
Use HNSW (Hierarchical Navigable Small World) as the default index type for production vector search workloads; avoid IVF unless memory constraints require it, and avoid flat (brute force) for any dataset over 1,000 vectors.

---
## Reason
HNSW provides the best balance of search speed (O(log n)), recall (95-99%), and insert performance for most production workloads (10K-10M vectors). IVF requires periodic offline rebuilds and has lower recall. Flat search is unusably slow beyond small datasets.

---
## Bad Example
```php
$store->createCollection('documents', dimensions: 1536);
// No index type specified — defaults to flat/brute force
```

---
## Good Example
```php
$store->createCollection('documents', dimensions: 1536, indexConfig: [
    'type' => 'hnsw',
    'm' => 16,
    'ef_construction' => 200,
]);
```

---
## Exceptions
Memory-constrained environments may use IVF+PQ (Product Quantization) to reduce memory 4-8x at 1-5% recall loss.

---
## Consequences Of Violation
Unacceptable search latency, poor recall, inability to scale beyond small datasets.

---

## Tune Index Parameters for Your Data

---
## Category
Performance

---
## Rule
Benchmark index parameters (efConstruction, M, efSearch) with your actual data and queries; never use default parameters without tuning.

---
## Reason
Default parameters are conservative and may not match your dataset's vector distribution, query patterns, or latency requirements. Tuning can improve recall by 5-15% or reduce latency by 2-5x.

---
## Bad Example
```php
// Default parameters — may be suboptimal
DB::statement('CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)');
```

---
## Good Example
```php
class IndexTuner {
    public function findOptimalConfig(VectorStore $store, array $testVectors, array $testQueries): array {
        $configs = [
            ['m' => 8, 'ef_construction' => 100, 'ef_search' => 40],
            ['m' => 16, 'ef_construction' => 200, 'ef_search' => 50],
            ['m' => 16, 'ef_construction' => 400, 'ef_search' => 100],
            ['m' => 32, 'ef_construction' => 200, 'ef_search' => 50],
        ];

        $results = [];
        foreach ($configs as $i => $config) {
            $store->createCollection("benchmark_{$i}", 1536, $config);
            $metrics = $this->benchmark->run($store, "benchmark_{$i}", $testVectors, $testQueries);
            $results["m={$config['m']}_efc={$config['ef_construction']}"] = $metrics;
        }

        return $results;
    }
}
```

---
## Exceptions
Prototype systems with small datasets (<10K vectors) may use default parameters.

---
## Consequences Of Violation
Suboptimal recall, higher latency, wasted memory — performance problems that could be solved with parameter tuning.

---

## Rebuild Indexes Periodically

---
## Category
Maintainability | Performance

---
## Rule
Schedule periodic index optimization or rebuilds based on insert volume; never let the index degrade indefinitely.

---
## Reason
Index quality degrades as vectors are added (5-20% recall loss over time for HNSW). Periodic rebuilds restore recall and search performance. The frequency depends on insert volume — rebuild weekly for high-throughput systems, monthly for low-churn.

---
## Bad Example
```php
// Index created once — never rebuilt
// Recall degrades silently as 100K+ vectors are added over months
```

---
## Good Example
```php
// Scheduled weekly rebuild
$schedule->call(function () {
    $collections = $this->vectorStore->listCollections();
    foreach ($collections as $collection) {
        $this->vectorStore->optimizeIndex($collection);
        Log::info('Index optimized', ['collection' => $collection]);
    }
})->weekly();

// Or full rebuild:
$schedule->call(function () {
    $this->vectorStore->rebuildIndex('documents');
})->monthly();
```

---
## Exceptions
Read-only indexes (static datasets that never change) do not need periodic rebuilds.

---
## Consequences Of Violation
Silent recall degradation, worsening search quality, users see increasingly irrelevant results.

---

## Choose Index Type Based on Workload

---
## Category
Architecture | Performance

---
## Rule
Select the index type based on the workload pattern: HNSW for real-time search with frequent inserts, IVF for large-scale batch search, PQ for memory-constrained environments; never use HNSW when RAM is insufficient.

---
## Reason
Each index type optimizes for a different workload. HNSW requires 2-4x raw vector size in RAM and supports incremental inserts. IVF uses less memory but requires periodic offline rebuilds. PQ compresses vectors but sacrifices recall.

---
## Bad Example
```php
// HNSW with M=32 on a memory-constrained server
// 1M vectors × 1536 dims × 4 bytes × 4x = ~24GB RAM needed
$store->createCollection('documents', 1536, ['type' => 'hnsw', 'm' => 32]);
// OOM or swap thrashing
```

---
## Good Example
```php
$vectorCount = 1_000_000;
$dimensions = 1536;
$rawSize = $vectorCount * $dimensions * 4; // ~6GB
$availableRAM = 8 * 1024**3; // 8GB

$config = match(true) {
    $availableRAM > $rawSize * 3 => ['type' => 'hnsw', 'm' => 16],
    $availableRAM > $rawSize * 1.1 => ['type' => 'ivf', 'nlist' => 4096],
    default => ['type' => 'ivf_pq', 'nlist' => 4096, 'pq_m' => 32],
};

$store->createCollection('documents', $dimensions, $config);
```

---
## Exceptions
When recall requirements are strict (>99%) and RAM is sufficient, use HNSW regardless of insert volume.

---
## Consequences Of Violation
Out-of-memory errors, swap thrashing, poor search latency, inability to fit the index in RAM.

---

## Benchmark Index Configurations Before Production

---
## Category
Testing | Reliability

---
## Rule
Run a benchmark script against candidate index configurations with a representative dataset before deploying to production; never deploy an untuned index.

---
## Reason
Index performance depends on dataset characteristics (vector distribution, dimensionality, cardinality). A configuration that works for one dataset may perform poorly for another. Benchmarking ensures the chosen configuration meets latency and recall targets.

---
## Bad Example
```php
// Deployed with default configuration — may be wrong for this data
$this->vectorStore->createCollection('documents', 1536, ['type' => 'hnsw']);
```

---
## Good Example
```php
class IndexBenchmark {
    public function run(Collection $testVectors, array $testQueries): array {
        $configs = [
            'hnsw_m8' => ['type' => 'hnsw', 'm' => 8, 'ef_construction' => 100],
            'hnsw_m16' => ['type' => 'hnsw', 'm' => 16, 'ef_construction' => 200],
            'hnsw_m32' => ['type' => 'hnsw', 'm' => 32, 'ef_construction' => 400],
        ];

        $results = [];
        foreach ($configs as $name => $config) {
            $store = $this->createBenchStore($name, $config);
            $store->insertBatch($testVectors);
            $metrics = $this->measurePerformance($store, $testQueries);
            $results[$name] = $metrics;
        }

        Log::info('Index benchmark results', $results);
        return $results;
    }
}
```

---
## Exceptions
Development or prototype systems may defer benchmarking until production deployment planning.

---
## Consequences Of Violation
Production performance surprises, inability to meet latency SLAs, wasted infrastructure costs from over-provisioning.
