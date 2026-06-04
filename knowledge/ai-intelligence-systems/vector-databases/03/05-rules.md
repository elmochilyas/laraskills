## Prefer Pre-Filtering Over Post-Filtering

---
## Category
Performance | Reliability

---
## Rule
Apply metadata filters before vector search (pre-filtering) whenever possible; never rely on post-filtering for selective filters that match fewer than 50% of vectors.

---
## Reason
Post-filtering retrieves top-K results and then discards those that don't match the filter. If the filter is selective (matches only 10% of data), you effectively divide K by 10 — retrieving 10 and keeping 1. Pre-filtering narrows the search space first, preserving effective K.

---
## Bad Example
```php
// Post-filtering — may return fewer than K results
$results = $this->vectorStore->search($vector, topK: 10);
$filtered = array_filter($results, fn($r) => $r->tenant_id === $tenantId);
// May return 0-2 results instead of 10
```

---
## Good Example
```php
// Pre-filtering — search only within the tenant's documents
$results = $this->vectorStore->search(
    vector: $vector,
    topK: 10,
    filter: ['tenant_id' => $tenantId],
);
```

---
## Exceptions
Filters that match >90% of data (low selectivity) may use post-filtering without significant impact.

---
## Consequences Of Violation
Insufficient results after filtering, poor recall for selective queries, wasted retrieval of unauthorized data.

---

## Standardize Filter Syntax Across Providers

---
## Category
Maintainability | Architecture

---
## Rule
Define a standardized filter expression syntax in the vector store abstraction and translate it to each provider's native format; never use provider-specific filter syntax in application code.

---
## Reason
Every vector DB provider uses different filter syntax (Qdrant uses `should`/`must`, Pinecone uses `$eq`/`$in`, pgvector uses SQL WHERE). Provider-specific filters scattered through the codebase make migration impossible.

---
## Bad Example
```php
// Qdrant-specific filter syntax
$results = $qdrantStore->search(
    vector: $v,
    filter: ['must' => [['key' => 'status', 'match' => ['value' => 'active']]]]
);
// Cannot migrate to Pinecone without rewriting every query
```

---
## Good Example
```php
interface VectorQueryBuilder {
    public function where(string $field, string $operator, mixed $value): self;
    public function whereIn(string $field, array $values): self;
    public function whereBetween(string $field, float $min, float $max): self;
}

// Provider-agnostic usage:
$results = $store->query($vector)
    ->where('status', 'eq', 'active')
    ->whereIn('tenant_id', $user->tenantIds)
    ->whereBetween('price', 10, 100)
    ->topK(10)
    ->get();

// Translator inside each provider adapter converts to native syntax
```

---
## Exceptions
Single-provider applications never expected to migrate may use native filter syntax.

---
## Consequences Of Violation
Provider lock-in, migration requires rewriting all query code, increased migration risk.

---

## Set a Minimum Score Threshold

---
## Category
Reliability | Performance

---
## Rule
Configure a minimum similarity score threshold to filter out low-relevance results; never return results below the relevance threshold.

---
## Reason
Vector search always returns top-K results regardless of how low the similarity scores are. Without a threshold, users see irrelevant results when the query has no good match in the corpus, eroding trust.

---
## Bad Example
```php
$results = $this->vectorStore->search($vector, topK: 10);
// Returns all 10, even with similarity 0.05 — noise
```

---
## Good Example
```php
$results = $this->vectorStore->search(
    vector: $vector,
    topK: 10,
    minScore: 0.7, // Only return results above 0.7 similarity
);

if (empty($results->matches)) {
    return ['error' => 'No relevant results found', 'suggestion' => 'Try a different query'];
}
```

---
## Exceptions
Exploratory search interfaces where users expect to see broad results may use a lower threshold (0.5) or no threshold.

---
## Consequences Of Violation
Users see irrelevant results, eroding trust in search quality, poor user experience.

---

## Implement Hybrid Search for Text Corpora

---
## Category
Reliability | Design

---
## Rule
Combine vector similarity with keyword (BM25/full-text) search using reciprocal rank fusion for text corpora; never use pure vector search for text document retrieval.

---
## Reason
Vector search captures semantic meaning but fails on exact matches (proper nouns, product codes, IDs, rare terms). Keyword search excels at these. Hybrid search with RRF combines both strengths for significantly better recall.

---
## Bad Example
```php
// Pure vector search — misses exact matches
public function search(string $query): array {
    $vector = $this->embedder->embed($query);
    return $this->vectorStore->search($vector, 10);
}
```

---
## Good Example
```php
class HybridSearch {
    public function search(string $query, array $vector, int $topK = 10): array {
        [$vectorResults, $keywordResults] = parallel([
            fn() => $this->vectorStore->search($vector, $topK * 2),
            fn() => $this->fullTextSearch->search($query, $topK * 2),
        ]);

        return $this->reciprocalRankFusion(
            $vectorResults,
            $keywordResults,
            $topK,
            k: 60,
        );
    }
}
```

---
## Exceptions
Non-text vector search (image similarity, audio fingerprinting) does not benefit from keyword search.

---
## Consequences Of Violation
Poor recall for exact matches, users cannot find documents by name/code/ID, degraded search for proper nouns.

---

## Cache Frequent Query Results

---
## Category
Performance

---
## Rule
Cache vector search results for frequent queries using a semantic cache; never repeat the same search for identical or near-identical queries.

---
## Reason
Vector search involves embedding generation (50-200ms) and ANN search (5-50ms). Caching eliminates both costs for repeated queries, improving latency and reducing API costs. Typical cache hit rates are 20-40%.

---
## Bad Example
```php
public function search(string $query): array {
    $vector = $this->embedder->embed($query);
    return $this->vectorStore->search($vector, 10);
    // Re-embeds and re-searches for every identical query
}
```

---
## Good Example
```php
public function search(string $query): array {
    $cacheKey = 'search:' . md5($query);
    return Cache::remember($cacheKey, 60, function () use ($query) {
        $vector = $this->embedder->embed($query);
        return $this->vectorStore->search($vector, 10);
    });
}
```

---
## Exceptions
Real-time search where results must reflect the latest data (breaking news, live inventory) may bypass cache.

---
## Consequences Of Violation
Unnecessary embedding costs, higher latency for repeated queries, API rate limit pressure.
