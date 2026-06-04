## Use a Provider-Agnostic Embedding Interface

---
## Category
Architecture | Maintainability

---
## Rule
Implement the embedding service behind a provider-agnostic interface with adapters for different embedding providers; never couple application code directly to a specific embedding model provider.

---
## Reason
Embedding models and providers change frequently (new models, pricing changes, deprecations). A provider-agnostic interface allows switching embedding models without rewriting the RAG pipeline.

---
## Bad Example
```php
class RAGService {
    public function embed(string $text): array {
        $response = OpenAI::embeddings()->create([
            'model' => 'text-embedding-3-small',
            'input' => $text,
        ]);
        return $response->embeddings[0]->embedding;
        // Tightly coupled to OpenAI SDK
    }
}
```

---
## Good Example
```php
interface EmbeddingService {
    public function embed(string $text): array;
    public function embedMany(array $texts): array;
    public function dimensions(): int;
    public function model(): string;
}

class OpenAIEmbeddingAdapter implements EmbeddingService { /* ... */ }
class LocalBgeEmbeddingAdapter implements EmbeddingService { /* ... */ }

class RAGService {
    public function __construct(
        private EmbeddingService $embedder, // Injectable
    ) {}
}
```

---
## Exceptions
Single-provider applications not expected to switch may use the provider directly.

---
## Consequences Of Violation
Provider lock-in, difficult model upgrades, code changes required to switch embedding models.

---

## Batch Embedding Requests for Indexing

---
## Category
Performance

---
## Rule
Batch texts into groups of 100-1000 for embedding API calls during indexing; never embed one chunk at a time.

---
## Reason
Embedding APIs have similar latency for 1 text or 100 texts in a single call. Embedding individually multiplies latency by the number of chunks and consumes API rate limits unnecessarily.

---
## Bad Example
```php
public function indexDocument(Document $doc): void {
    foreach ($doc->chunks as $chunk) {
        $vector = $this->embedder->embed($chunk->content);
        $this->vectorStore->store($vector, $chunk->metadata);
        // One API call per chunk — 100x slower than batching
    }
}
```

---
## Good Example
```php
public function indexDocument(Document $doc): void {
    $batches = $doc->chunks->chunk(200);

    foreach ($batches as $batch) {
        $vectors = $this->embedder->embedMany(
            $batch->pluck('content')->all()
        );
        // Store with metadata
        foreach ($batch as $i => $chunk) {
            $this->vectorStore->store($vectors[$i], $chunk->metadata);
        }
    }
}
```

---
## Exceptions
Real-time embedding (query embedding in the user-facing path) is a single text and cannot be batched.

---
## Consequences Of Violation
10-100x slower indexing, rate limit exhaustion, unnecessary API costs from per-item overhead.

---

## Use Matryoshka Embeddings for Flexible Dimensions

---
## Category
Performance | Scalability

---
## Rule
Use embedding models that support Matryoshka representation learning (e.g., OpenAI text-embedding-3) and dimension truncation; never use fixed-dimension models when a flexible alternative is available.

---
## Reason
Matryoshka embeddings allow truncating dimensions without re-embedding. This enables using high dimensions for retrieval quality while truncating for storage efficiency — a single embedding serves both needs.

---
## Bad Example
```php
// text-embedding-ada-002 — always 1536 dimensions, no truncation
$response = $this->provider->embeddings(new EmbeddingRequest(
    input: $texts,
    model: 'text-embedding-ada-002',
));
// Cannot optimize storage/search speed without re-embedding
```

---
## Good Example
```php
// text-embedding-3-small — supports dimension truncation
$response = $this->provider->embeddings(new EmbeddingRequest(
    input: $texts,
    model: 'text-embedding-3-small',
    dimensions: 1536, // Full dimensions for quality
));

// Can truncate to 256 for fast search, 1536 for high-quality search
// without re-embedding
```

---
## Exceptions
When using local embedding models (BGE, E5) that do not support Matryoshka, accept the fixed dimensions.

---
## Consequences Of Violation
Storage waste from unnecessarily high dimensions, inability to optimize storage/speed tradeoff without re-embedding the entire corpus.

---

## Cache Query Embeddings

---
## Category
Performance

---
## Rule
Cache query embeddings with a configurable TTL so identical or similar queries do not require re-embedding; never re-embed frequently repeated queries.

---
## Reason
Embedding API calls add 50-200ms latency and consume API rate limits. Many user queries are repeated (common questions, rephrased searches). Caching eliminates redundant embedding costs and reduces latency.

