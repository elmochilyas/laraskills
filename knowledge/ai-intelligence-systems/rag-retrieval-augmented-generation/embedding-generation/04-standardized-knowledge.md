---
id: KU-023
title: "Embedding Generation"
subdomain: "rag-retrieval-augmented-generation"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/04-rag-retrieval-augmented-generation/embedding-generation/04-standardized-knowledge.md"
---

# Embedding Generation

## Overview

Embedding generation converts text into fixed-dimensional vector representations that capture semantic meaning. The Laravel AI SDK provides `Str::toEmbeddings()` for generating embeddings from text, and `Str::of($query)->toEmbeddings()` for embedding queries at retrieval time. Supported providers: OpenAI, Gemini, Cohere, Jina. Embeddings are stored in pgvector columns and queried via cosine similarity.

## Core Concepts

- **Embedding vector**: Fixed-dimensional array of floats (typically 768-3072 dimensions) representing semantic content
- **`Str::toEmbeddings()`**: Laravel helper that calls configured embedding provider and returns vector array
- **Cosine similarity**: Default distance metric â€” measures angle between vectors (range: -1 to 1, higher = more similar)
- **Embedding dimensions**: Vary by provider â€” OpenAI text-embedding-3-small: 1536, text-embedding-3-large: 3076, Cohere: 1024
- **Batch embedding**: Multiple texts embedded in single API call â€” reduces overhead and cost
- **Normalization**: Vectors should be normalized to unit length before cosine similarity comparison

## When To Use

- Production applications requiring Embedding Generation functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Embedding at ingestion time**: Generate once, store, reuse for all queries
- **Batch embedding**: Group chunks into batches of 20-50 for API efficiency
- **Caching embeddings**: Cache by content hash â€” skip re-embedding unchanged content
- **Embedding model pinning**: Pin exact model version â€” avoid silent dimension changes
- **Normalization on insert**: Normalize vectors before storage â€” enables cosine similarity without runtime normalization

- **Hashing for meaning**: Like a hash function for content â€” same meaning â†’ similar vector. Unlike hashes, "similar" is measurable via distance.
- **Coordinates in semantic space**: Each dimension represents a learned concept. "King - Man + Woman â‰ˆ Queen" is the classic analogy â€” embeddings capture these relationships.

## Architecture Guidelines

- **Decision**: SDK-managed vs. custom embedding â†’ SDK `Str::toEmbeddings()` for standard cases. Reason: Provider abstraction, configuration, batching handled internally.
- **Decision**: Single embedding model vs. multiple â†’ Use one model per index. Reason: Vectors from different models are incomparable â€” mixing corrupts similarity search.
- **Decision**: Store embedding as column vs. separate table â†’ Native `vector()` column on existing model. Reason: Scoped queries (by user, tenant) without joins.

## Performance Considerations

- Embedding API calls: 100-500ms per batch of 20 texts
- Batch embedding reduces per-text overhead by 5-10x vs. individual calls
- Dimension count affects storage and query speed â€” 768d vs 3076d: 4x storage difference
- pgvector HNSW index performance inversely correlated with dimension count
- Normalization is cheap (microseconds) â€” always normalize before storage

| Provider | Dimensions | Cost/M tokens | Quality | Availability |
|----------|-----------|---------------|---------|-------------|
| OpenAI text-embedding-3-small | 1536 | $0.02 | High | Production |
| OpenAI text-embedding-3-large | 3076 | $0.13 | Highest | Production |
| Cohere embed-english-v3 | 1024 | $0.10 | High | Production |
| Jina embeddings-v2 | 768 | Free tier | Medium | Production |
| Gemini embedding-001 | 768 | $0.02 | High | Production |
| Ollama (local) | 4096 | Free | Medium | Development |

## Security Considerations

- Monitor embedding provider costs â€” at 1M chunks Ã— $0.0000001 per chunk = $0.10, but at 100M chunks = $10. Cost adds up.
- Cache embeddings by content hash â€” regenerate only changed content
- Pin embedding model version in config â€” switching models silently invalidates all existing vectors
- Implement batch processing for large ingestion jobs via queue
- Handle embedding provider rate limits â€” add delay between batches
- Store embedding metadata (model name, dimensions, normalization flag) alongside vector

## Common Mistakes

- Mixing embedding models in the same pgvector index â€” vectors are dimensionally incompatible
- Not normalizing vectors before storage â€” cosine similarity with unnormalized vectors returns incorrect ranking
- Embedding entire documents as single vectors â€” loses granularity for specific queries
- Changing embedding model without re-embedding existing data â€” old vectors become garbage
- Ignoring batch limits â€” some providers limit batch size (e.g., 2048 texts per call)
- Storing embeddings without metadata (model, date, dimensions) â€” can't diagnose retrieval issues

## Anti-Patterns

- **Model deprecation**: Provider deprecates embedding model â€” urgent re-embedding required
- **Silent dimension change**: Provider changes output dimensions without notice â€” vectors become incompatible
- **Rate limit exhaustion**: Burst ingestion exceeds provider rate limit â€” implement exponential backoff
- **Token limit exceeded**: Text exceeds model token limit (e.g., 8192 tokens for text-embedding-3) â€” truncate or split
- **Zero vector**: Empty or meaningless text produces near-zero vector â€” detect and handle

## Examples

The following ecosystem packages provide reference implementations:

- `Str::toEmbeddings()` is the primary API for embedding generation in Laravel
- Third-party packages (`moneo/laravel-rag`) provide additional embedding strategies and batch processing
- LLPhant provides embedding via multiple providers with caching
- Local embedding via Ollama for development environments â€” zero cost

## Related Topics

- KU-021: RAG Pipeline with SimilaritySearch
- KU-022: Document Chunking Strategies
- KU-028: pgvector Native Support
- KU-029: HNSW Index Tuning

## AI Agent Notes

- When asked about Embedding Generation, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

