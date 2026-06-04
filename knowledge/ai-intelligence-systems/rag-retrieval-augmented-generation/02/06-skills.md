# Skill: Implement Semantic Document Chunking
## Purpose
Split documents at natural semantic boundaries (paragraphs, sections, sentences) using recursive or document-aware strategies for optimal retrieval coherence.
## When To Use
- RAG pipelines where chunk quality directly impacts retrieval quality
- Documents with clear structure (headings, sections, code blocks, tables)
- Improving retrieval after observing poor quality with fixed-size chunking
## When NOT To Use
- Homogeneous plain text with no structural elements — recursive chunking with sentence boundaries suffices
- Prototypes where simple fixed-size chunking is acceptable initially
## Prerequisites
- Document corpus to chunk
- Chunking strategy implementation (recursive, semantic, document-aware)
- Understanding of chunk size sweet spot for content type
## Inputs
- Source documents (plain text, Markdown, HTML, PDF)
- Chunk size (recommended: 300-600 tokens for general RAG)
- Overlap percentage (recommended: 10-20%)
- Structural protection rules (tables, code blocks)
## Workflow (numbered)
1. Start with recursive chunking (character -> paragraph -> sentence fallback) as baseline
2. Configure chunk size 300-600 tokens with 10-20% overlap
3. Keep tables, code blocks, and list items intact — never split across chunks
4. Propagate source metadata (title, section, position) to each chunk
5. Tag chunks by type ("narrative", "table", "code", "list")
6. Version chunking strategy and store identifier with each chunk
7. Measure recall@K before and after strategy changes
## Validation Checklist
- [ ] Recursive chunking baseline established with measured recall@K
- [ ] Tables, code blocks, lists never split across chunks
- [ ] Source metadata propagated per chunk
- [ ] Chunking strategy versioned and stored per chunk
- [ ] Strategy changes trigger full re-indexing
## Common Failures
- Fixed-size without overlap — context lost at boundaries
- Splitting tables/code blocks — both halves useless
- All content types chunked identically — code, tables, prose need different strategies
- Over-chunking (too small) — loses context, increases noise
## Decision Points
- **Recursive vs semantic vs document-aware**: Recursive for baseline; semantic for diverse topics; document-aware for structured content
- **Chunk size**: 300-600 for general; 150-300 for precise Q&A; 600-1000 for summarization
## Performance Considerations
- Fixed-size: ~1M tokens/second; Semantic: ~100K tokens/second
- More chunks = more rows — pgvector handles millions easily
## Security Considerations
- Never change chunking strategy for populated index without re-embedding
- Version strategy — store identifier per chunk for debugging
## Related Rules (from 05-rules.md)
- Prefer Semantic Chunking Over Fixed-Size
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Embedding Generation and Caching
## Success Criteria
- Retrieval quality improved over naive fixed-size chunking
- Structural elements remain intact and retrievable
- Chunking strategy versioned for reproducibility
