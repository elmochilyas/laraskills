---
id: ku-03
title: "Embedding Generation"
subdomain: "retrieval-augmented-generation"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/retrieval-augmented-generation/ku-03/04-standardized-knowledge.md"
---

# Embedding Generation

## Overview

Embedding generation converts text into dense vector representations that capture semantic meaning. In RAG systems, embeddings are the foundation of retrieval — documents are embedded and stored in a vector index; queries are embedded with the same model, and the vector database finds the nearest neighbors. The choice of embedding model, dimensions, and generation strategy directly impacts retrieval quality, storage requirements, and query latency.

## Core Concepts

- **Embedding Model:** A neural network that maps text to a vector space. Common models: OpenAI text-embedding-3-small/large, BGE, E5, Instructor, Cohere Embed.
- **Vector Dimensions:** The length of the embedding vector. Higher dimensions capture more information but require more storage. Typical: 384 (small), 768 (medium), 1536 (OpenAI), 3072 (OpenAI large).
- **Normalization:** Embedding vectors are typically normalized to unit length for cosine similarity search.
- **Batch Embedding:** Generating embeddings for multiple texts in a single API call (more efficient than individual calls).
- **Query Embedding vs. Document Embedding:** Some embedding models support asymmetric embeddings (different prefixes for query and document texts).
- **Dimensionality Reduction:** Reducing embedding dimensions post-generation (e.g., via PCA or Matryoshka embeddings) to save storage and speed up search.
- **Embedding Caching:** Caching query embeddings to avoid redundant API calls for repeated or similar queries.

## When To Use

- Every RAG system — embeddings are required for vector search.
- Semantic search applications beyond RAG (recommendation, clustering, deduplication).
- Agent memory systems that use semantic retrieval (ku-06 in agent-architecture).

## When NOT To Use

- Keyword-based search applications (BM25 or Elasticsearch is more appropriate).
- Applications where exact match is required (embeddings are approximate by nature).
- Very small knowledge bases (under 100 documents) where keyword search suffices.

## Best Practices

- **Use the same embedding model** for indexing and querying. Different models produce incompatible vector spaces.
- **Choose an embedding model based on your domain.** General-purpose models (OpenAI, BGE) work for most use cases; domain-specific models (medical, legal, code) are available.
- **Prefer higher dimensions for general search** (1536 OpenAI), lower dimensions for speed/cost optimization (384-768).
- **Batch embedding requests** for indexing pipelines — 100-1000 texts per batch is optimal.
- **Use Matryoshka embeddings** (OpenAI text-embedding-3) — you can truncate dimensions without re-embedding.
- **Cache query embeddings** with TTL based on query freshness requirements.

## Architecture Guidelines

- Implement the embedding service as a **provider-agnostic interface** `EmbeddingService` with adapters for different providers.
- Use the same **provider abstraction layer** (llm-provider-abstraction) for embeddings as for chat completions.
- Store embedding model metadata (model name, dimensions, normalization) in the **configuration** for the vector database.
- For large-scale indexing, use a **dedicated embedding worker** (queue job) that processes chunks in batches.
- Implement **embedding health checks** — periodically verify that the embedding model produces consistent vector magnitudes and directions.

## Performance Considerations

- Embedding latency: 50-200ms per API call (batch of 100-1000 texts is similar latency to a single call).
- Embedding throughput: OpenAI limits at ~3000 RPM for text-embedding-3-small. Plan indexing pipelines accordingly.
- Local embedding models: BGE-small runs at 100+ texts/second on a consumer GPU; BERT-based on CPU at 10-20 texts/second.
- Vector dimensions vs. search speed: 384-dim vectors search 4x faster than 1536-dim with the same index.
- Batch size tuning: optimal batch size depends on provider (OpenAI: 100-500, local: 50-200).

## Security Considerations

- **Data sent to embedding providers:** Embedding API calls send text content to the provider. Ensure the embedding provider's data handling meets your compliance requirements.
- **Embedding reversal:** Recent research shows embeddings can be partially reversed to recover training data. Be cautious about embedding sensitive information.
- **Local embedding for sensitive data:** For PII or confidential data, use a local embedding model (BGE, E5) instead of sending data to third-party APIs.
- **Cache security:** Embedding caches may store vectors of sensitive queries. Apply the same access controls as the source data.
- **Model provenance:** If using open-source embedding models, verify the model source and checksums.

## Common Mistakes

- Using different embedding models for indexing and querying — vectors are in incompatible spaces.
- Not normalizing embeddings — cosine similarity assumes unit-length vectors.
- Embedding each chunk individually (no batching) — 10x slower than batch embedding.
- Not considering embedding costs — embedding 1M documents costs real money (OpenAI: ~$0.13/1M tokens).
- Using too many dimensions — 1536-dim vectors when 384 would suffice wastes storage and search time.

## Anti-Patterns

- **Embedding Everything:** Embedding every piece of text without considering whether it will be useful for retrieval.
- **Provider Lock-In:** Using a proprietary embedding model that makes it impossible to switch providers later.
- **Re-Embedding Everything:** Re-embedding the entire corpus when changing embedding models. Use versioned embeddings.
- **No Embedding Monitoring:** Not tracking embedding latency, error rate, and cost over time.
- **One-Shot Embedding:** Embedding documents once at index time without considering that documents may be updated.

## Examples

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

## Related Topics

- ku-01 (RAG Architecture Fundamentals): Embedding is part of the RAG pipeline.
- ku-02 (Document Chunking): Chunks are what get embedded.
- ku-05 (Retrieval Quality): Embedding quality impacts retrieval accuracy.
- vector-database-integration/ku-01: Vector DB stores and searches embeddings.
- llm-provider-abstraction/ku-01: Provider abstraction for embedding services.

## AI Agent Notes

- When asked about embedding strategy, first understand: document volume, query types, latency requirements, and data sensitivity.
- For embedding quality issues, check: model consistency (indexing vs. querying), normalization, and dimension appropriateness.
- Prefer reading the embedding service configuration before the implementation — model selection is the critical decision.
- When generating embedding code, include: batch support, caching, Matryoshka dimensions (if available), and health checks.

## Verification

- [ ] Same embedding model is used for indexing and querying.
- [ ] Embeddings are normalized to unit length.
- [ ] Batch embedding is implemented for indexing pipelines.
- [ ] Embedding cache exists for query embeddings with configurable TTL.
- [ ] Embedding dimensions match the vector database configuration.
- [ ] Embedding provider data handling meets compliance requirements (local model for sensitive data).
- [ ] Embedding latency, error rate, and cost are monitored.
