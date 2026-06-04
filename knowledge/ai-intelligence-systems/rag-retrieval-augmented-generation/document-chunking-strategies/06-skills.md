# Skill: Implement Document Chunking Strategies
## Purpose
Select and configure optimal document chunking strategies (fixed-size, recursive, semantic, document-aware) for RAG pipelines, balancing retrieval precision, recall, and computational cost.
## When To Use
- Building any RAG pipeline requiring document ingestion
- Diagnosing and improving poor retrieval quality
- Handling diverse document types (code, tables, prose, structured docs)
## When NOT To Use
- Very small documents (<512 tokens) that don't need chunking
- Prototypes where simple fixed-size chunking suffices initially
## Prerequisites
- Document corpus to chunk and index
- Understanding of chunking parameters (size, overlap, strategy)
- Embedding model configuration for semantic chunking
## Inputs
- Source documents (plain text, Markdown, HTML, PDF)
- Chunk size configuration (recommended start: 300-600 tokens)
- Overlap percentage (recommended start: 10-20%)
- Content type classification (prose, code, tables, mixed)
## Workflow (numbered)
1. Start with recursive chunking (character -> paragraph -> sentence fallback) as baseline
2. Configure chunk size: 300-600 tokens for general RAG; adjust per content type
3. Set overlap at 10-20% to prevent context loss at boundaries
4. Keep structural elements intact — never split tables, code blocks, or list items across chunks
5. Propagate metadata (source document, section hierarchy, position) with each chunk
6. Tag chunks by type ("narrative", "table", "code", "list") for strategy-specific retrieval
7. Measure retrieval quality (recall@K, precision@K) with baseline strategy
8. Iterate: try document-aware chunking if structure matters, semantic chunking if topic shifts are frequent
9. Version and store chunking strategy identifier with each chunk
## Validation Checklist
- [ ] Recursive chunking baseline established with measured recall@K
- [ ] Chunk size optimized for content type (not one-size-fits-all)
- [ ] Overlap prevents context loss at chunk boundaries
- [ ] Tables, code blocks, and lists never split across chunks
- [ ] Each chunk carries source metadata for citation and filtering
- [ ] Chunks tagged by type for strategy-specific retrieval
- [ ] Chunking strategy versioned and stored with each chunk
- [ ] Strategy change triggers re-embedding of entire corpus
## Common Failures
- Fixed-size chunking without overlap — context lost at boundaries
- Chunking all content types identically — code, tables, and prose need different strategies
- Over-chunking (too small) — loses surrounding context, increases noise
- Under-chunking (too large) — retrieves irrelevant content within large chunk
- Splitting tables or code blocks across chunks — both halves useless
- Not capturing chunk metadata — can't cite sources or filter by section
## Decision Points
- **Strategy selection**: Recursive for general purpose; document-aware for structured content; semantic for diverse topics
- **Chunk size**: 300-600 tokens for general RAG; 150-300 for precise Q&A; 600-1000 for summarization
- **Overlap**: 10-20% overlap for general use; higher for dense technical content
- **Structural protection**: Enable for Markdown, code, tables; skip for plain prose
## Performance Considerations
- Chunking happens during ingestion (not query path) — complexity is acceptable
- Fixed-size: ~1M tokens/second throughput
- Semantic: ~100K tokens/second (depends on embedding model latency)
- More chunks = more rows, but pgvector handles millions easily
## Security Considerations
- Never change chunking strategy for a populated index without re-embedding
- Version your chunking strategy — store identifier per chunk for debugging
- Test chunk quality with representative queries before full ingestion
- Monitor chunk size distribution — unexpected sizes indicate parsing issues
- Implement chunk-level caching — re-chunk only changed source documents
## Related Rules (from 05-rules.md)
- Never Change Chunking Strategy for a Populated Index
- Start with Recursive Chunking, Iterate
- Keep Structural Elements (Tables, Code Blocks) Intact
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Embedding Generation and Caching
- Build RAG Pipeline with Similarity Search
## Success Criteria
- Retrieval quality improved 20-40% over naive fixed-size chunking
- Structural elements (tables, code) remain intact and retrievable
- Chunking strategy versioned and documented
- Strategy changes trigger full re-indexing with documented migration
