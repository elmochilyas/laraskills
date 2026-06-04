# Skills

## Skill 1: Set up vector database with ANN index for similarity search

### Purpose
Configure a vector database collection with the appropriate ANN index (HNSW for production), distance metric, and metadata filtering schema before inserting vectors, ensuring fast approximate nearest neighbor search with configurable recall and performance.

### When To Use
- Use when implementing RAG (retrieval-augmented generation) with vector similarity search
- Use when building semantic search, recommendation, or clustering features
- Use when you need to store and search vector embeddings from LLM providers
- Use when dataset exceeds 10K vectors (below that, flat search is acceptable)

### When NOT To Use
- Do NOT use without creating an ANN index — brute-force search is unusably slow for >10K vectors
- Do NOT use when exact nearest neighbor search is required (use flat/kNN instead)
- Do NOT use without understanding the distance metric match to the embedding model

### Prerequisites
- Vector database instance (pgvector, Qdrant, Pinecone, Milvus)
- Embedding generation configured (OpenAI, local model, or other provider)
- Understanding of vector dimensions and distance metrics
- Collection/index creation API access

### Inputs
- Vector dimensions (e.g., 1536 for OpenAI text-embedding-3-small)
- Distance metric (cosine, Euclidean, dot product)
- Index type (HNSW, IVF, Flat)
- Metadata schema (fields to filter on)
- Estimated dataset size for index configuration

### Workflow
1. Choose the vector database: pgvector (simplest for Laravel), Qdrant (best performance), Pinecone (managed)
2. Determine vector dimensions from the embedding model (OpenAI ada-002: 1536, text-embedding-3-small: 1536)
3. Choose the distance metric matching the embedding model:
   - Cosine similarity: most common, use with normalized embeddings
   - Euclidean (L2): use when magnitude matters
   - Dot product: use with normalized embeddings for speed
4. Create the collection/index with ANN index before inserting vectors:
   ```php
   $store->createCollection('documents', dimensions: 1536, indexConfig: [
       'type' => 'hnsw',
       'm' => 16,
       'ef_construction' => 200,
   ]);
   ```
5. Define metadata schema for filtering (tenant_id, source, date, category)
6. Insert vectors after index creation
7. Test search performance: query latency, recall accuracy, throughput

### Validation Checklist
- [ ] ANN index is created before vectors are inserted (not flat/brute force)
- [ ] Index type matches workload requirements (HNSW for production)
- [ ] Distance metric matches the embedding model's training
- [ ] Metadata schema supports all required filter dimensions
- [ ] Index parameters are tuned for dataset size (ef_construction, M for HNSW)
- [ ] Search performance meets latency targets (<50ms for user-facing search)
- [ ] Recall accuracy meets requirements (measure against brute-force baseline)
- [ ] Insert performance is acceptable for the sync frequency
- [ ] Memory requirements are within available RAM

### Common Failures
- **No index**: Searches use brute-force — 100ms at 10K, 10s at 1M vectors
- **Wrong distance metric**: Cosine used for L2-normalized model — results are incorrect
- **Index created after inserts**: Some vectors excluded from index — rebuild required
- **Index params too low**: Low ef_construction causes poor recall — tune for dataset size
- **Metadata not indexed**: Filter queries scan all matching vectors — create metadata indexes

### Decision Points
- **Index type**: HNSW (best recall/speed, more memory) vs. IVF (less memory, lower recall) vs. Flat (<10K vectors)
- **Index parameters**: Higher ef_construction = better recall, slower build. Higher M = better recall, more memory.
- **Distance metric**: Cosine for semantic similarity, Euclidean for magnitude-sensitive tasks
- **Storage engine**: pgvector (in-DB, transactional) vs. Qdrant (dedicated, faster) vs. Pinecone (managed, zero-ops)

### Performance Considerations
- HNSW query latency: O(log n), typically <10ms for 1M vectors
- IVF query latency: depends on nprobe parameter, typically <50ms for 1M
- Index build time: proportional to ef_construction and M parameters
- Memory: HNSW requires 2-4x raw vector size in RAM
- Insert performance: HNSW supports incremental inserts, IVF needs periodic rebuild

### Security Considerations
- Vector search results can leak information about stored data — implement access control
- Metadata filters should enforce tenant isolation
- Never expose the vector database directly to the internet
- Encrypt vector data at rest if storing sensitive information
- Implement rate limiting on vector search endpoints

### Related Rules
- R1: Create an ANN Index Before Inserting Vectors — never search against unindexed vectors in production

### Related Skills
- Configure indexing strategies for vector databases (HNSW, IVF, PQ)
- Implement query patterns with pre-filtering and hybrid search
- Set up data synchronization for vector databases
- Evaluate vector database provider selection and migration

### Success Criteria
- ANN index is created before any vector insertions
- Search latency meets targets (<50ms for user-facing, <200ms for RAG)
- Recall accuracy against brute-force baseline exceeds 95%
- Memory usage is within allocated RAM budget
- Insert throughput meets sync frequency requirements
- Metadata filters work correctly alongside vector search
