---
## Rule Name
Use Engine-Level Hybrid When Available

## Category
Architecture

## Rule
Prefer engine-level hybrid search (Meilisearch, Typesense, Qdrant) over application-level fusion in Laravel.

## Reason
Engine-level hybrid requires one API call, one infrastructure dependency, and zero custom fusion code. It is simpler, faster, and easier to maintain.

## Bad Example
```php
// Application-level fusion — more code, two connections, more failure modes
$keyword = Product::search($query)->keys();
$vector = QdrantService::search($embeddings, topK: 100);
$fused = rrfFusion($keyword, $vector, k: 60);
```

## Good Example
```php
// Meilisearch native hybrid — single call, single engine
$results = Product::search($query)
    ->options(['hybrid' => ['semanticRatio' => 0.7, 'embedder' => 'default']])
    ->get();
```

## Exceptions
Applications needing custom fusion logic (per-query-type α, cross-encoder re-ranking, custom normalization).

## Consequences Of Violation
Unnecessary complexity, maintenance burden, and latency overhead from application-level fusion.

---
## Rule Name
Parallelize Application-Level Retrieval

## Category
Performance

## Rule
Always run keyword and vector retrieval concurrently when implementing application-level hybrid search.

## Reason
Sequential retrieval doubles latency. Concurrent retrieval makes hybrid search latency ≈ max(keyword, vector), not keyword + vector.

## Bad Example
```php
// Sequential — adds their latencies
$keyword = Product::search($query)->keys();
$vector = VectorSearch::search($embeddings, topK: 100);
```

## Good Example
```php
[$keyword, $vector] = await([
    async(fn() => Product::search($query)->keys()),
    async(fn() => VectorSearch::search($embeddings, topK: 100))
]);
$fused = rrfFusion($keyword, $vector);
```

## Exceptions
Using Laravel without async support (fall back to queued dispatch if available).

## Consequences Of Violation
Double the latency of a single-path search, degrading user experience.

---
## Rule Name
Abstract Retrieval Paths Behind an Interface

## Category
Maintainability

## Rule
Always abstract keyword and vector retrieval behind a PHP interface for testability and engine-switching.

## Reason
Hybrid search implementations often change engines (pgvector → Qdrant, Algolia → Meilisearch). An interface makes switching testable and isolated.

## Bad Example
```php
// Tightly coupled to specific SDKs
$meiliResults = MeiliSearch::search(...);
$qdrantResults = QdrantClient::search(...);
```

## Good Example
```php
interface SearchProvider {
    public function search(string $query, int $limit): array;
}
class MeilisearchProvider implements SearchProvider { ... }
class QdrantProvider implements SearchProvider { ... }
// Easy to switch implementations
```

## Exceptions
Engine-level hybrid where only one provider is used.

## Consequences Of Violation
High refactoring cost when changing search engines or adding new providers.

---
## Rule Name
Use Scout for the Keyword Path

## Category
Framework Usage

## Rule
Always use Laravel Scout for keyword search rather than building a custom keyword retrieval path.

## Reason
Scout provides queues, pagination, `whereIn` scoping, and engine abstraction. Rebuilding these features wastes development time.

## Bad Example
```php
// Raw Meilisearch SDK — rebuilding Scout features
$results = MeiliSearch::search($query)->raw();
```

## Good Example
```php
$keywordIds = Product::search($query)->take(100)->keys();
$products = Product::whereIn('id', $keywordIds)
    ->orderByRaw('FIELD(id,' . implode(',', $keywordIds) . ')')
    ->get();
```

## Exceptions
Vector store is also your Scout engine (e.g., Meilisearch handles both paths).

## Consequences Of Violation
Missing features (queues, pagination, scoping) and duplicated effort.
