---
## Rule Name
Start with Keyword Search Before Adding Vector

## Category
Design

## Rule
Always establish a keyword search baseline before implementing vector search for hybrid retrieval.

## Reason
Many applications achieve sufficient recall with keyword search alone. Adding vector search increases cost, latency, and infrastructure complexity without guaranteed improvement.

## Bad Example
```php
// Adding vector search without keyword baseline
$vectorResults = VectorSearch::search($query, topK: 20);
```

## Good Example
```php
// Start with Scout keyword search
$keywordResults = Product::search($query)->take(20)->get();
// Only add vector search if recall metrics show gaps
// $vectorResults = VectorSearch::search($query, topK: 20);
```

## Exceptions
Applications where semantic understanding is critical from day one.

## Consequences Of Violation
Unnecessary infrastructure cost and complexity without measurable improvement.

---
## Rule Name
Parallelize Keyword and Vector Retrieval

## Category
Performance

## Rule
Always execute keyword and vector search queries concurrently, not sequentially.

## Reason
Hybrid search latency max(keyword, vector) + fusion. Sequential doubles latency.

## Bad Example
```php
// Sequential — double latency
$keywordResults = Product::search($query)->keys();
$vectorResults = VectorSearch::search($embeddings, topK: 100);
```

## Good Example
```php
// Parallel — latency = max of both
[$keyword, $vector] = await([
    async(fn() => Product::search($query)->keys()),
    async(fn() => VectorSearch::search($embeddings, topK: 100))
]);
$fused = rrfFusion($keyword, $vector);
```

## Exceptions
Single-engine native hybrid (Meilisearch, Typesense) where both paths run in one call.

## Consequences Of Violation
Double the query latency of single-path search, degrading user experience.

---
## Rule Name
Cap Candidate Pool at Top-100 Per Path

## Category
Performance

## Rule
Always limit retrieval to top-100 candidates per search path before fusion.

## Reason
Fusing more than top-100 candidates provides diminishing recall returns while increasing computation time and memory usage.

## Bad Example
```php
$keywordResults = Product::search($query)->take(1000)->keys();
$vectorResults = VectorSearch::search($embeddings, topK: 1000);
```

## Good Example
```php
$keywordResults = Product::search($query)->take(100)->keys();
$vectorResults = VectorSearch::search($embeddings, topK: 100);
$fused = rrfFusion($keywordResults, $vectorResults, topK: 20);
```

## Exceptions
Recall-sensitive applications where every percentage point matters and latency budget allows larger pools.

## Consequences Of Violation
Wasted computation on candidates unlikely to make the final top-K.

---
## Rule Name
Implement Graceful Degradation for Path Failures

## Category
Reliability

## Rule
Always handle individual path failures in hybrid search so the application degrades gracefully instead of returning a 500 error.

## Reason
Either retrieval path (keyword engine or vector store) can fail independently. A single path failure should not break the entire search.

## Bad Example
```php
try {
    $keyword = Product::search($query)->keys();
    $vector = VectorSearch::search($embeddings, topK: 100);
} catch (Exception $e) {
    abort(500);  // Entire search breaks on partial failure
}
```

## Good Example
```php
$keyword = rescue(fn() => Product::search($query)->keys(), []);
$vector = rescue(fn() => VectorSearch::search($embeddings, topK: 100), []);
// Still have fusion of partial or single-path results
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Complete search outage when only one retrieval path has an issue.

---
## Rule Name
Use Engine-Level Hybrid When Available

## Category
Architecture

## Rule
Prefer engine-level hybrid search (Meilisearch, Typesense, Qdrant native hybrid) over application-level fusion.

## Reason
Engine-level hybrid requires one API call, one infrastructure dependency, and no custom fusion code. It is simpler to maintain.

## Bad Example
```php
// Application-level fusion — more complexity
$keyword = Product::search($query)->keys();
$vector = Qdrant::search(...);
$fused = rrfFusion($keyword, $vector);
```

## Good Example
```php
// Meilisearch native hybrid — single call
$results = Product::search($query)
    ->options(['hybrid' => ['semanticRatio' => 0.7, 'embedder' => 'default']])
    ->get();
```

## Exceptions
Applications needing custom fusion logic (per-query-type weighting, cross-encoder re-ranking).

## Consequences Of Violation
Unnecessary complexity and maintenance burden when a simpler engine-level solution would suffice.
