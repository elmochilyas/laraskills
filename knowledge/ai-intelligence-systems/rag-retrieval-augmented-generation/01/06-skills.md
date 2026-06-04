# Skill: Implement RAG Architecture Pipeline
## Purpose
Build a production RAG pipeline with separate async indexing (chunk -> embed -> store) and synchronous query (embed -> search -> format -> generate) services, with hybrid search, access control, and retrieval quality monitoring.
## When To Use
- Q&A systems over large document collections (documentation, manuals, policies)
- Customer support bots answering from a knowledge base
- Applications requiring up-to-date information beyond model training cutoff
- Compliance-sensitive applications where answers must cite specific sources
## When NOT To Use
- General conversation where model training data is sufficient
- Real-time applications where retrieval latency (200-500ms) is unacceptable
- Very small static knowledge bases that fit in system prompt
- When knowledge base contains information the model should not have access to
## Prerequisites
- Vector database (pgvector, Qdrant, Pinecone)
- Embedding model configured in laravel/ai SDK
- Document corpus to index
- LLM provider for generation
## Inputs
- Documents to index (text, metadata)
- User query
- Retrieval configuration (top-K, minSimilarity, chunk size/overlap)
- Embedding model configuration (model name, dimensions)
## Workflow (numbered)
1. Separate indexing pipeline (async queue job) from query pipeline (synchronous service)
2. Implement chunking with configurable size (256-512 tokens) and overlap (10-20%)
3. Generate embeddings using consistent embedding model (same model for indexing and querying)
4. Store vectors in pgvector with HNSW index
5. Implement hybrid search combining vector similarity + keyword (BM25) with RRF fusion
6. Set minSimilarity threshold (0.7-0.8) to filter irrelevant results
7. Implement document-level access control filtering at database level
8. Set context token budget (30-70% of context window for retrieved documents)
9. Sanitize retrieved documents for prompt injection before context injection
10. Track retrieval quality (precision, recall, MRR) with automated evaluation
## Validation Checklist
- [ ] Indexing pipeline (chunk -> embed -> store) async via queue
- [ ] Query pipeline (embed -> search -> format -> generate) synchronous
- [ ] Same embedding model used for indexing and querying
- [ ] Hybrid search (vector + BM25) available for improved recall
- [ ] minSimilarity threshold prevents irrelevant results
- [ ] Document-level access control filters at database level
- [ ] Context token budget prevents context window overflow
- [ ] Retrieved documents sanitized for injection
- [ ] Retrieval quality metrics tracked with automated evaluation
## Common Failures
- Using wrong chunk size — too small loses context, too large includes irrelevant content
- Not tracking which documents retrieved for which queries — can't debug retrieval quality
- Retrieving too many documents — consuming entire context window with low-value content
- Ignoring metadata filtering — searching entire corpus instead of relevant subset
- Not handling empty retrieval — model hallucinates instead of saying "I don't know"
## Decision Points
- **Chunk size**: 256-512 tokens for general RAG; 150-300 for precise Q&A; 600-1000 for summarization
- **top-K retrieval**: 3-5 for high precision; 5-10 for high recall
- **Hybrid search vs pure vector**: Hybrid for proper nouns, codes, exact matches; vector-only for semantic
- **Context budget**: 30-50% for chat applications; 50-70% for document analysis
## Performance Considerations
- Embedding latency: 50-200ms per query
- Vector search: 10-100ms with ANN indexing
- Total RAG latency: 1-3 seconds (embedding + search + LLM inference)
- Cache embeddings for repeated queries (content-hash key, TTL based on freshness)
## Security Considerations
- Document-level access control — filter results based on user permissions
- Retrieved documents may contain sensitive information — ensure user has access
- Sanitize documents for prompt injection before injecting into LLM context
- Validate all ingested documents (index poisoning prevention)
- Ensure retrieved documents are authentic (content-addressed storage)
## Related Rules (from 05-rules.md)
- Separate Indexing and Query Pipelines
- Use the Same Embedding Model for Indexing and Querying
- Implement Hybrid Search for Better Recall
- Implement Document-Level Access Control
- Sanitize Retrieved Documents for Injection
- Set a Context Token Budget
- Track Retrieval Quality Over Time
## Related Skills
- Implement Document Chunking Strategies
- Implement Embedding Generation and Caching
- Implement Hybrid Search Pipeline with RRF Fusion
## Success Criteria
- Retrieval quality (recall@5) > 0.8 measured via automated evaluation
- Total RAG latency < 3 seconds for user-facing queries
- No unauthorized document access via retrieval (access control verified)
- Context budget prevents token overflow while providing sufficient grounding
