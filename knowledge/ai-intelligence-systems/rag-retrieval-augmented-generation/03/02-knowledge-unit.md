# Knowledge Unit: Embedding Generation

## Metadata

- **ID:** ku-03
- **Subdomain:** Retrieval-Augmented Generation
- **Slug:** embedding-generation
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Embedding generation converts text into dense vector representations that capture semantic meaning. In RAG systems, embeddings are the foundation of retrieval â€” documents are embedded and stored in a vector index; queries are embedded with the same model, and the vector database finds the nearest neighbors. The choice of embedding model, dimensions, and generation strategy directly impacts retrieval quality, storage requirements, and query latency.

## Core Concepts

- **Embedding Model:** A neural network that maps text to a vector space. Common models: OpenAI text-embedding-3-small/large, BGE, E5, Instructor, Cohere Embed.
- **Vector Dimensions:** The length of the embedding vector. Higher dimensions capture more information but require more storage. Typical: 384 (small), 768 (medium), 1536 (OpenAI), 3072 (OpenAI large).
- **Normalization:** Embedding vectors are typically normalized to unit length for cosine similarity search.
- **Batch Embedding:** Generating embeddings for multiple texts in a single API call (more efficient than individual calls).
- **Query Embedding vs. Document Embedding:** Some embedding models support asymmetric embeddings (different prefixes for query and document texts).
- **Dimensionality Reduction:** Reducing embedding dimensions post-generation (e.g., via PCA or Matryoshka embeddings) to save storage and speed up search.
- **Embedding Caching:** Caching query embeddings to avoid redundant API calls for repeated or similar queries.

## Mental Models

- **Embedding Model:** A neural network that maps text to a vector space. Common models: OpenAI text-embedding-3-small/large, BGE, E5, Instructor, Cohere Embed.
- **Vector Dimensions:** The length of the embedding vector. Higher dimensions capture more information but require more storage. Typical: 384 (small), 768 (medium), 1536 (OpenAI), 3072 (OpenAI large).
- **Normalization:** Embedding vectors are typically normalized to unit length for cosine similarity search.


## Internal Mechanics

The internal mechanics of Embedding Generation follow established patterns within the Retrieval-Augmented Generation domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Use the same embedding model** for indexing and querying. Different models produce incompatible vector spaces.
- **Choose an embedding model based on your domain.** General-purpose models (OpenAI, BGE) work for most use cases; domain-specific models (medical, legal, code) are available.
- **Prefer higher dimensions for general search** (1536 OpenAI), lower dimensions for speed/cost optimization (384-768).
- **Batch embedding requests** for indexing pipelines â€” 100-1000 texts per batch is optimal.
- **Use Matryoshka embeddings** (OpenAI text-embedding-3) â€” you can truncate dimensions without re-embedding.
- **Cache query embeddings** with TTL based on query freshness requirements.

## Patterns

- **Use the same embedding model** for indexing and querying. Different models produce incompatible vector spaces.
- **Choose an embedding model based on your domain.** General-purpose models (OpenAI, BGE) work for most use cases; domain-specific models (medical, legal, code) are available.
- **Prefer higher dimensions for general search** (1536 OpenAI), lower dimensions for speed/cost optimization (384-768).
- **Batch embedding requests** for indexing pipelines â€” 100-1000 texts per batch is optimal.
- **Use Matryoshka embeddings** (OpenAI text-embedding-3) â€” you can truncate dimensions without re-embedding.
- **Cache query embeddings** with TTL based on query freshness requirements.

## Architectural Decisions

- Implement the embedding service as a **provider-agnostic interface** `EmbeddingService` with adapters for different providers.
- Use the same **provider abstraction layer** (llm-provider-abstraction) for embeddings as for chat completions.
- Store embedding model metadata (model name, dimensions, normalization) in the **configuration** for the vector database.
- For large-scale indexing, use a **dedicated embedding worker** (queue job) that processes chunks in batches.
- Implement **embedding health checks** â€” periodically verify that the embedding model produces consistent vector magnitudes and directions.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Embedding latency: 50-200ms per API call (batch of 100-1000 texts is similar latency to a single call).
- Embedding throughput: OpenAI limits at ~3000 RPM for text-embedding-3-small. Plan indexing pipelines accordingly.
- Local embedding models: BGE-small runs at 100+ texts/second on a consumer GPU; BERT-based on CPU at 10-20 texts/second.
- Vector dimensions vs. search speed: 384-dim vectors search 4x faster than 1536-dim with the same index.
- Batch size tuning: optimal batch size depends on provider (OpenAI: 100-500, local: 50-200).

## Production Considerations

- **Data sent to embedding providers:** Embedding API calls send text content to the provider. Ensure the embedding provider's data handling meets your compliance requirements.
- **Embedding reversal:** Recent research shows embeddings can be partially reversed to recover training data. Be cautious about embedding sensitive information.
- **Local embedding for sensitive data:** For PII or confidential data, use a local embedding model (BGE, E5) instead of sending data to third-party APIs.
- **Cache security:** Embedding caches may store vectors of sensitive queries. Apply the same access controls as the source data.
- **Model provenance:** If using open-source embedding models, verify the model source and checksums.

## Common Mistakes

- Using different embedding models for indexing and querying â€” vectors are in incompatible spaces.
- Not normalizing embeddings â€” cosine similarity assumes unit-length vectors.
- Embedding each chunk individually (no batching) â€” 10x slower than batch embedding.
- Not considering embedding costs â€” embedding 1M documents costs real money (OpenAI: ~$0.13/1M tokens).
- Using too many dimensions â€” 1536-dim vectors when 384 would suffice wastes storage and search time.

## Failure Modes

- **Embedding Everything:** Embedding every piece of text without considering whether it will be useful for retrieval.
- **Provider Lock-In:** Using a proprietary embedding model that makes it impossible to switch providers later.
- **Re-Embedding Everything:** Re-embedding the entire corpus when changing embedding models. Use versioned embeddings.
- **No Embedding Monitoring:** Not tracking embedding latency, error rate, and cost over time.
- **One-Shot Embedding:** Embedding documents once at index time without considering that documents may be updated.

## Ecosystem Usage

### Embedding Service Interface
```php
interface EmbeddingService {
    /** @param string[] $texts */
    public function embedMany(array $texts): array; // returns float[][]
    public function embed(string $text): array;
    public function dimensions(): int;
    public function model(): string;
}

class OpenAIEmbeddingService implements EmbeddingService {
    public function __construct(
        private LLMProvider $provider,
        private string $model = 'text-embedding-3-small',
        private int $dimensions = 1536,
    ) {}

    public function embedMany(array $texts): array {
        // Batch embed with configurable dimensions (Matryoshka)
        return $this->provider->embeddings(new EmbeddingRequest(
            input: $texts,
            model: $this->model,
            dimensions: $this->dimensions,
        ))->vectors;
    }
}
```

### Embedding Cache
```php
class EmbeddingCache {
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
}
```

## Related Knowledge Units

- ku-01 (RAG Architecture Fundamentals): Embedding is part of the RAG pipeline.
- ku-02 (Document Chunking): Chunks are what get embedded.
- ku-05 (Retrieval Quality): Embedding quality impacts retrieval accuracy.
- vector-database-integration/ku-01: Vector DB stores and searches embeddings.
- llm-provider-abstraction/ku-01: Provider abstraction for embedding services.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

