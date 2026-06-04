# Knowledge Unit: Hybrid Search

## Metadata

- **ID:** KU-025
- **Subdomain:** Retrieval-Augmented Generation (RAG)
- **Slug:** hybrid-search
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Hybrid search combines vector similarity search (semantic) with full-text keyword search to overcome the limitations of each. Vector search captures meaning but misses exact keyword matches. Full-text search catches precise terms but misses semantic relationships. pgvector enables hybrid search in a single PostgreSQL query by combining `<=>` vector distance with `tsvector` full-text ranking.

## Core Concepts

- **Dense retrieval**: Vector cosine similarity — captures semantic meaning, handles synonyms and paraphrasing
- **Sparse retrieval**: Keyword/full-text search (TSVECTOR, BM25) — exact term matching, handles acronyms, IDs, domain-specific terms
- **Hybrid fusion**: Combine dense and sparse scores into unified ranking
- **Reciprocal Rank Fusion (RRF)**: Common fusion algorithm — `score = 1 / (k + rank)` per result set, sum across sets
- **Weighted combination**: `final_score = α * vector_score + (1-α) * bm25_score` — α tunable per use case
- **pgvector + tsvector**: Single SQL query combining `WHERE` filters, `tsvector` match, and vector similarity

## Mental Models

- **Two signals, one answer**: Like combining GPS (where you are — semantic) with street signs (where you need to go — keyword). Each compensates for the other's blind spots.
- **Ensemble for search**: Like ensemble ML — two weak retrieval methods combine to produce stronger results than either alone.

## Internal Mechanics

Hybrid search flow in PostgreSQL:
1. `tsvector` column stores full-text search index (keyword)
2. `vector` column stores embeddings (semantic)
3. Query generates both: `ts_query` from user text + `query_embedding` from embedding model
4. Both searches run against same document set
5. Results fused via RRF or weighted combination
6. Fused ranking determines final top-K

Weighted combination example:
```sql
SELECT id, text,
    (0.5 * (1 - (embedding <=> $query_embedding)) + 
     0.5 * ts_rank(full_text, query)) AS combined_score
FROM documents, plainto_tsquery('english', $query) AS query
ORDER BY combined_score DESC
LIMIT 10;
```

## Patterns

- **α weighting**: Tune hybrid weight per content type — code docs (more keyword) vs. support articles (more semantic)
- **RRF fusion**: More robust than weighted — doesn't require score normalization
- **Metadata pre-filter**: Apply WHERE filters (tenant, date, type) before hybrid search
- **Cascading retrieval**: Hybrid for broad recall → Rerank for precision
- **Boolean filtering**: Combine vector search with SQL WHERE clauses for access control

## Architectural Decisions

- **Decision**: Database-level hybrid vs. application-level fusion → Database-level (pgvector + tsvector in single query). Reason: One query, no data transfer between systems, consistent ACID semantics.
- **Decision**: RRF vs. weighted fusion → RRF default (no score normalization needed); weighted for domain-tuned deployments.
- **Decision**: tsvector vs. external search → tsvector built into PostgreSQL. Reason: No additional infrastructure, hybrid query in one SQL statement.

## Tradeoffs

| Approach | Recall | Precision | Complexity | Best For |
|----------|--------|-----------|------------|----------|
| Vector only | High (semantic) | Medium | Low | General content, synonyms |
| Full-text only | Medium | High | Low | Exact terms, IDs, code |
| Hybrid (RRF) | Very High | High | Medium | Production RAG |
| Hybrid (weighted) | Very High | Highest | High | Tuned, domain-specific |

## Performance Considerations

- Hybrid query is slower than either alone — both index scans run sequentially
- tsvector index scan: ~5-50ms for 1M rows
- HNSW vector index scan: ~5-50ms for 1M rows (depends on ef_search)
- Combined: 10-100ms — acceptable for most applications
- RRF requires both result sets fully computed before fusion — memory overhead
- Index both columns independently — PostgreSQL can use bitmap OR for parallel index scans

## Production Considerations

- Test hybrid weight α on representative queries — not intuition-driven
- Index both `tsvector` (GIN) and `vector` (HNSW) columns before running hybrid queries
- Monitor query plans — ensure indexes are being used, not sequential scans
- Implement timeout on hybrid queries — combined search can be slower than expected
- Cache hybrid results for repeated queries — skip re-execution for exact match queries
- Log hybrid search quality metrics — track precision@K, recall@K over time

## Common Mistakes

- Assuming hybrid search is always better than pure vector search — test on your data
- Using equal weights (α=0.5) without testing — optimal weight varies by domain
- Not normalizing scores before combination — vector distance [-1,1] vs. ts_rank [0,1]
- Ignoring tsvector language configuration — wrong language config degrades keyword matching
- Running hybrid search on unindexed columns — slow full-table scans

## Failure Modes

- **Score domain mismatch**: Vector scores (-1 to 1) and ts_rank (0 to 1) need normalization before combining
- **Weight calibration failure**: Wrong α overweights one method — test on representative query set
- **GIN index bloat**: tsvector GIN index grows over time — periodic reindexing required
- **Query ambiguity**: Neither vector nor full-text captures rare technical terms — user query is too vague
- **Language mismatch**: Content and query in different languages — tsvector language detection fails

## Ecosystem Usage

- Laravel's `whereVectorSimilarTo()` + `whereFullText()` can be combined in single query
- `moneo/laravel-rag` provides built-in hybrid search with configurable fusion strategy
- pgvector has no built-in hybrid search — fusion logic is in application-level SQL
- Custom trait adding `scopeHybridSearch()` to Eloquent models is a common pattern

## Related Knowledge Units

- KU-021: RAG Pipeline with SimilaritySearch
- KU-023: Embedding Generation
- KU-024: Reranking
- KU-028: pgvector Native Support

## Research Notes

- pgvector doesn't natively support hybrid search — fusion is application-level
- 72% of production RAG systems use hybrid search (2026 survey data)
- RRF is preferred over weighted because it doesn't require score normalization
- Optimal hybrid weight is domain-specific and should be empirically determined
- PostgreSQL GIN index on tsvector + HNSW index on vector → single query hybrid search is production-viable
