---
## Rule Name
Use Engine-Native Hybrid When Available

## Category
Architecture

## Rule
Prefer engine-level hybrid search (Qdrant, Meilisearch, Typesense, Milvus native) over application-level fusion.

## Reason
Engine-level hybrid avoids maintaining two separate retrieval pipelines, reduces latency, and handles fusion internally.

## Bad Example
```php
// Application-level fusion — two queries, custom merge
$keywordIds = Product::search($query)->keys();
$vectorIds = VectorSearch::search($query, topK: 100);
$fused = rrfFusion($keywordIds, $vectorIds);
```

## Good Example
```php
// Engine-level hybrid — single query
$results = $qdrant->search(
    collection: 'products',
    query: $queryVector,
    sparseQuery: $querySparse,
    fusion: 'rrf'
);
```

## Exceptions
When using databases (pgvector) that lack native hybrid support.

## Consequences Of Violation
Unnecessary architectural complexity, doubled latency, and increased maintenance burden.

---
## Rule Name
Start with RRF Fusion

## Category
Design

## Rule
Always start hybrid search implementation with Reciprocal Rank Fusion (RRF) before trying weighted or cross-encoder approaches.

## Reason
RRF requires no score normalization, no training, and no tuning. It provides robust fusion with minimal implementation effort.

## Bad Example
```php
// Starting with complex cross-encoder setup
$results = $crossEncoder->rerank($query, $candidates);
// 500ms+ latency before baseline fusion established
```

## Good Example
```php
// Start simple
$fused = rrfFusion($keywordResults, $vectorResults, k: 60);
```

## Exceptions
Applications where cross-encoder quality improvement is proven necessary by benchmarks.

## Consequences Of Violation
Premature optimization, unnecessary latency, and complex infrastructure before establishing baseline.

---
## Rule Name
Parallelize Retrieval Paths

## Category
Performance

## Rule
Always run keyword and vector retrieval queries concurrently, not sequentially.

## Reason
Sequential retrieval doubles latency. Parallel execution reduces total hybrid search time to the slower of the two paths plus fusion overhead.

## Bad Example
```php
$keywordIds = Product::search($query)->take(100)->keys();
$vectorIds = VectorSearch::search($query, topK: 100); // Sequential — waits for keyword
```

## Good Example
```php
[$keywordIds, $vectorIds] = async([
    fn() => Product::search($query)->take(100)->keys(),
    fn() => VectorSearch::search($query, topK: 100),
]);
```

## Exceptions
Systems without async/parallel execution capabilities.

## Consequences Of Violation
Double the effective search latency, degrading user-perceived performance.

---
## Rule Name
Limit Candidate Pool Size

## Category
Performance

## Rule
Always cap candidate retrieval at top-100 per path before fusing; never retrieve thousands of candidates per path.

## Reason
Diminishing returns beyond top-100 per path. Larger pools increase latency with negligible recall improvement.

## Bad Example
```php
$keywordIds = Product::search($query)->take(1000)->keys();
$vectorIds = VectorSearch::search($query, topK: 1000);
// 10x more candidates — minimal benefit
```

## Good Example
```php
$keywordIds = Product::search($query)->take(100)->keys();
$vectorIds = VectorSearch::search($query, topK: 100);
```

## Exceptions
Applications requiring extremely high recall that benchmarks prove benefits from larger pools.

## Consequences Of Violation
Unnecessary latency increase and resource waste without meaningful quality improvement.

---
## Rule Name
Monitor Fusion Balance

## Category
Maintainability

## Rule
Always monitor each retrieval path's contribution to the final fused results to ensure balance.

## Reason
If one path dominates the fused results, the other path is wasted effort. Monitoring reveals path quality degradation early.

## Bad Example
```php
// No monitoring — assume both paths contribute equally
$fused = rrfFusion($keywordResults, $vectorResults);
```

## Good Example
```php
$fused = rrfFusion($keywordResults, $vectorResults);
$keywordContribution = count(array_intersect($fused, $keywordResults)) / count($fused);
// Alert if keywordContribution < 10% or > 90%
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Degraded hybrid quality undetected, wasted retrieval infrastructure, and silent path obsolescence.
