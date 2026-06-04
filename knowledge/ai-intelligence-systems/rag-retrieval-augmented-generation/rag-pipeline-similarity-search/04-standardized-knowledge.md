---
id: KU-021
title: "RAG Pipeline with SimilaritySearch"
subdomain: "rag-retrieval-augmented-generation"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/04-rag-retrieval-augmented-generation/rag-pipeline-similarity-search/04-standardized-knowledge.md"
---

# RAG Pipeline with SimilaritySearch

## Overview

The full RAG pipeline in Laravel: document ingestion â†’ chunking â†’ embedding generation â†’ vector storage â†’ similarity search â†’ context injection â†’ LLM generation. The Laravel AI SDK provides the `SimilaritySearch` tool that plugs directly into Eloquent models backed by pgvector. `Str::toEmbeddings()` generates embeddings, `whereVectorSimilarTo()` queries similarity, and the built-in tool handles context injection.

## Core Concepts

- RAG stages: Ingest â†’ Chunk â†’ Embed â†’ Store â†’ Retrieve â†’ Ground â†’ Generate
- `SimilaritySearch` tool: Built-in Laravel AI SDK tool for pgvector RAG queries
- `Str::toEmbeddings()`: Generate embeddings for text using configured embedding provider
- `whereVectorSimilarTo()`: Eloquent scope for cosine/similarity search on vector column
- `minSimilarity`: Threshold filtering out low-relevance results (0.0 to 1.0)
- Context injection: Retrieved chunks are injected into the agent's system prompt as grounding context
- Citation grounding: Retrieved documents cited in LLM response for traceability

## When To Use

- Production applications requiring RAG Pipeline with SimilaritySearch functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Ingestion pipeline**: PHP Artisan command or queued job for batch document processing
- **Per-user scoping**: `whereVectorSimilarTo` combined with `where('user_id', $userId)` for tenant isolation
- **Metadata pre-filtering**: Filter by document type, date range, or access level before vector search
- **MinSimilarity threshold**: Prevent irrelevant chunks from polluting context (recommended: 0.7-0.8)
- **Citation format**: Retrieved chunks include source metadata â€” agent instructed to cite sources in response

- **Database index for LLM**: Like a full-text search index â€” documents are pre-processed into searchable vectors, retrieved at query time to inform the LLM.
- **Open-book exam**: The LLM is the student; retrieved documents are the textbook. The student reads relevant passages (retrieved) to answer the question, citing sources.
- **Context window extender**: RAG effectively extends the LLM's context window beyond its training data limit by injecting only relevant information.

## Architecture Guidelines

- **Decision**: Built-in SimilaritySearch vs. custom retrieval â†’ Built-in for standard cases. Reason: Covers 80% of RAG use cases with minimal code. Custom retrieval for complex queries (hybrid search, reranking).
- **Decision**: pgvector as default vector store â†’ Native Laravel 13 support. Reason: ACID, joins, hybrid search, zero additional infrastructure.
- **Decision**: Embedding via SDK vs. external service â†’ `Str::toEmbeddings()` uses configured provider. Reason: Consistent API, automatic provider abstraction.

## Performance Considerations

- Embedding generation is I/O bound (HTTP call) â€” batch process documents via queue
- pgvector HNSW index: sub-10ms search at 1M vectors with proper index tuning
- Context injection adds token cost â€” larger context = higher cost per query
- `minSimilarity` filtering reduces irrelevant results but may miss borderline-relevant content
- Caching embeddings for unchanged content reduces API calls

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Simple vector search | Fast, low cost | Misses keyword matches (hybrid search better) |
| Single-chunk context | Simple ingestion | May miss cross-chunk relationships |
| Embedding on ingestion | Fast retrieval | Stale if embedding model changes |
| Top-K fixed count | Predictable context size | May include irrelevant chunks |

## Security Considerations

- Run document ingestion as queued job â€” not during HTTP request
- Set `minSimilarity` based on your content â€” test different thresholds
- Monitor embedding provider costs â€” embedding generation can dominate for large corpora
- Implement document versioning â€” when source updates, re-embed only changed chunks
- Tune `hnsw.ef_search` for latency/recall tradeoff (default 40, increase for higher recall)
- Test retrieval quality with representative queries before deploying
- Implement access control on retrieved documents â€” RAG should respect document permissions

## Common Mistakes

- Embedding entire documents as single vectors â€” loses granularity for specific queries
- No `minSimilarity` threshold â€” irrelevant chunks pollute context, degrade response quality
- Mixing embedding models in same index â€” vectors from different models are incomparable
- Not handling empty retrieval results â€” agent hallucinates when no context provided
- Forgetting to re-embed after content updates â€” stale embeddings return incorrect results

## Anti-Patterns

- **Empty retrieval**: No chunks match query â†’ agent has no context to answer â†’ hallucination risk. Fallback: return "I don't know" or use web search.
- **Irrelevant retrieval**: Retrieved chunks are semantically close but factually wrong â†’ degradation. Fix: improve chunking strategy, add reranking.
- **Embedding model change**: Switching providers makes existing vectors incompatible â†’ re-embed entire corpus
- **Context window overflow**: Too many chunks exceed model's context limit â†’ truncate or reduce K
- **Metric inversion**: Cosine similarity on unnormalized embeddings returns incorrect ranking â†’ use correct distance metric

## Examples

The following ecosystem packages provide reference implementations:

- Support chatbots with documentation grounding
- Code/documentation search for developer tools
- Internal knowledge base Q&A systems
- Legal document analysis with citation requirements
- E-commerce product search with semantic matching

## Related Topics

- KU-022: Document Chunking Strategies
- KU-023: Embedding Generation
- KU-024: Reranking
- KU-025: Hybrid Search
- KU-026: Citation-Grounded Answers
- KU-027: SQLite-vec for Local RAG

## AI Agent Notes

- When asked about RAG Pipeline with SimilaritySearch, first determine the specific use case and requirements.
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

