# Skill: Implement Cross-Encoder Reranking for RAG
## Purpose
Improve RAG precision by applying a cross-encoder reranker to reorder retrieved chunks after initial ANN search, selecting the most relevant top-N for LLM context.
## When To Use
- RAG pipelines where context window is limited and every chunk must be high-value
- Applications requiring high-precision retrieval (legal, medical, compliance)
- When initial ANN search returns false positives that degrade response quality
## When NOT To Use
- Simple, unambiguous queries where top ANN result is reliably correct (recall@1 > 95%)
- High-throughput systems where reranking latency (200-500ms) is unacceptable
- Prototypes before baseline retrieval quality is measured
## Prerequisites
- Initial retrieval pipeline (ANN/HNSW) returning top-K candidates
- Reranking provider configured (Cohere Rerank, Jina Reranker)
- Understanding of two-stage retrieval architecture
## Inputs
- User query string
- Top-K candidate chunks from initial ANN search (K=20-30)
- Reranking configuration (topN, minScore, model)
## Workflow (numbered)
1. Run first-stage ANN search retrieving top-K (K=20-30, configured 3-4x final context size)
2. Send query + candidate chunks to reranking provider API
3. Receive scored and reordered results from reranker
4. Filter results below minScore threshold (e.g., 0.5)
5. Keep top-N (N=5-10, final context size)
6. Inject reranked chunks into LLM context in score order
7. Log reranking scores for quality monitoring and threshold tuning
## Validation Checklist
- [ ] First stage retrieves 3-4x more chunks than final context size
- [ ] Reranker scores all candidate chunks against the query
- [ ] Results below minScore filtered out
- [ ] Reranking precision gain measured against baseline (no reranking)
- [ ] Reranking latency tracked and acceptable (<500ms)
- [ ] Reranking provider costs monitored
- [ ] Fallback to unreranked results if reranker fails or times out
## Common Failures
- Retrieving too few candidates (K=N) — reranker has no room to improve
- Not setting minScore — reranker may include low-relevance chunks
- Reranking too many candidates (K=100+) — expensive and diminishing returns
- No fallback when reranker API fails — retrieval pipeline breaks
- Not measuring precision improvement — don't know if reranking helps
## Decision Points
- **K (retrieve count)**: 3-4x final N; K=20 for N=5, K=40 for N=10
- **N (final count)**: Match context window budget; 5-10 typical
- **minScore threshold**: 0.5 default; tune based on precision/recall tradeoff
- **Reranking provider**: Cohere Rerank (industry standard) vs Jina Reranker (alternative)
## Performance Considerations
- Reranking 20 items: 200-500ms (API call) — dominates total retrieval latency
- Total with reranking: 250-550ms per query
- Reranking 100 items: 500-1000ms — diminishing returns
- Cache reranking results for identical query-chunk pairs
## Security Considerations
- Reranking provider receives both query and chunk content — ensure provider meets data handling requirements
- Never send sensitive document content to reranking providers without data processing agreement
- Implement fallback to unreranked results if reranker is unavailable
- Log reranking provider API usage for cost tracking
## Related Rules (from 05-rules.md)
- Retrieve More, Rerank Tightly
## Related Skills
- Implement Hybrid Search with RRF Fusion
- Implement RAG Pipeline with Similarity Search
- Implement Citation-Grounded Answers
## Success Criteria
- Reranking improves precision@5 by 15-30% over raw ANN results
- Reranking latency < 500ms (acceptable for user-facing queries)
- Fallback to unreranked results works when reranker is unavailable
- Reranking costs tracked and within budget
