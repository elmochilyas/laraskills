---
id: KU-022
title: "Document Chunking Strategies"
subdomain: "rag-retrieval-augmented-generation"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/04-rag-retrieval-augmented-generation/document-chunking-strategies/04-standardized-knowledge.md"
---

# Document Chunking Strategies

## Overview

Chunking strategy is the single highest-leverage parameter in RAG quality. The same retrieval pipeline with different chunking can yield 20-40% accuracy differences. Strategies range from fixed-size character chunks to semantic-aware splitting that respects document structure. The Laravel ecosystem supports multiple chunking approaches via `moneo/laravel-rag` and custom implementations.

## Core Concepts

- **Fixed-size chunking**: Split by token count (e.g., 512 tokens) with overlap (10-20%)
- **Sentence chunking**: Split on sentence boundaries â€” preserves grammatical units
- **Semantic chunking**: Split on topic shifts using embedding similarity between sentences
- **Recursive chunking**: Hierarchical â€” split by paragraph first, then sentence, then fixed-size fallback
- **Document-aware chunking**: Respect document structure â€” headers, sections, code blocks, tables
- **Overlap**: Consecutive chunks share overlap tokens â€” prevents context loss at boundaries
- **Chunk metadata**: Source document, section, page number, position â€” enables citation and filtering

## When To Use

- Production applications requiring Document Chunking Strategies functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Chunk size sweet spot**: 300-600 tokens for general RAG; 150-300 for precise Q&A; 600-1000 for summarization
- **Overlap pattern**: 10-20% overlap prevents context loss at chunk boundaries
- **Structural boundaries**: Keep tables, code blocks, and list items intact within single chunks
- **Metadata propagation**: Each chunk carries its source document, section hierarchy, and position for citation
- **Chunk type tagging**: Tag chunks as "narrative", "table", "code", "list" â€” enable type-specific retrieval strategies

- **Indexing strategy for search**: Like choosing how to index a database â€” wrong chunking = bad retrieval. The chunk is the atomic unit of information retrieval.
- **Modularization**: Like splitting code into functions â€” too big (monolithic) loses granularity, too small (micro-functions) loses context. Sweet spot depends on content type.
- **Information density**: Dense technical docs â†’ smaller chunks (preserves precision); narrative content â†’ larger chunks (preserves flow).

## Architecture Guidelines

- **Decision**: Application-level chunking vs. DB trigger â†’ Application-level in PHP during ingestion. Reason: More control over strategy, easier to iterate and test.
- **Decision**: Single chunking strategy vs. multi-strategy â†’ Start with one, evaluate, iterate. Reason: Chunking quality is domain-specific â€” what works for code docs fails for legal contracts.
- **Decision**: Fixed-size vs. semantic vs. recursive â†’ Start with recursive (character â†’ paragraph â†’ sentence), evaluate recall@K, adjust.

## Performance Considerations

- Chunking happens during ingestion â€” not on the query path â€” so complexity is acceptable
- Semantic chunking requires embedding model calls during ingestion â€” significantly slower than rule-based
- Fixed-size: ~1M tokens/second throughput
- Semantic: ~100K tokens/second (depends on embedding model latency)
- Storage: more chunks = more rows, but pgvector handles millions easily

| Strategy | Precision | Recall | Complexity | Best For |
|----------|-----------|--------|------------|----------|
| Fixed-size | Low | Medium | Low | Prototyping, homogeneous content |
| Sentence | Medium | Medium | Low | Prose, articles, documentation |
| Semantic | High | High | High | Diverse content, mixed topics |
| Document-aware | High | High | Medium | Structured docs (Markdown, HTML, PDF) |
| Recursive | Medium | High | Medium | General purpose fallback |

## Security Considerations

- Never change chunking strategy for a populated index â€” chunks from different strategies are semantically incompatible
- Version your chunking strategy â€” store strategy identifier per chunk for debugging
- Test chunk quality with representative queries before full ingestion
- Monitor chunk size distribution â€” unexpectedly large/small chunks indicate parsing issues
- Implement chunk-level caching â€” re-chunk only changed source documents
- Log chunk metrics: average size, overlap %, boundary violations (tables split, code broken)

## Common Mistakes

- Fixed-size chunking without overlap â€” context lost at boundaries, retrieval misses relevant content
- Chunking all content types identically â€” code, tables, and prose need different strategies
- Over-chunking (too small) â€” loses surrounding context, increases retrieval noise
- Under-chunking (too large) â€” retrieves irrelevant content within large chunk
- Splitting tables or code blocks across chunks â€” both halves are useless for retrieval
- Not capturing chunk metadata â€” can't cite sources or filter by document section

## Anti-Patterns

- **Boundary context loss**: Key information spans chunk boundary â€” use overlap to mitigate
- **Semantic chunk false positive**: Topic shift detection triggers incorrectly â€” merges unrelated content
- **Format parsing failure**: PDF extraction produces garbage â†’ garbage chunks â†’ garbage retrieval
- **Chunk size explosion**: Very long paragraphs or code blocks produce oversized chunks â€” set hard max size
- **Metadata misalignment**: Heading hierarchy out of sync after content edit â€” regenerate affected chunks

## Examples

The following ecosystem packages provide reference implementations:

- `moneo/laravel-rag` provides document parsing and chunking with multiple strategies
- Custom chunking is common â€” teams typically build domain-specific chunkers
- PDF parsing: `smalot/pdfparser`, `spatie/pdf-to-text`
- Markdown parsing: `league/commonmark` with custom AST walkers for structure-aware chunking

## Related Topics

- KU-021: RAG Pipeline with SimilaritySearch
- KU-023: Embedding Generation
- KU-025: Hybrid Search
- KU-027: SQLite-vec for Local RAG

## AI Agent Notes

- When asked about Document Chunking Strategies, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

