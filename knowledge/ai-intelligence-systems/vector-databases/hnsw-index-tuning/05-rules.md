## Tune `ef_search` Per-Query Based on Latency Budget
---
## Category
Performance
---
## Rule
Set `ef_search` programmatically per query based on the specific latency requirement and recall needs; avoid using a single global value for all queries.
---
## Reason
Not all queries need the same recall. Real-time user-facing queries benefit from fast response (lower `ef_search`), while background batch processing can afford higher recall (higher `ef_search`). A fixed value either wastes speed budget on recall-insensitive queries or underserves recall-critical ones.
---
## Bad Example
```php
// Global setting — same for all queries
DB::statement('SET hnsw.ef_search = 40');
```
---
## Good Example
```php
public function search(float $latencyBudget): Collection {
    $efSearch = match(true) {
        $latencyBudget < 50 => 40,   // Fast: 10ms, ~95% recall
        $latencyBudget < 200 => 100,  // Balanced: 25ms, ~99% recall
        default => 400,                // High recall: 100ms, ~99.9%
    };
    DB::statement("SET LOCAL hnsw.ef_search = {$efSearch}");
    return DocumentChunk::orderByVectorSimilarTo(...)->get();
}
```
---
## Exceptions
Single-workload applications with consistent latency requirements may use a fixed value tuned to their specific workload.
---
## Consequences Of Violation
Unnecessary latency on speed-critical queries, or insufficient recall on quality-critical queries.

## Monitor Recall with Brute-Force Comparison
---
## Category
Testing | Performance
---
## Rule
Periodically sample queries and run brute-force (exact) search alongside HNSW to measure recall@K; never assume HNSW is maintaining target recall without measurement.
---
## Reason
HNSW is approximate — recall can degrade as vector distribution shifts, data is appended, or index parameters become suboptimal. Regular recall measurement detects degradation and triggers re-tuning or index rebuild before quality drops below acceptable thresholds.
---
## Bad Example
```php
// No recall monitoring — recall degradation goes undetected
```
---
## Good Example
```php
public function measureRecall(Collection $testQueries, int $k = 10): float {
    $hits = 0;
    foreach ($testQueries as $query) {
        $hnswIds = $this->hnswSearch($query, $k)->pluck('id');
        $exactIds = $this->bruteForceSearch($query, $k)->pluck('id');
        $hits += $hnswIds->intersect($exactIds)->count();
    }
    $recall = $hits / ($testQueries->count() * $k);
    Log::info('HNSW recall', ['recall@' . $k => $recall]);
    return $recall;
}
```
---
## Exceptions
When brute-force search is computationally prohibitive (50M+ vectors), sample a smaller subset for evaluation.
---
## Consequences Of Violation
Undetected recall degradation, gradual RAG quality decline, user-reported relevance issues.

## Increase `maintenance_work_mem` for Index Builds
---
## Category
Performance
---
## Rule
Set `maintenance_work_mem` to 1-4GB before building an HNSW index on large tables (1M+ vectors); never use the default on large datasets.
---
## Reason
HNSW index build is memory-intensive. With default `maintenance_work_mem` (64MB), index creation on millions of vectors takes hours. Increasing it to 1-4GB can reduce build time by 5-10x. The setting applies per session during the index build.
---
## Bad Example
```php
// Using default maintenance_work_mem — slow index build
DB::statement('CREATE INDEX ...');
```
---
## Good Example
```php
DB::statement('SET maintenance_work_mem = "4GB"');
DB::statement('CREATE INDEX chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64)');
```
---
## Exceptions
Small tables (<100K vectors) build quickly with default settings — no need to increase.
---
## Consequences Of Violation
Slow index builds prolong deployment windows, discourage necessary index rebuilds, suboptimal index performance.
