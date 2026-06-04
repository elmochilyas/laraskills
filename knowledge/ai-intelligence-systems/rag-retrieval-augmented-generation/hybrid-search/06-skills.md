# Skill: Implement Hybrid Search with RRF Fusion
## Purpose
Combine vector similarity search with full-text keyword search using Reciprocal Rank Fusion (RRF) for superior text retrieval recall and precision.
## When To Use
- Any text retrieval system where both semantic meaning and exact keyword matches matter
- RAG pipelines where users query with proper nouns, IDs, acronyms, or domain-specific terms
- Search applications where missing exact matches causes user frustration
## When NOT To Use
- Non-text search (image similarity, audio fingerprinting)
- Applications where all queries are purely semantic with no keyword components
## Prerequisites
- pgvector extension on PostgreSQL
- Full-text search index (tsvector) on text columns
- Vector similarity query capability (whereVectorSimilarTo or equivalent)
## Inputs
- User query string
- Embedding of the query (dense vector)
- Full-text search query (parsed from user query)
- RRF constant k (default 60)
- Combined ranking query
## Workflow (numbered)
1. Generate query embedding for dense vector search
2. Parse query for full-text keyword search (tsquery, plainto_tsquery)
3. Run ANN vector search (top-K with HNSW)
4. Run full-text keyword search (top-K with ts_rank)
5. Fuse rankings using RRF: `score = sum(1.0 / (k + rank_per_set))` across both result sets
6. Apply metadata filters (tenant, date, category) to fused results
7. Return top-N results with fused scores
8. Log query and result metadata for quality evaluation
## Validation Checklist
- [ ] Both vector and full-text search indexes exist
- [ ] RRF fusion implemented (not simple score averaging)
- [ ] RRF constant k is configurable (default 60)
- [ ] Metadata filters applied after fusion
- [ ] Hybrid search recall measured and superior to pure vector or pure keyword alone
- [ ] Query logging captures which method contributed to top results
## Common Failures
- Using pure vector search that misses exact keyword matches (IDs, product codes)
- Simple score averaging without RRF — loses ranking signal from each method
- Not normalizing scores before fusion — one method dominates unfairly
- Applying metadata filters before fusion — reduces candidate pool too early
## Decision Points
- **RRF vs weighted combination**: RRF for robust rank-based fusion; weighted combination (`alpha * vector + (1-alpha) * keyword`) for score-based when scores are normalized
- **RRF k value**: k=60 (default, balanced); lower k gives more weight to top ranks; higher k spreads weight across more results
- **Top-K per method**: 100-200 each for fusion; higher K ensures good recall but increases fusion computation
## Performance Considerations
- Hybrid search ~2x latency of single-method search (both queries run)
- RRF fusion computation: O(N log N) for N candidates — negligible for <1000 candidates
- tsvector query: 1-5ms with GIN index
- ANN vector query: 5-10ms with HNSW index
- Total hybrid search: 10-50ms typical
## Security Considerations
- Sanitize user query before full-text search to prevent injection
- Apply tenant/access control filters to both vector and keyword result sets
- Log query patterns to detect scraping or injection attempts
- Ensure fused results respect document-level access control
## Related Rules (from 05-rules.md)
- Always Use Hybrid Search for Text Retrieval
## Related Skills
- Implement RAG Architecture Pipeline
- Configure and Tune Vector Search Indexes
- Implement RAG Pipeline with Similarity Search
## Success Criteria
- Hybrid search recall@10 > 0.90 (vs typical 0.75 for pure vector)
- Exact keyword matches (IDs, product codes, proper nouns) appear in top results
- Semantic matches (synonyms, paraphrases) also appear in top results
- Query latency within acceptable range for use case
