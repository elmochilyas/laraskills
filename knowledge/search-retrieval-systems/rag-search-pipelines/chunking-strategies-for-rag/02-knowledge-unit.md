# Knowledge Unit: Chunking Strategies for RAG

## Metadata

- **ID:** K068
- **Subdomain:** RAG Search Pipelines
- **Source:** General (LangChain, LlamaIndex)
- **Maturity:** New
- **Laravel Relevance:** Document splitting for retrieval

## Executive Summary

Chunking divides documents into smaller segments before embedding and indexing for RAG. Chunk size, overlap, and strategy directly impact retrieval quality. Common strategies include fixed-size chunking, recursive character splitting, semantic chunking (by topic boundaries), and agentic chunking (using an LLM to identify boundaries). The optimal strategy depends on document type, retrieval use case, and LLM context window.

## Core Concepts

- **Chunk Size**: Number of tokens per chunk. Typical range: 256-1024 tokens.
- **Chunk Overlap**: Tokens shared between consecutive chunks to avoid splitting meaningful content at boundaries.
- **Fixed-Size Chunking**: Split every N tokens. Simple but may break sentences/paragraphs.
- **Recursive Splitting**: Split on paragraph boundaries first, then sentences, then characters (fallback).
- **Semantic Chunking**: Split at topic boundaries using embedding similarity or NLP.
- **Token-Aware Splitting**: Count tokens (not characters) for compatibility with LLM context limits.

## Internal Mechanics

A chunker processes raw text into segments. Each segment becomes a separate searchable document with its own embedding. At retrieval time, the query embedding searches across all chunks from all documents. Retrieved chunks are passed to the LLM as context. The LLM sees the chunk text, not the full document. If a chunk is too small, context is insufficient. If too large, the LLM's context window fills quickly.

## Patterns

- **RecursiveCharacterTextSplitter**: LangChain's default. Tries to split on paragraph breaks (`\n\n`), then newlines (`\n`), then periods, then characters.
- **Token-based splitting**: Use a tokenizer (tiktoken for OpenAI) to count tokens accurately.
- **Semantic chunking**: Split where embedding similarity between adjacent sentences drops below a threshold.
- **Document-aware chunking**: Preserve document metadata (title, section heading) with each chunk for context.

## Architectural Decisions

Chunking is a design-time decision that affects the entire RAG pipeline. Changing chunk strategy requires re-embedding and re-indexing all documents.

## Tradeoffs

| Strategy | Retrieval Quality | Implementation Complexity | Compute Cost |
|---|---|---|---|
| Fixed-size | Low (may break content) | Very low | Low |
| Recursive character | Good | Low | Low |
| Semantic | Very good | Medium (embedding per sentence) | Medium |
| Agentic (LLM) | Best (context-aware) | High (LLM calls) | High |

## Performance Considerations

- Smaller chunks (~256 tokens) retrieve more specific context but may miss broader context.
- Larger chunks (~1024 tokens) provide more context per retrieval but reduce the number of retrievable chunks.
- Chunk overlap (10-20%) reduces information loss at chunk boundaries.
- Embedding more chunks = more vectors = larger index and slower search.

## Production Considerations

- **Test chunk configurations** against your specific documents and queries.
- **Include metadata in chunks**: Source document title, section, page number for citation.
- **Handle document structure**: Preserve headings, lists, and tables in chunk text.
- **Consider hierarchical chunking**: Index small chunks but retrieve parent section for context.
- **Monitor chunk utilization**: If the LLM consistently only uses the first few chunks, chunks may be too large.

## Common Mistakes

- Using fixed-size chunking on structured documents (code, markdown) — breaks important boundaries.
- Chunking without overlap — losing content at boundaries.
- Chunking by character count instead of tokens — different languages have different character/token ratios.
- Not preserving document structure in chunk text — LLM can't understand context without section headings.

## Failure Modes

- **Context fragmentation**: A single answer requires information split across multiple chunks — incomplete context.
- **Irrelevant chunk retrieval**: Poor chunk boundaries cause retrieval of contextually irrelevant content.
- **Context window overflow**: Too many retrieved chunks exceed the LLM's token limit.

## Ecosystem Usage

Universal in RAG pipeline implementations. Chunking is widely recognized as one of the most impactful RAG parameters — more important than embedding model choice in many cases.

## Related Knowledge Units

- K067 (Embedding generation strategies)
- K069 (RAG pipeline architecture)

## Research Notes

Sources: LangChain docs, LlamaIndex docs, Anthropic research on chunking. The recursive character splitter is the most widely used approach. Semantic chunking (using embedding similarity to detect topic shifts) improves retrieval quality for long, multi-topic documents. There is no one-size-fits-all chunk size — it depends on document type and retrieval use case.


## Mental Models

- **Library Analogy**: Think of the RAG pipeline as a library. Documents are books, the embedding model creates the card catalog, vector search finds the right shelves, and the LLM is the librarian who reads the relevant books to answer your question.
- **Assembly Line**: Each stage of the pipeline (chunk → embed → store → retrieve → generate) is a station on an assembly line. Optimizing one station without considering the others creates bottlenecks.
- **Funnel Model**: The pipeline narrows from millions of documents to hundreds of chunks to tens of context windows to a single answer. Each stage must preserve the signal while discarding noise.

