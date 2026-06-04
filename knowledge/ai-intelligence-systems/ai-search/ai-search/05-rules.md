## Always Use Hybrid Search for Text

---
## Category
Design | Reliability

---
## Rule
Combine vector similarity with keyword (full-text) search using reciprocal rank fusion for all text search applications; never use pure vector search for text document retrieval.

---
## Reason
Pure vector search fails on exact matches — proper nouns, product codes, IDs, and rare terms. Keyword search handles these perfectly. Hybrid search with RRF combines both strengths for significantly better recall than either alone.

---
## Bad Example
```php
// Pure vector search — misses exact matches
$results = Document::query()
    ->orderByVectorSimilarTo('embedding', $embeddings->first())
    ->limit(10)
    ->get();
```

---
## Good Example
```php
$embeddings = Str::toEmbeddings($request->input('query'));

$results = Document::query()
    ->hybridSearch(
        vectorColumn: 'embedding',
        queryVector: $embeddings->first(),
        fullTextQuery: $request->input('query'),
        k: 60, // RRF constant
    )
    ->where('tenant_id', auth()->user()->tenant_id)
    ->limit(10)
    ->get();
```

---
## Exceptions
Non-text search (image similarity, audio fingerprinting) does not benefit from keyword search.

---
## Consequences Of Violation
Poor recall for exact matches, users cannot find documents by name/code/ID, degraded search quality.

---

## Cache Embeddings with Content-Hash Keys

---
## Category
Performance | Cost

---
## Rule
Cache query embeddings using a deterministic hash of the input text; never re-embed the same query text.

---
## Reason
Embedding API calls add 50-150ms latency and cost money per token. User queries have high repetition rates (60-80% cache hit rate typical). Caching eliminates redundant API calls and latency.

---
## Bad Example
```php
// Re-embeds every query — expensive and slow
$embeddings = Str::toEmbeddings($request->input('query'));
```

---
## Good Example
```php
class EmbeddingCache {
    public function generate(string $text): Embedding
    {
        $hash = md5($text);
        return Cache::remember("embedding:{$hash}", 86400, function () use ($text) {
            return Str::toEmbeddings($text)->first();
        });
    }
}

$embedding = (new EmbeddingCache)->generate($request->input('query'));
```

---
## Exceptions
Real-time search where the corpus changes every few seconds may use a shorter TTL or bypass cache.

---
## Consequences Of Violation
Unnecessary embedding API costs, higher latency, rate limit pressure from repeated queries.

---

## Tune ef_search for Latency-Recall Tradeoff

---
## Category
Performance

---
## Rule
Set `ef_search` based on latency requirements: 400 for high recall, 40 for low latency; never use the default without considering the tradeoff.

---
## Reason
`ef_search` controls the HNSW search beam width. Higher values improve recall but increase latency. The default may be too low (poor recall) or too high (unnecessary latency) for your use case.

---
## Bad Example
```php
// Default ef_search — may be too low for recall or too high for latency
DB::statement('CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)');
```

---
## Good Example
```php
// User-facing search: prioritize recall
DB::statement('CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200)');
// Set ef_search per query:
DB::statement('SET LOCAL hnsw.ef_search = 400');

// Autocomplete/suggestion: prioritize speed
DB::statement('SET LOCAL hnsw.ef_search = 40');
```

---
## Exceptions
Batch processing systems with no latency constraints may use ef_search=400+ for maximum recall.

---
## Consequences Of Violation
Poor recall with low ef_search, unnecessary latency with high ef_search, suboptimal user experience.

---

## Implement Tenant-Aware Metadata Filtering

---
## Category
Security

---
## Rule
Always filter search results by tenant ID or user permissions as part of the query; never allow cross-tenant data leakage in search results.

---
## Reason
Without tenant filtering, any user can search and discover documents belonging to other tenants. This is a critical data isolation requirement for multi-tenant applications.

---
## Bad Example
```php
// No tenant filter — all tenants see each other's data
$results = Document::query()
    ->orderByVectorSimilarTo('embedding', $embedding)
    ->limit(10)
    ->get();
```

---
## Good Example
```php
$results = Document::query()
    ->orderByVectorSimilarTo('embedding', $embedding)
    ->where('tenant_id', auth()->user()->tenant_id) // Mandatory filter
    ->limit(10)
    ->get();
```

---
## Exceptions
Single-tenant applications or public search over a shared corpus may skip tenant filtering.

---
## Consequences Of Violation
Cross-tenant data leakage, compliance violations, catastrophic data exposure.

---

## Log Queries and Clicks for Relevance Tuning

---
## Category
Observability | Maintainability

---
## Rule
Log every search query and click-through event for relevance analysis and A/B testing; never deploy search without analytics.

---
## Reason
Without query and click logging, you cannot measure search quality, identify failing queries, or tune relevance parameters. Analytics are essential for continuous improvement of search quality.

---
## Bad Example
```php
public function search(Request $request): array {
    // No logging — blind to search quality
    return $this->searchService->search($request->input('q'));
}
```

---
## Good Example
```php
public function search(Request $request): array {
    $query = $request->input('q');
    $startTime = microtime(true);

    $results = $this->searchService->search($query);

    SearchLog::create([
        'query' => $query,
        'user_id' => auth()->id(),
        'result_count' => count($results),
        'latency_ms' => (microtime(true) - $startTime) * 1000,
        'top_result_ids' => array_map(fn($r) => $r->id, array_slice($results, 0, 5)),
    ]);

    return $results;
}
```

---
## Exceptions
Prototype systems may defer analytics setup.

---
## Consequences Of Violation
Inability to measure improvement, undetected query failures, no data for relevance tuning.

---

## Use Async Queue-Based Indexing

---
## Category
Performance

---
## Rule
Dispatch embedding generation and indexing to a queue on document create/update; never block the user response on embedding generation.

---
## Reason
Embedding generation takes 200-500ms for batch indexing. Running synchronously in the request path makes document creation or update unacceptably slow for users.

---
## Bad Example
```php
public function store(Request $request): Response {
    $doc = Document::create($request->validated());
    // Synchronous embedding — user waits 200-500ms
    $doc->embedding = Str::toEmbeddings($doc->content)->first();
    $doc->save();
    return response()->json($doc, 201);
}
```

---
## Good Example
```php
public function store(Request $request): Response {
    $doc = Document::create($request->validated());
    dispatch(new GenerateEmbeddingJob($doc)); // Async
    return response()->json($doc, 201);
}

class GenerateEmbeddingJob implements ShouldQueue {
    public function handle(): void {
        $this->document->embedding = Str::toEmbeddings($this->document->content)->first();
        $this->document->save();
    }
}
```

---
## Exceptions
Small applications with very low document creation volume may index synchronously.

---
## Consequences Of Violation
Slow HTTP responses for document create/update, poor user experience, worker blocking.
