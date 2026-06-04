# Knowledge Unit: Meilisearch Hybrid Search

## Metadata

- **ID:** K028
- **Subdomain:** Hybrid Search
- **Source:** Meilisearch Docs
- **Maturity:** Stable
- **Laravel Relevance:** Auto-embeddings + keyword fusion

## Executive Summary

Meilisearch's hybrid search combines keyword (BM25) and semantic (vector) search in a single query, fusing results using an internal ranking algorithm. It supports automatic embedding generation via OpenAI, Hugging Face, or user-provided embeddings. The hybrid mode seamlessly integrates keyword precision with semantic understanding without requiring separate search infrastructure.

## Core Concepts

- **Dual Retrieval**: Queries run against both the full-text inverted index and the vector index simultaneously.
- **Automatic Embeddings**: Meilisearch can generate embeddings automatically at indexing time using configured providers.
- **Fusion Strategy**: Results are combined using Meilisearch's internal ranking fusion, blending keyword and semantic scores.
- **User-Provided Embeddings**: Custom embedding vectors can be supplied in the document payload for full control.

## Internal Mechanics

Meilisearch maintains both the standard inverted index and an ANN (approximate nearest neighbor) index for each searchable index. When hybrid search is enabled, a query is processed through both paths. The keyword path uses BM25 scoring; the vector path uses cosine similarity against query embeddings (either auto-generated or user-provided). Results are fused using a weighted combination with configurable semantic ratio.

## Patterns

- **"Good enough" semantic search**: Without managing a separate vector database, get semantic search capabilities.
- **Improved long-tail queries**: Find documents that use different terminology but convey the same meaning.
- **Content-rich applications**: Documentation sites, blogs, CMS platforms.

## Architectural Decisions

Meilisearch chose to embed hybrid search directly in the engine rather than requiring an external vector database. This simplifies the stack but ties semantic capabilities to Meilisearch's infrastructure.

## Tradeoffs

- Simplicity: Single engine for hybrid search vs separate keyword + vector DB.
- Embedding cost: Auto-embeddings incur API costs per document indexed.
- Control: Less control over fusion algorithm compared to custom RRF implementation.
- Performance: Hybrid queries are slower than pure keyword (both indexes queried).

## Performance Considerations

- Hybrid queries add embedding generation latency if auto-embedding is used per-query.
- Vector index building adds to indexing time (7x faster embedding indexing since v1.38).
- Query latency is typically 2-5x pure keyword search due to dual retrieval.
- Best for datasets <1M documents where Meilisearch's built-in vector search is sufficient.

## Production Considerations

- **Configure embedding provider**: API key management for OpenAI/Hugging Face.
- **Set semantic ratio**: Tune the balance between keyword and semantic relevance.
- **Monitor embedding API costs**: Auto-embedding generates API calls per document indexed.
- **Test with representative queries**: Ensure hybrid mode improves results for your specific use case.

## Common Mistakes

- Expecting hybrid search to solve all relevance problems — still requires relevance tuning.
- Not tuning the semantic ratio — defaults may not match your content characteristics.
- Using auto-embedding on frequently updated documents — cost accumulates.

## Failure Modes

- **Embedding provider outage**: New documents cannot be indexed if the embedding API is unavailable.
- **Cost shock**: Auto-embedding thousands of documents generates significant API charges.
- **Vector index corruption**: Requires full re-index to rebuild vector search.

## Ecosystem Usage

Adopted by Meilisearch users seeking semantic search without managing a separate vector database. Common in documentation and content platforms.

## Related Knowledge Units

- K023 (Meilisearch driver setup)
- K030 (Meilisearch ranking rules)
- K061 (RRF - Reciprocal Rank Fusion)
- K069 (RAG pipeline architecture)

## Research Notes

Source: Meilisearch docs. Hybrid search was added in 2024 and has matured significantly. The feature is central to Meilisearch's positioning as an AI-enabled search platform. Automatic embedding generation differentiates it from Typesense's approach, which requires user-provided embeddings.


## Mental Models

- **Card Catalog**: Meilisearch is like an automated card catalog that updates instantly as new books arrive. Every field is indexed and searchable by default.
- **Ranking Dashboard**: Search ranking rules are like dials on a dashboard — you adjust proximity, typo tolerance, attribute weights, and recency to tune relevance.

