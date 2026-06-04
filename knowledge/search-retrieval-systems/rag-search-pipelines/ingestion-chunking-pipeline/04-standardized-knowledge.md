| Metadata | |
|---|---|
| Knowledge Unit ID | ku-02 |
| Subdomain | rag-search-pipelines |
| Topic | Ingestion & Chunking Pipeline |
| Source | LangChain / LlamaIndex / Industry |
| Maturity | New |

## Overview

The ingestion pipeline converts raw documents into searchable chunks with embeddings. Key stages: document loading → text extraction → chunking → metadata extraction → embedding generation → vector store insertion. Chunking strategy (size, overlap, method) is one of the most impactful RAG parameters — more important than embedding model choice in many cases.

## Core Concepts

- **Document Loading**: Parse PDF, HTML, database records, API responses
- **Text Extraction**: Remove formatting, extract clean text from structured documents
- **Chunking**: Split text into segments for embedding and retrieval
- **Metadata Extraction**: Preserve source, date, author, section, page number
- **Embedding Generation**: Convert each chunk to a vector
- **Vector Store Insertion**: Store chunk text + embedding + metadata

## When To Use

- Building any RAG pipeline that indexes documents
- Processing diverse document types (PDFs, web pages, database records)
- Multi-topic documents where topic-aware splitting matters
- Applications needing source attribution in generated answers

## When NOT To Use

- No documents to index (purely generative AI)
- Single short documents per entity (chunking may not be needed)
- Extremely latency-sensitive (chunking adds preprocessing time)

## Best Practices

1. **Use recursive character splitting**: Best balance of quality and simplicity.
2. **Include 10-20% chunk overlap**: Prevents information loss at boundaries.
3. **Preserve metadata with each chunk**: Source, section, page for citation.
4. **Test chunk sizes**: 256-1024 tokens; benchmark retrieval quality for each.
5. **Consider hierarchical chunking**: Index small chunks but retrieve parent context.
6. **Use token-aware splitting**: Count tokens, not characters, for LLM context compatibility.

## Architecture Guidelines

- Queue-based processing: Document upload → queue job → process chunks
- Batch embedding: Group chunks for efficient API calls
- Metadata propagation: Each chunk inherits + enhances source document metadata
- Re-processing: When chunking strategy changes, re-index all documents
- Pipeline monitoring: Track documents processed, chunks created, errors

## Performance Considerations

- Smaller chunks (~256 tokens): More specific retrieval, less context per chunk
- Larger chunks (~1024 tokens): More context per chunk, fewer retrievable chunks
- Overlap (10-20%): Reduces boundary information loss, increases index size
- More chunks = more vectors = larger index and slower search

## Security Considerations

- Document access control: Preserve permissions per chunk
- Sensitive content detection: Avoid indexing confidential information
- Metadata injection: Validate extracted metadata
- Chunk content may expose snippets of sensitive documents

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Fixed-size chunking for structured docs | Simple implementation | Breaks code/markdown boundaries | Use recursive splitting |
| No chunk overlap | Avoiding redundancy | Content loss at boundaries | Add 10-20% overlap |
| Character counting instead of tokens | Simpler implementation | Inconsistent context sizing | Use tokenizer (tiktoken) |
| No metadata preservation | Overlooking | Can't cite sources | Always preserve doc metadata |

## Anti-Patterns

- **Ignoring document structure**: Different document types need different chunking
- **One-size-fits-all chunk size**: Test and tune per corpus
- **Re-embedding unchanged documents**: Cache by document hash
- **Not handling document updates**: Version tracking for re-ingestion

## Examples

`php
class DocumentChunker
{
    public function chunk(string , array , int  = 500, int  = 50): array
    {
         = [];
         = preg_split('/(?<=[.?!])\s+/', );
         = '';
        
        foreach ( as ) {
            if (str_word_count( . ) > ) {
                [] = ['content' => , 'metadata' => ];
                 = substr(, -) . ;
            } else {
                 .=  . ' ';
            }
        }
        if (trim()) {
            [] = ['content' => trim(), 'metadata' => ];
        }
        return ;
    }
}
`

## Related Topics

- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K069 (RAG pipeline architecture)

## AI Agent Notes

- Chunking is one of the most impactful RAG parameters
- Recursive character splitting is the most widely used approach
- Test chunk configurations against your specific documents and queries
- For agents: implement recursive splitting first, only add complexity if needed

## Verification

- [ ] Document loader implemented for source formats
- [ ] Chunking strategy chosen and tested
- [ ] Chunk overlap configured (10-20%)
- [ ] Metadata preserved per chunk
- [ ] Token-aware counting implemented
- [ ] Batch embedding pipeline working
- [ ] Re-ingestion on strategy change handled