---
## Bad Example
```php
public function query(string $query): RAGContext {
    $vector = $this->embedder->embed($query);
    // Re-embeds even when the same query was asked moments ago
    return $this->search($vector);
}
```

---
## Good Example
```php
class CachedEmbedder implements EmbeddingService {
    public function __construct(
        private EmbeddingService $inner,
        private Cache $cache,
        private int $ttlSeconds = 3600,
    ) {}

    public function embed(string $text): array {
        $key = 'embed:' . md5($text);
        return $this->cache->remember($key, $this->ttlSeconds, fn() =>
            $this->inner->embed($text)
        );
    }

    public function embedMany(array $texts): array {
        $uncached = [];
        $results = [];
        foreach ($texts as $i => $text) {
            $key = 'embed:' . md5($text);
            $cached = $this->cache->get($key);
            if ($cached) {
                $results[$i] = $cached;
            } else {
                $uncached[$i] = $text;
            }
        }
        if ($uncached) {
            $fresh = $this->inner->embedMany(array_values($uncached));
            foreach ($uncached as $i => $text) {
                $this->cache->put('embed:' . md5($text), $fresh[array_search($text, $uncached)], $this->ttlSeconds);
                $results[$i] = $fresh[array_search($text, $uncached)];
            }
        }
        ksort($results);
        return $results;
    }
}
```

---
## Exceptions
Queries that require real-time freshness (breaking news, live data) should bypass the cache.

---
## Consequences Of Violation
Unnecessary embedding costs, API rate limit exhaustion, 50-200ms added latency per repeated query.

---

## Use Local Embedding Models for Sensitive Data

---
## Category
Security

---
## Rule
Use local embedding models (BGE, E5) for documents containing PII or confidential information; never send sensitive content to third-party embedding API providers.

---
## Reason
Embedding API calls send the full text content to the provider. For sensitive data, this creates a data exposure risk — the provider processes and potentially stores the content. Local models process data entirely within your infrastructure.

---
## Bad Example
```php
// Sends sensitive legal documents to third-party API
$vectors = $this->openAIEmbedder->embedMany($legalDocs);
```

---
## Good Example
```php
class LocalBgeEmbedder implements EmbeddingService {
    public function __construct(
        private string $modelPath = '/models/bge-small-en-v1.5',
    ) {}

    public function embedMany(array $texts): array {
        // Runs locally — no data leaves the infrastructure
        return $this->runInference($texts);
    }
}

// Route based on sensitivity:
$embedder = $doc->isSensitive
    ? new LocalBgeEmbedder()
    : new OpenAIEmbeddingAdapter();
```

---
## Exceptions
Public, non-sensitive document corpora may use third-party embedding providers for convenience and quality.

---
## Consequences Of Violation
Data exposure to third-party providers, compliance violations (GDPR, HIPAA, SOC2), loss of data control.

---

## Monitor Embedding Quality and Costs

---
## Category
Observability | Cost

---
## Rule
Track embedding latency, error rate, cost, and dimensions in production metrics; never deploy embedding pipelines without monitoring.

---
## Reason
Embedding quality and costs change over time: provider pricing changes, models are deprecated, error rates vary. Without monitoring, regressions go undetected and costs silently increase.

---
## Bad Example
```php
public function embedMany(array $texts): array {
    $response = $this->client->embeddings($texts);
    return $response->vectors;
    // No metrics tracked
}
```

---
## Good Example
```php
class MonitoredEmbedder implements EmbeddingService {
    public function embedMany(array $texts): array {
        $startTime = microtime(true);
        $textCount = count($texts);

        try {
            $response = $this->inner->embedMany($texts);
            $latency = (microtime(true) - $startTime) * 1000;

            Metrics::histogram('embedding_latency_ms', $latency, ['model' => $this->model()]);
            Metrics::increment('embedding_calls_total', ['model' => $this->model()]);
            Metrics::histogram('embedding_batch_size', $textCount);
            Metrics::increment('embedding_tokens_total', $response->totalTokens ?? 0);

            return $response;
        } catch (\Throwable $e) {
            Metrics::increment('embedding_errors_total', ['model' => $this->model(), 'error' => get_class($e)]);
            throw $e;
        }
    }
}
```

---
## Exceptions
Development environments may skip detailed monitoring.

---
## Consequences Of Violation
Undetected cost increases, silent quality degradation from model changes, no visibility into pipeline performance.
