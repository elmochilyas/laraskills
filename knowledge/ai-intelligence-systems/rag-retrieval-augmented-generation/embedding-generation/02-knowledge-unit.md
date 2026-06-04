# Knowledge Unit: Embedding Generation

## Metadata

- **ID:** KU-023
- **Subdomain:** Retrieval-Augmented Generation (RAG)
- **Slug:** embedding-generation
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Embedding generation converts text into fixed-dimensional vector representations that capture semantic meaning. The Laravel AI SDK provides `Str::toEmbeddings()` for generating embeddings from text, and `Str::of($query)->toEmbeddings()` for embedding queries at retrieval time. Supported providers: OpenAI, Gemini, Cohere, Jina. Embeddings are stored in pgvector columns and queried via cosine similarity.

## Core Concepts

- **Embedding vector**: Fixed-dimensional array of floats (typically 768-3072 dimensions) representing semantic content
- **`Str::toEmbeddings()`**: Laravel helper that calls configured embedding provider and returns vector array
- **Cosine similarity**: Default distance metric — measures angle between vectors (range: -1 to 1, higher = more similar)
- **Embedding dimensions**: Vary by provider — OpenAI text-embedding-3-small: 1536, text-embedding-3-large: 3076, Cohere: 1024
- **Batch embedding**: Multiple texts embedded in single API call — reduces overhead and cost
- **Normalization**: Vectors should be normalized to unit length before cosine similarity comparison

## Mental Models

- **Hashing for meaning**: Like a hash function for content — same meaning → similar vector. Unlike hashes, "similar" is measurable via distance.
- **Coordinates in semantic space**: Each dimension represents a learned concept. "King - Man + Woman ≈ Queen" is the classic analogy — embeddings capture these relationships.

## Internal Mechanics

Embedding generation flow:
1. Text is sent to embedding provider's API endpoint
2. Provider tokenizes text into model-specific tokens
3. Model processes tokens through transformer network, producing final hidden state
4. Output is pooled (mean or CLS token) into fixed-dimension vector
5. Vector returned as array of floats

`Str::toEmbeddings()` uses the configured embedding provider (default: OpenAI `text-embedding-3-small`). The vector is ready for storage in a pgvector column.

For querying: `Str::of($query)->toEmbeddings()` → `Model::whereVectorSimilarTo('embedding', $queryEmbedding)`.

## Patterns

- **Embedding at ingestion time**: Generate once, store, reuse for all queries
- **Batch embedding**: Group chunks into batches of 20-50 for API efficiency
- **Caching embeddings**: Cache by content hash — skip re-embedding unchanged content
- **Embedding model pinning**: Pin exact model version — avoid silent dimension changes
- **Normalization on insert**: Normalize vectors before storage — enables cosine similarity without runtime normalization

## Architectural Decisions

- **Decision**: SDK-managed vs. custom embedding → SDK `Str::toEmbeddings()` for standard cases. Reason: Provider abstraction, configuration, batching handled internally.
- **Decision**: Single embedding model vs. multiple → Use one model per index. Reason: Vectors from different models are incomparable — mixing corrupts similarity search.
- **Decision**: Store embedding as column vs. separate table → Native `vector()` column on existing model. Reason: Scoped queries (by user, tenant) without joins.

## Tradeoffs

| Provider | Dimensions | Cost/M tokens | Quality | Availability |
|----------|-----------|---------------|---------|-------------|
| OpenAI text-embedding-3-small | 1536 | $0.02 | High | Production |
| OpenAI text-embedding-3-large | 3076 | $0.13 | Highest | Production |
| Cohere embed-english-v3 | 1024 | $0.10 | High | Production |
| Jina embeddings-v2 | 768 | Free tier | Medium | Production |
| Gemini embedding-001 | 768 | $0.02 | High | Production |
| Ollama (local) | 4096 | Free | Medium | Development |

## Performance Considerations

- Embedding API calls: 100-500ms per batch of 20 texts
- Batch embedding reduces per-text overhead by 5-10x vs. individual calls
- Dimension count affects storage and query speed — 768d vs 3076d: 4x storage difference
- pgvector HNSW index performance inversely correlated with dimension count
- Normalization is cheap (microseconds) — always normalize before storage

## Production Considerations

- Monitor embedding provider costs — at 1M chunks × $0.0000001 per chunk = $0.10, but at 100M chunks = $10. Cost adds up.
- Cache embeddings by content hash — regenerate only changed content
- Pin embedding model version in config — switching models silently invalidates all existing vectors
- Implement batch processing for large ingestion jobs via queue
- Handle embedding provider rate limits — add delay between batches
- Store embedding metadata (model name, dimensions, normalization flag) alongside vector

## Common Mistakes

- Mixing embedding models in the same pgvector index — vectors are dimensionally incompatible
- Not normalizing vectors before storage — cosine similarity with unnormalized vectors returns incorrect ranking
- Embedding entire documents as single vectors — loses granularity for specific queries
- Changing embedding model without re-embedding existing data — old vectors become garbage
- Ignoring batch limits — some providers limit batch size (e.g., 2048 texts per call)
- Storing embeddings without metadata (model, date, dimensions) — can't diagnose retrieval issues

## Failure Modes

- **Model deprecation**: Provider deprecates embedding model — urgent re-embedding required
- **Silent dimension change**: Provider changes output dimensions without notice — vectors become incompatible
- **Rate limit exhaustion**: Burst ingestion exceeds provider rate limit — implement exponential backoff
- **Token limit exceeded**: Text exceeds model token limit (e.g., 8192 tokens for text-embedding-3) — truncate or split
- **Zero vector**: Empty or meaningless text produces near-zero vector — detect and handle

## Ecosystem Usage

- `Str::toEmbeddings()` is the primary API for embedding generation in Laravel
- Third-party packages (`moneo/laravel-rag`) provide additional embedding strategies and batch processing
- LLPhant provides embedding via multiple providers with caching
- Local embedding via Ollama for development environments — zero cost

## Related Knowledge Units

- KU-021: RAG Pipeline with SimilaritySearch
- KU-022: Document Chunking Strategies
- KU-028: pgvector Native Support
- KU-029: HNSW Index Tuning

## Research Notes

- `Str::toEmbeddings()` added in Laravel 13 core helpers
- Laravel AI SDK supports OpenAI, Gemini, Cohere, Jina as embedding providers
- Ollama local embedding available for development — switch to API provider in production
- Embedding model switching is a documented risk — always pin model version in config
- Industry standard: text-embedding-3-small (1536d) covers 90% of use cases at lowest cost
