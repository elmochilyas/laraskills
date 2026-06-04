# Knowledge Unit: RAG Pipeline with SimilaritySearch

## Metadata

- **ID:** KU-021
- **Subdomain:** Retrieval-Augmented Generation (RAG)
- **Slug:** rag-pipeline-similarity-search
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The full RAG pipeline in Laravel: document ingestion → chunking → embedding generation → vector storage → similarity search → context injection → LLM generation. The Laravel AI SDK provides the `SimilaritySearch` tool that plugs directly into Eloquent models backed by pgvector. `Str::toEmbeddings()` generates embeddings, `whereVectorSimilarTo()` queries similarity, and the built-in tool handles context injection.

## Core Concepts

- RAG stages: Ingest → Chunk → Embed → Store → Retrieve → Ground → Generate
- `SimilaritySearch` tool: Built-in Laravel AI SDK tool for pgvector RAG queries
- `Str::toEmbeddings()`: Generate embeddings for text using configured embedding provider
- `whereVectorSimilarTo()`: Eloquent scope for cosine/similarity search on vector column
- `minSimilarity`: Threshold filtering out low-relevance results (0.0 to 1.0)
- Context injection: Retrieved chunks are injected into the agent's system prompt as grounding context
- Citation grounding: Retrieved documents cited in LLM response for traceability

## Mental Models

- **Database index for LLM**: Like a full-text search index — documents are pre-processed into searchable vectors, retrieved at query time to inform the LLM.
- **Open-book exam**: The LLM is the student; retrieved documents are the textbook. The student reads relevant passages (retrieved) to answer the question, citing sources.
- **Context window extender**: RAG effectively extends the LLM's context window beyond its training data limit by injecting only relevant information.

## Internal Mechanics

RAG pipeline flow:
1. **Ingestion**: Document loaded from file, URL, or database
2. **Chunking**: Document split into manageable pieces (character, semantic, or recursive)
3. **Embedding**: `Str::of($chunk)->toEmbeddings()` calls configured embedding provider (OpenAI, Gemini, Cohere, Jina)
4. **Storage**: Embedding stored in pgvector column alongside original text and metadata via Eloquent model
5. **Retrieval**: User query → `Str::of($query)->toEmbeddings()` → `Model::whereVectorSimilarTo('embedding', $queryEmbedding)` → top-K results
6. **Grounding**: Retrieved chunks injected into agent instructions as context
7. **Generation**: Agent generates answer grounded in provided context, with citations

The `SimilaritySearch` tool automates steps 5-7: agent calls the tool with the query, tool retrieves and returns relevant chunks.

## Patterns

- **Ingestion pipeline**: PHP Artisan command or queued job for batch document processing
- **Per-user scoping**: `whereVectorSimilarTo` combined with `where('user_id', $userId)` for tenant isolation
- **Metadata pre-filtering**: Filter by document type, date range, or access level before vector search
- **MinSimilarity threshold**: Prevent irrelevant chunks from polluting context (recommended: 0.7-0.8)
- **Citation format**: Retrieved chunks include source metadata — agent instructed to cite sources in response

## Architectural Decisions

- **Decision**: Built-in SimilaritySearch vs. custom retrieval → Built-in for standard cases. Reason: Covers 80% of RAG use cases with minimal code. Custom retrieval for complex queries (hybrid search, reranking).
- **Decision**: pgvector as default vector store → Native Laravel 13 support. Reason: ACID, joins, hybrid search, zero additional infrastructure.
- **Decision**: Embedding via SDK vs. external service → `Str::toEmbeddings()` uses configured provider. Reason: Consistent API, automatic provider abstraction.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Simple vector search | Fast, low cost | Misses keyword matches (hybrid search better) |
| Single-chunk context | Simple ingestion | May miss cross-chunk relationships |
| Embedding on ingestion | Fast retrieval | Stale if embedding model changes |
| Top-K fixed count | Predictable context size | May include irrelevant chunks |

## Performance Considerations

- Embedding generation is I/O bound (HTTP call) — batch process documents via queue
- pgvector HNSW index: sub-10ms search at 1M vectors with proper index tuning
- Context injection adds token cost — larger context = higher cost per query
- `minSimilarity` filtering reduces irrelevant results but may miss borderline-relevant content
- Caching embeddings for unchanged content reduces API calls

## Production Considerations

- Run document ingestion as queued job — not during HTTP request
- Set `minSimilarity` based on your content — test different thresholds
- Monitor embedding provider costs — embedding generation can dominate for large corpora
- Implement document versioning — when source updates, re-embed only changed chunks
- Tune `hnsw.ef_search` for latency/recall tradeoff (default 40, increase for higher recall)
- Test retrieval quality with representative queries before deploying
- Implement access control on retrieved documents — RAG should respect document permissions

## Common Mistakes

- Embedding entire documents as single vectors — loses granularity for specific queries
- No `minSimilarity` threshold — irrelevant chunks pollute context, degrade response quality
- Mixing embedding models in same index — vectors from different models are incomparable
- Not handling empty retrieval results — agent hallucinates when no context provided
- Forgetting to re-embed after content updates — stale embeddings return incorrect results

## Failure Modes

- **Empty retrieval**: No chunks match query → agent has no context to answer → hallucination risk. Fallback: return "I don't know" or use web search.
- **Irrelevant retrieval**: Retrieved chunks are semantically close but factually wrong → degradation. Fix: improve chunking strategy, add reranking.
- **Embedding model change**: Switching providers makes existing vectors incompatible → re-embed entire corpus
- **Context window overflow**: Too many chunks exceed model's context limit → truncate or reduce K
- **Metric inversion**: Cosine similarity on unnormalized embeddings returns incorrect ranking → use correct distance metric

## Ecosystem Usage

- Support chatbots with documentation grounding
- Code/documentation search for developer tools
- Internal knowledge base Q&A systems
- Legal document analysis with citation requirements
- E-commerce product search with semantic matching

## Related Knowledge Units

- KU-022: Document Chunking Strategies
- KU-023: Embedding Generation
- KU-024: Reranking
- KU-025: Hybrid Search
- KU-026: Citation-Grounded Answers
- KU-027: SQLite-vec for Local RAG

## Research Notes

- `SimilaritySearch` tool added in Laravel AI SDK v0.4.0
- `Str::toEmbeddings()` added in Laravel 13 core helpers
- Laravel 13 `vector()` column type native support
- Industry data: naive RAG fails at retrieval 40% of the time — chunking and retrieval quality are the critical bottlenecks, not generation
- Most production RAG failures occur at retrieval (73% according to 2026 industry analysis)
