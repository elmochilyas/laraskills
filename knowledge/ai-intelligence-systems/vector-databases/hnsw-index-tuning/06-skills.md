# Skill: Tune HNSW Index Parameters for Vector Search
## Purpose
Configure and optimize HNSW index parameters (m, ef_construction, ef_search) to balance recall, query latency, index build time, and memory usage for production vector search.
## When To Use
- Production deployments with 100K+ vectors requiring fast search
- Diagnosing poor recall or high latency in vector search
- Scaling vector search to larger datasets
## When NOT To Use
- Small datasets (<10K vectors) where brute-force search is acceptable
- Prototypes before performance requirements are defined
## Prerequisites
- pgvector extension with HNSW index type
- Understanding of vector search recall/latency requirements
- Test dataset representative of production size
## Inputs
- Dataset size (number of vectors)
- Target recall (0.90, 0.95, 0.99)
- Target query latency (ms)
- Available memory for index
- Vector dimensionality (384, 768, 1536, 3072)
## Workflow (numbered)
1. Create HNSW index with `m=16, ef_construction=200` (good default for most workloads)
2. Benchmark recall at different ef_search values (40, 100, 200, 400)
3. Benchmark query latency at each ef_search value
4. Select ef_search per query pattern based on latency budget
5. For higher recall needs: increase m to 32 (more memory, 2x build time)
6. For faster build: reduce ef_construction to 100 (lower recall, faster build)
7. Monitor index memory usage and plan for growth
8. Document ef_search selection with recall/latency measurements
## Validation Checklist
- [ ] HNSW index created with appropriate m (default 16)
- [ ] ef_search configurable per query (not global fixed value)
- [ ] Recall measured at chosen ef_search (meets target)
- [ ] Query latency measured at chosen ef_search (meets target)
- [ ] Index memory usage within available RAM with headroom
- [ ] ef_search values documented with recall/latency tradeoffs
## Common Failures
- Creating index with wrong distance operator (cosine vs L2 vs inner_product)
- Using default ef_search without considering recall/latency tradeoff
- Not re-indexing after embedding model change — silent quality degradation
- Setting m too high causing excessive memory and build time
- Mixing different embedding models in same index
## Decision Points
- **m (connections per node)**: 16 (default, good balance); 32 (higher recall, more memory); 8 (lower memory, lower recall)
- **ef_construction (build quality)**: 200 (default); 400 (higher recall, 2x build time); 100 (faster build)
- **ef_search (query beam width)**: 40 (fast, ~95% recall); 100 (balanced, ~99%); 400 (high recall, ~99.9%)
## Performance Considerations
- HNSW memory: ~1.2GB per million vectors (1536d, float32)
- Query time: O(log n) per search — scales well to 10M+ vectors
- Build time: 10-60 minutes per million vectors depending on m and ef_construction
- ef_search=400 is ~10x slower than ef_search=40
## Security Considerations
- HNSW indexes can leak approximate data distribution — consider if dataset is sensitive
- Monitor query latency anomalies (potential extraction attempts)
- Set statement_timeout to prevent runaway vector searches
## Related Rules (from 05-rules.md)
- Tune ef_search Per-Query Based on Latency Budget
## Related Skills
- Implement pgvector Vector Search in Laravel
- Implement Multi-Tenant Vector Isolation
- Implement Hybrid Search with RRF Fusion
## Success Criteria
- Vector search meets target recall at acceptable latency
- Index fits within available memory with 20% headroom
- ef_search values are tuned per query pattern (not one-size-fits-all)
- Index rebuild time is understood and planned for model changes
