| Metadata | |
|---|---|
| KU ID | ku-05 |
| Subdomain | vector-similarity-search |
| Topic | Vector Search in Laravel AI |
| Source | Community / Laravel |
| Maturity | Emerging |

## Overview

Vector search in Laravel AI combines embedding generation (OpenAI, Cohere, local), vector storage (pgvector, Qdrant, Pinecone), and retrieval into AI-powered applications. Common patterns: semantic search, RAG, similarity recommendations, and content clustering.

## Core Concepts

- **Embedding Pipeline**: Text → Embedding Model → Vector Store
- **Query Pipeline**: Query → Embedding Model → ANN Search → Top-K Results
- **Integration Points**: Laravel HTTP client for API embeddings, raw SQL or PHP client for vector queries
- **AI Use Cases**: Semantic search, RAG, content recommendation, anomaly detection

## When To Use

- Building AI-powered search features
- RAG pipeline integration
- Content similarity and recommendations
- Any Laravel app needing semantic understanding

## When NOT To Use

- Traditional keyword search is sufficient
- No ML/AI infrastructure or budget
- Privacy regulations restrict embedding API use

## Best Practices

1. **Start simple**: API embeddings + pgvector for vector store.
2. **Cache embeddings**: Reduce API costs and latency.
3. **Batch process**: For bulk indexing, batch embed chunks.
4. **Use queues**: Embedding generation should be async for large documents.
5. **Monitor costs**: API embedding costs add up at scale.

## Related Topics

- K067 (Embedding generation)
- K069 (RAG pipeline)
- K041 (pgvector)

## AI Agent Notes

- Laravel AI vector search is built on standard PHP tools (HTTP client, raw SQL)
- No first-party package — implementations are custom
- For agents: API embeddings + pgvector is the simplest starting point

## Verification

- [ ] Embedding provider configured
- [ ] Vector store set up
- [ ] Embed → search pipeline working
- [ ] Caching implemented
- [ ] Queue for batch embedding
- [ ] Monitoring for API costs
