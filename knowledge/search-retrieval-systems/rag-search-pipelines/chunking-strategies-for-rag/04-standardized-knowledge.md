| Metadata | |
|---|---|
| KU ID | K068 |
| Subdomain | rag-search-pipelines |
| Topic | Chunking Strategies for RAG |
| Source | General (LangChain, LlamaIndex) |
| Maturity | New |

## Overview

Chunking divides documents into smaller segments before embedding and indexing for RAG. Chunk size, overlap, and strategy directly impact retrieval quality. Common strategies include fixed-size splitting, recursive character splitting, semantic chunking (by topic boundaries), and agentic chunking (LLM-identified boundaries).

## Core Concepts

- **Chunk Size**: Tokens per chunk (typical range: 256-1024)
- **Chunk Overlap**: Shared tokens between consecutive chunks (10-20%) to avoid boundary splitting
- **Fixed-Size**: Split every N tokens — simple but may break sentences
- **Recursive Splitting**: Paragraph → sentence → character (fallback)
- **Semantic Chunking**: Split at topic boundaries using embedding similarity or NLP
- **Token-Aware**: Count tokens (not characters) for LLM compatibility

## When To Use

- Any RAG pipeline implementation
- Document QA, product Q&A, enterprise knowledge search
- Multi-topic documents needing section-level retrieval

## When NOT To Use

- Very short documents (<256 tokens) — chunking is unnecessary
- When LLM context window can fit the entire document
- For keyword-only search (chunking is RAG-specific)

## Best Practices

1. **Test configurations** against your specific documents and queries
2. **Include metadata in chunks** — source title, section, page number for citation
3. **Preserve document structure** — headings, lists, tables in chunk text
4. **Consider hierarchical chunking** — index small chunks, retrieve parent section for context
5. **Monitor chunk utilization** — if LLM only uses first chunks, they may be too large

## Architecture Guidelines

- Chunking is a design-time decision affecting the entire pipeline — changes require re-embedding
- Use token-aware splitting for compatibility with LLM context limits
- Implement overlap to reduce information loss at boundaries
- Choose strategy based on document type: structured (recursive), unstructured (semantic)

## Performance Considerations

- Smaller chunks (~256 tokens) retrieve more specific context but may miss broader context
- Larger chunks (~1024 tokens) provide more context per retrieval but reduce retrievable chunks
- Overlap (10-20%) reduces boundary information loss
- More chunks = more vectors = larger index and slower search

## Security Considerations

- Chunks inherit document-level access controls
- Ensure chunk metadata doesn't leak sensitive document information
- Implement chunk-level access gating for multi-tenant systems

## Common Mistakes

- Using fixed-size chunking on structured documents — breaks important boundaries
- Chunking without overlap — losing content at boundaries
- Using character count instead of tokens — different languages have different ratios
- Not preserving document structure — LLM lacks context without section headings

## Anti-Patterns

- **One-chunk-fits-all**: Using the same chunk size/strategy for all document types
- **No overlap**: Strict boundaries causing context fragmentation
- **Over-chunking**: Too-small chunks missing broader context for answers
- **Ignoring document structure**: Stripping headings and metadata

## Examples

```php
// Recursive character splitting (LangChain-style)
$chunks = $splitter->splitText($document, [
    'chunk_size' => 512,
    'chunk_overlap' => 50,
    'separators' => ["\n\n", "\n", ".", " "],
]);

// Include metadata with each chunk
$chunks = array_map(fn($chunk) => [
    'text' => $chunk,
    'metadata' => ['source' => $document->title, 'section' => $heading],
], $chunks);
```

## Related Topics

- K067 (Embedding generation strategies)
- K069 (RAG pipeline architecture)
- K029 (Meilisearch RAG)

## AI Agent Notes

- Chunking is one of the most impactful RAG parameters — more important than embedding model choice
- Recursive character splitting is the most widely used approach
- For agents: start with 512 token chunks with 10% overlap; adjust based on retrieval quality metrics
