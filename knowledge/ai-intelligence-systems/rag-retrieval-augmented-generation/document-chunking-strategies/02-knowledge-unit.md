# Knowledge Unit: Document Chunking Strategies

## Metadata

- **ID:** KU-022
- **Subdomain:** Retrieval-Augmented Generation (RAG)
- **Slug:** document-chunking-strategies
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Chunking strategy is the single highest-leverage parameter in RAG quality. The same retrieval pipeline with different chunking can yield 20-40% accuracy differences. Strategies range from fixed-size character chunks to semantic-aware splitting that respects document structure. The Laravel ecosystem supports multiple chunking approaches via `moneo/laravel-rag` and custom implementations.

## Core Concepts

- **Fixed-size chunking**: Split by token count (e.g., 512 tokens) with overlap (10-20%)
- **Sentence chunking**: Split on sentence boundaries — preserves grammatical units
- **Semantic chunking**: Split on topic shifts using embedding similarity between sentences
- **Recursive chunking**: Hierarchical — split by paragraph first, then sentence, then fixed-size fallback
- **Document-aware chunking**: Respect document structure — headers, sections, code blocks, tables
- **Overlap**: Consecutive chunks share overlap tokens — prevents context loss at boundaries
- **Chunk metadata**: Source document, section, page number, position — enables citation and filtering

## Mental Models

- **Indexing strategy for search**: Like choosing how to index a database — wrong chunking = bad retrieval. The chunk is the atomic unit of information retrieval.
- **Modularization**: Like splitting code into functions — too big (monolithic) loses granularity, too small (micro-functions) loses context. Sweet spot depends on content type.
- **Information density**: Dense technical docs → smaller chunks (preserves precision); narrative content → larger chunks (preserves flow).

## Internal Mechanics

Fixed-size chunking:
1. Tokenize text using model tokenizer or approximate (4 chars ≈ 1 token)
2. Split at token boundaries, respecting configurable size
3. Apply overlap between chunks (typically 10-20% of chunk size)

Semantic chunking:
1. Embed sentences using lightweight embedding model
2. Compute cosine distance between consecutive sentence embeddings
3. When distance exceeds threshold → semantic boundary detected → split here
4. Merge small segments into chunks meeting minimum size

Document-aware chunking:
1. Parse document format (Markdown, HTML, PDF)
2. Identify structural boundaries (headings, tables, code blocks)
3. Respect boundaries — never split a table across chunks
4. Attach structural metadata to each chunk (heading ancestry, position)

## Patterns

- **Chunk size sweet spot**: 300-600 tokens for general RAG; 150-300 for precise Q&A; 600-1000 for summarization
- **Overlap pattern**: 10-20% overlap prevents context loss at chunk boundaries
- **Structural boundaries**: Keep tables, code blocks, and list items intact within single chunks
- **Metadata propagation**: Each chunk carries its source document, section hierarchy, and position for citation
- **Chunk type tagging**: Tag chunks as "narrative", "table", "code", "list" — enable type-specific retrieval strategies

## Architectural Decisions

- **Decision**: Application-level chunking vs. DB trigger → Application-level in PHP during ingestion. Reason: More control over strategy, easier to iterate and test.
- **Decision**: Single chunking strategy vs. multi-strategy → Start with one, evaluate, iterate. Reason: Chunking quality is domain-specific — what works for code docs fails for legal contracts.
- **Decision**: Fixed-size vs. semantic vs. recursive → Start with recursive (character → paragraph → sentence), evaluate recall@K, adjust.

## Tradeoffs

| Strategy | Precision | Recall | Complexity | Best For |
|----------|-----------|--------|------------|----------|
| Fixed-size | Low | Medium | Low | Prototyping, homogeneous content |
| Sentence | Medium | Medium | Low | Prose, articles, documentation |
| Semantic | High | High | High | Diverse content, mixed topics |
| Document-aware | High | High | Medium | Structured docs (Markdown, HTML, PDF) |
| Recursive | Medium | High | Medium | General purpose fallback |

## Performance Considerations

- Chunking happens during ingestion — not on the query path — so complexity is acceptable
- Semantic chunking requires embedding model calls during ingestion — significantly slower than rule-based
- Fixed-size: ~1M tokens/second throughput
- Semantic: ~100K tokens/second (depends on embedding model latency)
- Storage: more chunks = more rows, but pgvector handles millions easily

## Production Considerations

- Never change chunking strategy for a populated index — chunks from different strategies are semantically incompatible
- Version your chunking strategy — store strategy identifier per chunk for debugging
- Test chunk quality with representative queries before full ingestion
- Monitor chunk size distribution — unexpectedly large/small chunks indicate parsing issues
- Implement chunk-level caching — re-chunk only changed source documents
- Log chunk metrics: average size, overlap %, boundary violations (tables split, code broken)

## Common Mistakes

- Fixed-size chunking without overlap — context lost at boundaries, retrieval misses relevant content
- Chunking all content types identically — code, tables, and prose need different strategies
- Over-chunking (too small) — loses surrounding context, increases retrieval noise
- Under-chunking (too large) — retrieves irrelevant content within large chunk
- Splitting tables or code blocks across chunks — both halves are useless for retrieval
- Not capturing chunk metadata — can't cite sources or filter by document section

## Failure Modes

- **Boundary context loss**: Key information spans chunk boundary — use overlap to mitigate
- **Semantic chunk false positive**: Topic shift detection triggers incorrectly — merges unrelated content
- **Format parsing failure**: PDF extraction produces garbage → garbage chunks → garbage retrieval
- **Chunk size explosion**: Very long paragraphs or code blocks produce oversized chunks — set hard max size
- **Metadata misalignment**: Heading hierarchy out of sync after content edit — regenerate affected chunks

## Ecosystem Usage

- `moneo/laravel-rag` provides document parsing and chunking with multiple strategies
- Custom chunking is common — teams typically build domain-specific chunkers
- PDF parsing: `smalot/pdfparser`, `spatie/pdf-to-text`
- Markdown parsing: `league/commonmark` with custom AST walkers for structure-aware chunking

## Related Knowledge Units

- KU-021: RAG Pipeline with SimilaritySearch
- KU-023: Embedding Generation
- KU-025: Hybrid Search
- KU-027: SQLite-vec for Local RAG

## Research Notes

- Chunking is the #1 lever on retrieval quality — 2026 industry data shows 73% of RAG failures are retrieval-related
- 300-600 token chunks are the industry standard for general-purpose RAG
- Semantic chunking using embedding models (Cohere, VoyageAI) shows 15-25% improvement over fixed-size in benchmarks
- No chunking strategy works universally — domain-specific tuning is required
- `moneo/laravel-rag` provides driver-based chunking with pgvector and sqlite-vec support
