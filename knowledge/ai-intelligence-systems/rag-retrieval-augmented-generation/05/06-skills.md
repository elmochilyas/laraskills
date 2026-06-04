# Skill: Measure and Improve Retrieval Quality
## Purpose
Build a test collection of query-relevant document pairs, establish baseline retrieval metrics (precision, recall, MRR, NDCG), and continuously evaluate retrieval quality changes.
## When To Use
- Before making any retrieval optimization (chunking, embedding, hybrid search, reranking)
- Monitoring retrieval quality over time as corpus grows
- Diagnosing poor RAG response quality suspected to be caused by retrieval failures
## When NOT To Use
- Prototypes with no production users
- Before a minimum viable RAG pipeline is built and deployed
## Prerequisites
- RAG pipeline with configurable components (chunker, embedder, retriever, reranker)
- Test collection of 100-500 query-relevant document pairs
- Retrieval evaluation utilities (precision@K, recall@K, MRR, NDCG)
## Inputs
- Test collection: queries with known relevant document IDs
- Retrieval pipeline configuration to evaluate
- Metric selection (precision@K, recall@K, MRR, NDCG, hit rate)
- Baseline metrics for comparison
## Workflow (numbered)
1. Curate test collection of 100-500 queries with known relevant documents
2. Establish baseline metrics with current retrieval pipeline
3. Run ablation studies: disable components (hybrid search, reranking) to measure their impact
4. Tune parameters: chunk size, overlap, top-K, minSimilarity, RRF k — one parameter at a time
5. Measure and compare each change against baseline
6. Enforce quality gate: reject changes that degrade recall@K below threshold (e.g., 0.8)
7. Monitor retrieval quality in production with logged query-result pairs
8. Periodically refresh test collection to cover new query patterns
## Validation Checklist
- [ ] Test collection curated (100-500 query-relevant document pairs)
- [ ] Baseline metrics established before any optimization
- [ ] Ablation studies measure impact of each component
- [ ] Parameter tuning done systematically (one parameter at a time)
- [ ] Quality gate prevents retrieval degradation
- [ ] Production retrieval quality monitored via logged queries
- [ ] Test collection periodically refreshed
## Common Failures
- Optimizing without baseline — can't measure if changes improve or degrade quality
- Tuning multiple parameters simultaneously — can't attribute improvement
- Test collection not representative of real user queries — optimizations don't generalize
- Overfitting to test collection — optimizations don't improve real-world retrieval
- Not monitoring production quality — silent degradation goes undetected
## Decision Points
- **Metric selection**: Precision@K for noise measurement; Recall@K for completeness; MRR for first-result quality; NDCG for graded relevance
- **Test collection size**: 100+ queries minimum for statistical significance; 500+ for comprehensive coverage
- **Annotation method**: Human-annotated (highest quality) vs LLM-annotated (scalable, medium quality)
## Performance Considerations
- Evaluation run: 100 queries x 5 configurations = 500 eval runs
- Automated pipeline evaluation: 10-30 minutes per full evaluation
- Production monitoring: negligible overhead (log query + result IDs)
## Security Considerations
- Test collection may contain sensitive queries — store with appropriate access control
- Production query logging must redact PII before storage
- Ensure test collection doesn't include queries that reveal business sensitive information
## Related Rules (from 05-rules.md)
- Build a Test Collection Before Optimizing
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Hybrid Search with RRF Fusion
- Implement Cross-Encoder Reranking for RAG
## Success Criteria
- Baseline metrics established and documented
- Each optimization shows measured improvement over baseline
- Quality gate prevents deployment of retrieval-degrading changes
- Production retrieval quality monitored with alerting on degradation
