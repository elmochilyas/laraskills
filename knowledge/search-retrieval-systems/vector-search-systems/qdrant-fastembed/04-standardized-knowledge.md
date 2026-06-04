| Metadata | |
|---|---|
| KU ID | K053 |
| Subdomain | vector-similarity-search |
| Topic | Qdrant FastEmbed Integration |
| Source | Qdrant Docs |
| Maturity | Stable |

## Overview

FastEmbed is Qdrant's on-device embedding generation library. It runs embedding models locally using ONNX Runtime, eliminating the need for external API calls to embedding providers. FastEmbed supports popular models like BAAI/bge-small-en, sentence-transformers/all-MiniLM-L6-v2, and multilingual models. For Laravel applications, FastEmbed typically runs as a sidecar process or via a Python microservice.

## Core Concepts

- **On-Device Embeddings**: Embedding generation runs locally, no external API dependencies.
- **ONNX Runtime**: Models run via ONNX for cross-platform compatibility.
- **Supported Models**: BGE, sentence-transformers, multilingual models.
- **Zero API Costs**: No per-embedding fees — only compute resource costs.
- **Python-Based**: Qdrant FastEmbed is a Python package; Laravel integration requires a bridge.

## When To Use

- Cost-sensitive applications where API-based embedding costs are prohibitive
- Offline/air-gapped deployments where external API calls are impossible
- High-volume embedding generation where API rate limits would be hit
- Privacy-sensitive applications where data must not leave the server

## When NOT To Use

- Small-scale applications where API embedding costs are negligible
- When highest-quality embeddings are required (API models like OpenAI text-embedding-3-large are generally better)
- Teams without Python/runtime infrastructure for ONNX models
- Applications needing very large embedding models (limited by local compute)

## Best Practices

1. **Use appropriate model size**: BAAI/bge-small-en for speed, BAAI/bge-large-en for quality.
2. **Cache embeddings**: Avoid re-embedding the same text — implement embedding caching.
3. **Run as microservice**: Use a Python FastAPI service for embedding generation, called from Laravel.
4. **Batch embedding requests**: Process documents in batches for throughput efficiency.
5. **Monitor inference latency**: On-device embedding latency varies by hardware and model size.

## Architecture Guidelines

- FastEmbed runs as a separate Python service (Docker container) accessible via HTTP from Laravel.
- Laravel sends text to the FastEmbed service, receives embedding vectors, and stores them in Qdrant.
- For batch indexing, Laravel sends document batches to the FastEmbed service.
- Cache embeddings in Redis/PostgreSQL to avoid redundant inference.

## Performance Considerations

- On-device embedding latency: 5-50ms per text (varies by model size and hardware).
- GPU acceleration significantly improves throughput (10-50x vs CPU).
- Batch processing improves throughput: processing 32 texts at once is faster than 32 individual calls.
- Embedding cache hits are ~1ms (vs 5-50ms for inference).

## Related Topics

- K048 (Qdrant vector search)
- K067 (Embedding generation strategies)
- K054 (Qdrant cross-encoder re-ranking)
- K055 (Qdrant Edge)

## AI Agent Notes

- FastEmbed eliminates embedding API costs — suitable for high-volume or offline use.
- Requires a Python sidecar service for Laravel integration.
- For agents: run FastEmbed as a Docker container; use BAAI/bge-small-en for speed, bge-large-en for quality; cache embeddings aggressively.

## Verification

- [ ] FastEmbed service running (Docker/sidecar)
- [ ] Embedding generation endpoint accessible from Laravel
- [ ] Embedding cache implemented
- [ ] Batch embedding processing configured
- [ ] Model selection documented (speed vs quality tradeoff)
