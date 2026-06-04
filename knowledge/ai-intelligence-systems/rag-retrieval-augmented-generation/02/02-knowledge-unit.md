# Knowledge Unit: Document Chunking Strategies

## Metadata

- **ID:** ku-02
- **Subdomain:** Retrieval-Augmented Generation
- **Slug:** document-chunking-strategies
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Document chunking is the process of splitting documents into smaller segments for embedding and retrieval. Chunking strategy is one of the most impactful decisions in RAG system design â€” it directly determines retrieval quality, context relevance, and the amount of information the LLM receives. Poor chunking leads to missed or irrelevant retrieval, while optimal chunking ensures each chunk is semantically coherent and contains enough context for the LLM to answer correctly.

## Core Concepts

- **Chunk Size:** The length of each chunk in tokens or characters. Common range: 128-1024 tokens.
- **Chunk Overlap:** The number of tokens shared between consecutive chunks. Prevents information loss at boundaries.
- **Semantic Chunking:** Splitting at natural semantic boundaries (paragraphs, sections, sentences) rather than fixed token counts.
- **Hierarchical Chunking:** Creating multiple levels of chunks (sections â†’ paragraphs â†’ sentences) for multi-granularity retrieval.
- **Sliding Window Chunking:** A fixed-size window that slides across the document with overlap. Simple but may split mid-sentence.
- **Document Structure-Aware Chunking:** Respecting document structure (headings, lists, code blocks, tables) for semantically meaningful chunks.
- **Recursive Chunking:** Applying progressively smaller separators until the chunk fits within the size limit.
- **Metadata Propagation:** Carrying document-level metadata (title, source, date) to each chunk.

## Mental Models

- **Chunk Size:** The length of each chunk in tokens or characters. Common range: 128-1024 tokens.
- **Chunk Overlap:** The number of tokens shared between consecutive chunks. Prevents information loss at boundaries.
- **Semantic Chunking:** Splitting at natural semantic boundaries (paragraphs, sections, sentences) rather than fixed token counts.


## Internal Mechanics

The internal mechanics of Document Chunking Strategies follow established patterns within the Retrieval-Augmented Generation domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Start with 256-512 token chunks** with 10-20% overlap. This is the sweet spot for most use cases.
- **Use semantic chunking** (paragraph/sentence boundaries) over fixed-size chunking. Semantic chunks are more coherent for the LLM.
- **Respect document structure.** Headers, sections, and lists define natural boundaries. Don't split mid-heading.
- **Overlap 10-20%** of the chunk size to avoid losing context at boundaries.
- **Adapt chunk size to content type.** Code snippets need different chunking than prose documents.
- **Test multiple chunking strategies** with your retrieval quality metrics before choosing one.

## Patterns

- **Start with 256-512 token chunks** with 10-20% overlap. This is the sweet spot for most use cases.
- **Use semantic chunking** (paragraph/sentence boundaries) over fixed-size chunking. Semantic chunks are more coherent for the LLM.
- **Respect document structure.** Headers, sections, and lists define natural boundaries. Don't split mid-heading.
- **Overlap 10-20%** of the chunk size to avoid losing context at boundaries.
- **Adapt chunk size to content type.** Code snippets need different chunking than prose documents.
- **Test multiple chunking strategies** with your retrieval quality metrics before choosing one.

## Architectural Decisions

- Implement chunking as a **configurable pipeline** with pluggable chunking strategies.
- Use a **chunking registry** that selects the strategy based on document type (MIME type or file extension).
- Store chunk metadata (position, parent document, neighbor chunks) for context assembly.
- For hierarchical chunking, store parent-child relationships in the vector database for multi-level retrieval.
- Implement a **chunk preview** tool for developers to visualize how documents are split before indexing.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Chunking is part of the **indexing pipeline** (async/offline), not the query path. Performance is less critical.
- Batch chunking: process multiple documents concurrently in queued jobs.
- Token counting for chunking: use the same tokenizer as the embedding model for accurate size control.
- Chunk size affects retrieval speed: more chunks = larger vector index = slower search.
- Overlap increases storage: 20% overlap = 20% more chunks = 20% more storage and search time.

## Production Considerations

- **Chunk boundary security:** Ensure chunks don't split in ways that hide or expose sensitive information (e.g., splitting mid-phone-number).
- **Document redaction:** Redact sensitive content before chunking, not after â€” chunks may recombine content.
- **Metadata integrity:** Ensure chunk metadata (source, position) is tamper-proof â€” chunks could be reordered to change meaning.
- **Access control propagation:** The chunk must carry the parent document's access control labels.
- **Chunk injection:** If users can upload documents, ensure chunking doesn't create opportunities for prompt injection.

## Common Mistakes

- Using fixed-size chunking that splits mid-sentence or mid-thought â€” creates incoherent chunks.
- No overlap â€” a question that straddles two chunks misses relevant context.
- Chunks too small (under 100 tokens) â€” insufficient context for the LLM to understand the topic.
- Chunks too large (over 2000 tokens) â€” too much irrelevant information dilutes retrieval relevance.
- Same chunk size for all document types â€” code, prose, tables, and lists need different strategies.

## Failure Modes

- **Single-Strategy-Fits-All:** Using the same chunking strategy for markdown docs, PDFs, code repos, and transcripts.
- **Chunk-and-Forget:** Chunking documents once and never re-evaluating the strategy as the document corpus grows.
- **No Chunk Context:** Retrieving a chunk without neighboring chunk context â€” the LLM misses surrounding context.
- **Over-Engineering:** Implementing complex hierarchical chunking before measuring that simple chunking is insufficient.
- **Ignoring Document Structure:** Splitting a document mid-table or mid-code-block â€” creates unparseable content.

## Ecosystem Usage

### Chunking Strategy Interface
```php
interface ChunkingStrategy {
    /** @return DocumentChunk[] */
    public function chunk(string $document, array $metadata): array;
}

class SemanticChunkingStrategy implements ChunkingStrategy {
    public function __construct(
        private int $maxTokens = 512,
        private int $overlapTokens = 64,
    ) {}

    public function chunk(string $document, array $metadata): array {
        // Split by paragraphs first, then merge until max size
        $paragraphs = preg_split('/\n\s*\n/', $document);
        $chunks = [];
        $current = '';
        $position = 0;

        foreach ($paragraphs as $para) {
            $candidate = $current ? $current . "\n\n" . $para : $para;
            if ($this->countTokens($candidate) > $this->maxTokens && $current) {
                $chunks[] = new DocumentChunk(
                    content: $current,
                    metadata: $metadata + ['position' => $position++],
                );
                $current = $this->getOverlap($current, $para);
            } else {
                $current = $candidate;
            }
        }

        if ($current) {
            $chunks[] = new DocumentChunk(
                content: $current,
                metadata: $metadata + ['position' => $position],
            );
        }

        return $chunks;
    }
}
```

### Document Chunk
```php
class DocumentChunk {
    public function __construct(
        public readonly string $content,
        public readonly array $metadata = [],
        public readonly ?string $chunkId = null,
    ) {
        // metadata: source, title, position, parent_doc_id, neighbor_chunk_ids
    }
}
```

## Related Knowledge Units

- ku-01 (RAG Architecture Fundamentals): Chunking is part of the indexing pipeline.
- ku-03 (Embedding Generation): Embedding chunked documents.
- ku-05 (Retrieval Quality): Measuring chunking impact on retrieval.
- vector-database-integration/ku-02: Storing chunks with metadata.
- retrieval-augmented-generation/ku-06: Multi-modal document chunking.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

