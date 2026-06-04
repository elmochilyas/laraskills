---
id: KU-025
title: "Hybrid Search"
subdomain: "rag-retrieval-augmented-generation"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/04-rag-retrieval-augmented-generation/hybrid-search/04-standardized-knowledge.md"
---

# Hybrid Search

## Overview

Hybrid search combines vector similarity search (semantic) with full-text keyword search to overcome the limitations of each. Vector search captures meaning but misses exact keyword matches. Full-text search catches precise terms but misses semantic relationships. pgvector enables hybrid search in a single PostgreSQL query by combining `<=>` vector distance with `tsvector` full-text ranking.

## Core Concepts

- **Dense retrieval**: Vector cosine similarity â€” captures semantic meaning, handles synonyms and paraphrasing
- **Sparse retrieval**: Keyword/full-text search (TSVECTOR, BM25) â€” exact term matching, handles acronyms, IDs, domain-specific terms
- **Hybrid fusion**: Combine dense and sparse scores into unified ranking
- **Reciprocal Rank Fusion (RRF)**: Common fusion algorithm â€” `score = 1 / (k + rank)` per result set, sum across sets
- **Weighted combination**: `final_score = Î± * vector_score + (1-Î±) * bm25_score` â€” Î± tunable per use case
- **pgvector + tsvector**: Single SQL query combining `WHERE` filters, `tsvector` match, and vector similarity

## When To Use

- Production applications requiring Hybrid Search functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Î± weighting**: Tune hybrid weight per content type â€” code docs (more keyword) vs. support articles (more semantic)
- **RRF fusion**: More robust than weighted â€” doesn't require score normalization
- **Metadata pre-filter**: Apply WHERE filters (tenant, date, type) before hybrid search
- **Cascading retrieval**: Hybrid for broad recall â†’ Rerank for precision
- **Boolean filtering**: Combine vector search with SQL WHERE clauses for access control

- **Two signals, one answer**: Like combining GPS (where you are â€” semantic) with street signs (where you need to go â€” keyword). Each compensates for the other's blind spots.
- **Ensemble for search**: Like ensemble ML â€” two weak retrieval methods combine to produce stronger results than either alone.

## Architecture Guidelines

- **Decision**: Database-level hybrid vs. application-level fusion â†’ Database-level (pgvector + tsvector in single query). Reason: One query, no data transfer between systems, consistent ACID semantics.
- **Decision**: RRF vs. weighted fusion â†’ RRF default (no score normalization needed); weighted for domain-tuned deployments.
- **Decision**: tsvector vs. external search â†’ tsvector built into PostgreSQL. Reason: No additional infrastructure, hybrid query in one SQL statement.

## Performance Considerations

- Hybrid query is slower than either alone â€” both index scans run sequentially
- tsvector index scan: ~5-50ms for 1M rows
- HNSW vector index scan: ~5-50ms for 1M rows (depends on ef_search)
- Combined: 10-100ms â€” acceptable for most applications
- RRF requires both result sets fully computed before fusion â€” memory overhead
- Index both columns independently â€” PostgreSQL can use bitmap OR for parallel index scans

| Approach | Recall | Precision | Complexity | Best For |
|----------|--------|-----------|------------|----------|
| Vector only | High (semantic) | Medium | Low | General content, synonyms |
| Full-text only | Medium | High | Low | Exact terms, IDs, code |
| Hybrid (RRF) | Very High | High | Medium | Production RAG |
| Hybrid (weighted) | Very High | Highest | High | Tuned, domain-specific |

## Security Considerations

- Test hybrid weight Î± on representative queries â€” not intuition-driven
- Index both `tsvector` (GIN) and `vector` (HNSW) columns before running hybrid queries
- Monitor query plans â€” ensure indexes are being used, not sequential scans
- Implement timeout on hybrid queries â€” combined search can be slower than expected
- Cache hybrid results for repeated queries â€” skip re-execution for exact match queries
- Log hybrid search quality metrics â€” track precision@K, recall@K over time

## Common Mistakes

- Assuming hybrid search is always better than pure vector search â€” test on your data
- Using equal weights (Î±=0.5) without testing â€” optimal weight varies by domain
- Not normalizing scores before combination â€” vector distance [-1,1] vs. ts_rank [0,1]
- Ignoring tsvector language configuration â€” wrong language config degrades keyword matching
- Running hybrid search on unindexed columns â€” slow full-table scans

## Anti-Patterns

- **Score domain mismatch**: Vector scores (-1 to 1) and ts_rank (0 to 1) need normalization before combining
- **Weight calibration failure**: Wrong Î± overweights one method â€” test on representative query set
- **GIN index bloat**: tsvector GIN index grows over time â€” periodic reindexing required
- **Query ambiguity**: Neither vector nor full-text captures rare technical terms â€” user query is too vague
- **Language mismatch**: Content and query in different languages â€” tsvector language detection fails

## Examples

The following ecosystem packages provide reference implementations:

- Laravel's `whereVectorSimilarTo()` + `whereFullText()` can be combined in single query
- `moneo/laravel-rag` provides built-in hybrid search with configurable fusion strategy
- pgvector has no built-in hybrid search â€” fusion logic is in application-level SQL
- Custom trait adding `scopeHybridSearch()` to Eloquent models is a common pattern

## Related Topics

- KU-021: RAG Pipeline with SimilaritySearch
- KU-023: Embedding Generation
- KU-024: Reranking
- KU-028: pgvector Native Support

## AI Agent Notes

- When asked about Hybrid Search, first determine the specific use case and requirements.
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

