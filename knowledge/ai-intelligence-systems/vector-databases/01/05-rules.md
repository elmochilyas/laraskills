## Create an ANN Index Before Inserting Vectors

---
## Category
Performance

---
## Rule
Always create an ANN index (HNSW, IVF) on the vector column before inserting data; never search against unindexed vectors in production.

---
## Reason
Without an ANN index, the vector database performs brute-force (flat) search, comparing the query against every stored vector. This becomes unusably slow for datasets over 10K vectors — 100ms at 10K, 10s at 1M.

---
## Bad Example
```php
Schema::create('documents', function (Blueprint $table) {
    $table->vector('embedding', 1536);
    // No index — brute force search
});
```

---
## Good Example
```php
Schema::create('documents', function (Blueprint $table) {
    $table->vector('embedding', 1536);
});

DB::statement('CREATE INDEX documents_embedding_idx ON documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200)');
```

---
## Exceptions
Datasets under 1,000 vectors where brute-force search is fast enough may skip ANN index creation.

---
## Consequences Of Violation
Unusable search latency as dataset grows, poor user experience, excessive database CPU usage.

---

## Match Vector Dimensions to the Embedding Model

---
## Category
Reliability

---
## Rule
Configure the vector database collection dimensions to exactly match the embedding model's output dimensions; never guess or approximate dimension size.

---
## Reason
Mismatched dimensions cause the vector database to reject inserts, silently truncate vectors, or produce incorrect similarity scores. Every embedding model has a fixed output dimension (e.g., 384 for BGE-small, 1536 for OpenAI text-embedding-3-small).

---
## Bad Example
```php
$store->createCollection('documents', dimensions: 768);
// But embedding model output is 1536 — silent truncation or errors
```

---
## Good Example
```php
class DocumentIndexer {
    public function __construct(
        private EmbeddingService $embedder, // e.g., OpenAI: 1536 dims
        private VectorStore $store,
    ) {
        $this->store->createCollection(
            'documents',
            dimensions: $this->embedder->dimensions(), // 1536
            metric: 'cosine',
        );
    }
}
```

---
## Exceptions
When using Matryoshka embeddings with dimension truncation, match the truncated dimension, not the model's full dimension.

---
## Consequences Of Violation
Insert failures, silent data corruption, incorrect search results, wasted debugging time.

---

## Use an Abstract VectorStore Interface

---
## Category
Architecture | Maintainability

---
## Rule
Implement all vector database operations behind a provider-agnostic `VectorStore` interface; never couple application code directly to a specific vector DB client.

---
## Reason
Vector DB providers have different APIs, consistency models, and pricing. An abstraction layer allows switching providers (pgvector → Qdrant → Pinecone) without rewriting application code, and enables testing with mock implementations.

---
## Bad Example
```php
class SearchService {
    public function search(array $vector, int $topK): array {
        $response = OpenAI::embeddings()->create(/* ... */);
        // Direct Pinecone SDK call
        return Pinecone::query($response->embedding)->topK($topK)->get();
    }
}
```

---
## Good Example
```php
interface VectorStore {
    public function search(VectorQuery $query): SearchResult;
    public function insert(string $collection, array $vectors, array $metadata = []): void;
    public function delete(string $collection, array $ids): void;
}

class SearchService {
    public function __construct(
        private EmbeddingService $embedder,
        private VectorStore $store, // Provider-agnostic
    ) {}
}
```

---
## Exceptions
Single-provider applications never expected to switch may use the provider SDK directly.

---
## Consequences Of Violation
Provider lock-in, difficult migration, codebase coupled to vendor-specific APIs and types.

---

## Normalize Embeddings for Cosine Similarity

---
## Category
Reliability

---
## Rule
Normalize all embedding vectors to unit length before storing and querying when using cosine similarity; never store unnormalized vectors with cosine distance.

---
## Reason
Cosine similarity on non-normalized vectors produces incorrect rankings — vectors with larger magnitudes appear more similar even when their directions differ. Normalization ensures similarity is based on direction only.

---
## Bad Example
```php
$vector = $this->embedder->embed($text);
$this->store->insert('documents', [$vector], $metadata);
// Unnormalized — similarity rankings are skewed by magnitude
```

---
## Good Example
```php
function normalize(array $vector): array {
    $magnitude = sqrt(array_sum(array_map(fn($v) => $v * $v, $vector)));
    return $magnitude > 0
        ? array_map(fn($v) => $v / $magnitude, $vector)
        : $vector;
}

$vector = normalize($this->embedder->embed($text));
$this->store->insert('documents', [$vector], $metadata);
```

---
## Exceptions
When using dot product as the distance metric (instead of cosine), normalization is not required but must be consistent.

---
## Consequences Of Violation
Incorrect similarity rankings, poor retrieval quality, search results dominated by outlier vectors with large magnitudes.

---

## Store Source Document Metadata with Vectors

---
## Category
Maintainability | Security

---
## Rule
Store source document ID, chunk position, content type, and access control labels as metadata alongside every vector; never store vectors without traceable metadata.

---
## Reason
Without metadata, retrieved vectors cannot be traced back to their source documents, access control cannot be enforced, and filtering by source/date/type is impossible.

---
## Bad Example
```php
// Vector with no metadata — orphan in the index
$this->store->insert('documents', [$vector]);
// Cannot trace back to source, no filtering possible
```

---
## Good Example
```php
$this->store->insert('documents', [$vector], [[
    'document_id' => $doc->id,
    'chunk_position' => $chunk->position,
    'title' => $doc->title,
    'source_url' => $doc->url,
    'content_type' => $doc->type,
    'allowed_roles' => $doc->allowed_roles,
    'tenant_id' => $doc->tenant_id,
]]);
```

---
## Exceptions
No common exceptions. Metadata is mandatory for production vector stores.

---
## Consequences Of Violation
Untraceable results, no access control enforcement, no filtering, compliance violations.

---

## Validate Query Vectors Before Search

---
## Category
Reliability

---
## Rule
Validate query vectors for correct dimensions, finite values, and proper normalization before sending to the vector database; never send invalid vectors to search.

---
## Reason
Invalid vectors (wrong dimensions, NaN/Inf values, zero vectors) cause the vector database to return errors, produce incorrect results, or crash query workers.

---
## Bad Example
```php
public function search(string $query): array {
    $vector = $this->embedder->embed($query);
    return $this->store->search(new VectorQuery($vector, topK: 10));
    // May send NaN, wrong dimensions, or zero vector
}
```

---
## Good Example
```php
public function search(string $query): array {
    $vector = $this->embedder->embed($query);

    if (count($vector) !== $this->expectedDimensions) {
        throw new InvalidVectorException('Dimension mismatch');
    }

    if (array_reduce($vector, fn($c, $v) => $c || !is_finite($v), false)) {
        throw new InvalidVectorException('Vector contains non-finite values');
    }

    if (array_sum(array_map(fn($v) => $v * $v, $vector)) === 0.0) {
        throw new InvalidVectorException('Zero vector detected');
    }

    return $this->store->search(new VectorQuery($vector, topK: 10));
}
```

---
## Exceptions
Development environments may skip validation for debugging convenience.

---
## Consequences Of Violation
Database errors from invalid queries, silent incorrect results from dimension mismatches, query worker crashes.
