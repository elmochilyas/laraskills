# Knowledge Unit: Embedding Generation Strategies

## Metadata

- **ID:** K067
- **Subdomain:** RAG Search Pipelines
- **Source:** OpenAI / Local / General
- **Maturity:** New
- **Laravel Relevance:** API vs on-device embedding models

## Executive Summary

Embedding generation converts text into vector representations for semantic search. Strategies differ by provider (OpenAI, Cohere, Voyage), deployment (API vs local), model size (small/large), and dimensionality (256-3072). The choice impacts cost, latency, retrieval quality, and infrastructure requirements. For Laravel applications, API-based embeddings (OpenAI) are the most common starting point, with local models (FastEmbed) used for cost optimization at scale.

## Core Concepts

- **API Embeddings**: OpenAI `text-embedding-3-*`, Cohere `embed-*`, Voyage `voyage-*`. Pay-per-token, high quality, zero infrastructure.
- **Local Embeddings**: FastEmbed, sentence-transformers. On-device, free, lower quality, requires compute.
- **Dimensionality**: Higher dimensions (3072) capture more information but increase storage and compute. Lower dimensions (256) are more efficient.
- **Normalization**: Most embedding models produce unit vectors (suitable for cosine similarity). Some require explicit normalization.
- **Model Selection**: BGE (BAAI/bge-large-en-v1.5), E5, Instructor models for open-source.

## Internal Mechanics

An embedding model is a transformer-based neural network that maps text to a fixed-size vector. The model processes the input through multiple transformer layers, producing a pooled output vector. API models run on the provider's GPU infrastructure. Local models run on the application server's CPU (slow) or GPU (fast). The resulting vector is stored in a vector column/index for similarity search.

## Patterns

- **API embedding at index time, cache results**: Generate embeddings during document indexing, store them. Avoid re-generating for the same text.
- **API embedding at query time**: Each user query gets embedded. Cache frequent queries.
- **Local embedding for air-gapped**: FastEmbed for environments without internet access.
- **Dimensionality reduction**: Use Matryoshka models (OpenAI text-embedding-3) that support dimensionality truncation without quality loss.

## Architectural Decisions

Embedding generation is the first step in any vector search pipeline. The API vs local decision affects cost structure, latency profile, and infrastructure requirements.

## Tradeoffs

| Factor | API (OpenAI) | Local (FastEmbed) |
|---|---|---|
| Quality | Best | Good |
| Cost | Per-token | Free (compute only) |
| Latency | 50-200ms per call | 10-50ms (CPU), 2-10ms (GPU) |
| Infrastructure | None | CPU/GPU required |
| Privacy | Data sent to provider | Data stays local |
| Rate limits | Yes (API limits) | No |

## Performance Considerations

- API embedding latency depends on text length and provider load. Batch multiple texts for efficiency.
- Local embedding models (ONNX quantized) run efficiently on modern CPUs.
- GPU inference for local models is 5-10x faster than CPU.
- Caching embeddings for frequently indexed documents saves significant API costs.

## Production Considerations

- **Cache all generated embeddings** — never re-embed the same text.
- **Batch embedding calls** — API providers offer batch endpoints for lower per-token cost.
- **Use the smallest effective model** — OpenAI's text-embedding-3-small (1536 dims) is sufficient for most use cases.
- **Monitor embedding costs** — high-volume indexing can generate significant API charges.
- **Handle rate limits** — implement retry logic with exponential backoff for API providers.

## Common Mistakes

- Re-embedding documents on every index update — wasteful. Cache embeddings by content hash.
- Using the largest model unnecessarily — text-embedding-3-large (3072 dims) is rarely needed over text-embedding-3-small (1536).
- Not normalizing embeddings — cosine distance on unnormalized vectors gives incorrect results.
- Embedding without text preprocessing — removing HTML, normalizing whitespace, handling truncation.

## Failure Modes

- **API outage**: Embedding generation fails if the provider is unavailable. Fall back to keyword-only search.
- **Cost shock**: Large-scale embedding generation can run up significant API bills.
- **Rate limit exceeded**: High-throughput indexing may hit API rate limits. Implement queuing.

## Ecosystem Usage

Universal in RAG and vector search pipelines. OpenAI embeddings are the dominant choice in the Laravel ecosystem due to ease of use.

## Related Knowledge Units

- K068 (Chunking strategies for RAG)
- K069 (RAG pipeline architecture)
- K053 (Qdrant FastEmbed)

## Research Notes

Sources: OpenAI embedding docs, Cohere embedding docs, FastEmbed GitHub. OpenAI's text-embedding-3 models (2024+) support Matryoshka representation learning, allowing dimensionality truncation without quality loss — a significant advance. Local embedding models (BGE, E5) have narrowed the gap with API models significantly.


## Mental Models

- **Translator**: An embedding model is like a translator who converts text into a language of pure meaning (vectors). Different translators (models) have different vocabularies and dialects.
- **Map Coordinates**: Embeddings are like GPS coordinates in a meaning-space. Similar concepts cluster together geographically; distance maps to semantic similarity.
- **Fingerprint**: Each document gets a unique vector fingerprint. The goal is high sensitivity (different docs → different vectors) and robustness (same meaning → similar vectors).

