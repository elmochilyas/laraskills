# Skill: Implement Vector Search with Metadata Filtering and Hybrid Retrieval

## Purpose
Build production-grade vector search queries that combine semantic similarity with metadata filtering, hybrid vector-keyword retrieval, and re-ranking to deliver relevant, contextually appropriate results.

## When To Use
- Building a search endpoint for a RAG system or semantic search application
- Multi-tenant systems requiring tenant-scoped results
- Applications needing both semantic understanding and exact keyword matching
- High-precision retrieval workflows using multi-stage search (retrieve → re-rank)

## When NOT To Use
- Simple single-corpus search with no filtering requirements
- Systems where exact recall of every relevant document is not critical
- Datasets under 1,000 vectors where application-layer filtering is acceptable
- Non-text search (image similarity, audio fingerprinting) that doesn't benefit from keyword search

## Prerequisites
- KU-01 (Vector Database Fundamentals) — understanding of vector queries and search
- KU-02 (Indexing Strategies) — index configuration affects query performance
- Vector database with metadata filtering and (optionally) full-text search support
- Embedding service configured and available

## Inputs
- Query text from the user
- Query vector from embedding service
- Metadata filter criteria (tenant, date range, source, access level)
- Hybrid search weight preference (vector vs. keyword fusion weight)
- Minimum score threshold
- Top-K count

## Workflow
1. **Parse query and extract filters**: Receive the user query, parse metadata filter conditions from request parameters (tenant_id, date range, source, access level), and validate filter fields against the allowed filter schema.
2. **Build the query object**: Construct a standardized query using a fluent builder pattern: `$store->query($vector)->where('field', 'eq', $value)->topK(10)->minScore(0.7)`.
3. **Decide pre-filter vs. post-filter**: If metadata filters are highly selective (match <50% of data), use pre-filtering to narrow the search space before vector search. For low-selectivity filters (match >90%), post-filtering is acceptable.
4. **Execute vector search**: Run the vector search against the index with pre-filters applied. Measure latency.
5. **Execute keyword search (if hybrid)**: Run the original query text through full-text search (BM25, PostgreSQL FTS) with the same filters. Run both searches in parallel for minimal added latency.
6. **Fuse results**: Use Reciprocal Rank Fusion (RRF) to combine vector and keyword result sets with configurable weights. Start with equal weighting (0.5/0.5) and tune based on evaluation.
7. **Apply post-filtering and threshold**: If post-filtering is needed, apply it to the fused results. Discard results below the minimum score threshold.
8. **Re-rank if needed**: For precision-critical applications, apply a cross-encoder re-ranker to the top 20 results for more accurate relevance scoring.
9. **Return results and log metrics**: Return the formatted results. Log query latency, result count, filter selectivity, and cache the result for identical queries.

## Validation Checklist
- [ ] Pre-filtering is used for selective metadata filters (not post-filtering)
- [ ] Filter syntax is standardized across providers (not provider-specific in application code)
- [ ] Database indexes exist on commonly filtered metadata fields
- [ ] Minimum score threshold is configured to filter low-relevance results
- [ ] Hybrid search (vector + keyword) is available with configurable fusion weight
- [ ] Query results are normalized to consistent score range (0-1)
- [ ] Frequent queries are cached (semantic cache or exact-match cache)

## Common Failures
- **Too few results after filtering**: Using post-filtering with a selective filter that matches <10% of vectors, returning 0-2 results instead of top-K. Fix by switching to pre-filtering.
- **Filter syntax errors**: Using provider-specific filter syntax (Qdrant `must`/`should`) in application code. Fix by standardizing through the query builder interface.
- **Low relevance results**: No minimum score threshold causes top-K results with similarity as low as 0.05. Fix by setting minScore to 0.6-0.7.
- **Missing exact matches**: Pure vector search fails on proper nouns, codes, and IDs. Fix by enabling hybrid search with keyword fusion.

## Decision Points
- **Pre-filter vs. post-filter**: If the filter matches <50% of data (selective), use pre-filtering. If >90%, post-filtering is acceptable. For everything else, pre-filter to preserve effective K.
- **Hybrid search vs. pure vector**: Enable hybrid search for text corpora with proper nouns, codes, or exact match requirements. Pure vector is sufficient for semantic-only queries.
- **Re-ranking necessity**: Use re-ranking only when precision is critical (question answering, legal search). Adds 50-200ms latency but improves relevance by 5-15%.

## Performance Considerations
- Pre-filtering with selective filters (10% match) reduces search space by 10x
- Hybrid search adds 20-100ms total (vector + keyword + fusion)
- Re-ranking with cross-encoder: 50-200ms per query (re-ranking top-20)
- Cache hit rate: 20-40% for user-facing search; TTL depends on content update frequency
- Filter evaluation: simple equality filters <1ms; complex nested conditions slow search significantly

## Security Considerations
- Validate and sanitize metadata filter parameters to prevent injection attacks
- Apply access control filters (tenant_id, access_level) server-side; never trust client-provided filter values
- Ensure filtered results respect data visibility rules — a user should never see results they don't have access to
- Log queries with filter parameters for audit trail

## Related Rules
- Prefer Pre-Filtering Over Post-Filtering
- Standardize Filter Syntax Across Providers
- Set a Minimum Score Threshold
- Implement Hybrid Search for Text Corpora
- Cache Frequent Query Results

## Related Skills
- Skill: Configure and Tune Vector Database Indexes (ku-02)
- Skill: Set Up and Query a Vector Database (ku-01)
- Skill: Build a RAG Retrieval Pipeline (rag-01)

## Success Criteria
- Search results respect all metadata filters (tenant isolation, access control, date range)
- Pre-filtering returns full top-K results even with selective filters
- Hybrid search successfully retrieves documents matched by keyword (proper nouns, codes) that pure vector search misses
- p50 query latency <50ms, p99 <200ms for vector-only; <100ms/<300ms for hybrid
- Cache hit rate >20% for production query volume