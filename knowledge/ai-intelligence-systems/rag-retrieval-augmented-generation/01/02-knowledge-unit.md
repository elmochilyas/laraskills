# Knowledge Unit: RAG Architecture Fundamentals

## Metadata

- **ID:** ku-01
- **Subdomain:** Retrieval-Augmented Generation
- **Slug:** rag-architecture-fundamentals
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Retrieval-Augmented Generation (RAG) is a pattern that enhances LLM outputs by retrieving relevant information from a knowledge base and injecting it into the LLM's context. Instead of relying solely on the model's training data (which may be outdated or incomplete), RAG grounds the LLM's response in retrieved documents, improving accuracy, recency, and trustworthiness. In the Laravel AI ecosystem, RAG is implemented as a pipeline: embed query â†’ search vector/index â†’ retrieve documents â†’ inject context â†’ generate response.

## Core Concepts

- **Indexing Pipeline:** The process of ingesting documents, chunking them, generating embeddings, and storing them in a vector database.
- **Query Pipeline:** The runtime process of embedding a user query, searching the vector index, retrieving top-K documents, and formatting them as context.
- **Embedding Model:** A model that converts text into dense vector representations. Same embedding model must be used for indexing and querying.
- **Chunking:** Splitting documents into smaller segments for embedding and retrieval. Chunk size and overlap strategy significantly impact retrieval quality.
- **Top-K Retrieval:** The number of documents retrieved per query (typically 3-10). Higher K increases recall but consumes more context tokens.
- **Context Window Budget:** Allocating a portion of the LLM's context window to retrieved documents. Critical for managing token costs.
- **Grounding:** The LLM uses retrieved documents as evidence, reducing hallucination and improving factual accuracy.
- **Retrieval Quality:** Measured by precision (are retrieved documents relevant?) and recall (are all relevant documents retrieved?).

## Mental Models

- **Indexing Pipeline:** The process of ingesting documents, chunking them, generating embeddings, and storing them in a vector database.
- **Query Pipeline:** The runtime process of embedding a user query, searching the vector index, retrieving top-K documents, and formatting them as context.
- **Embedding Model:** A model that converts text into dense vector representations. Same embedding model must be used for indexing and querying.


## Internal Mechanics

The internal mechanics of RAG Architecture Fundamentals follow established patterns within the Retrieval-Augmented Generation domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Optimize for retrieval quality first.** Perfect generation is useless if the wrong documents are retrieved.
- **Chunk thoughtfully.** Not too small (loses context) and not too large (dilutes relevance). 256-512 tokens per chunk is a common starting point.
- **Use the same embedding model** for indexing and querying. Mixing models produces incompatible vector spaces.
- **Include metadata.** Store source URL, title, date, and other metadata with each chunk for citation and filtering.
- **Implement hybrid search.** Combine vector similarity with keyword (BM25) search for better recall, especially for exact matches and proper nouns.
- **Separate indexing and query pipelines.** Indexing is async (queue job); query must be fast (synchronous).

## Patterns

- **Optimize for retrieval quality first.** Perfect generation is useless if the wrong documents are retrieved.
- **Chunk thoughtfully.** Not too small (loses context) and not too large (dilutes relevance). 256-512 tokens per chunk is a common starting point.
- **Use the same embedding model** for indexing and querying. Mixing models produces incompatible vector spaces.
- **Include metadata.** Store source URL, title, date, and other metadata with each chunk for citation and filtering.
- **Implement hybrid search.** Combine vector similarity with keyword (BM25) search for better recall, especially for exact matches and proper nouns.
- **Separate indexing and query pipelines.** Indexing is async (queue job); query must be fast (synchronous).

## Architectural Decisions

- RAG pipeline should be implemented as a **composable service** with interchangeable components (embedder, retriever, context formatter).
- Use a **vector database** (pgvector, Qdrant, Milvus) for similarity search. SQL `LIKE` is not a substitute for vector search.
- The retrieval step should be **fast** (<200ms) and use approximate nearest neighbor (ANN) indexing.
- Context injection should be a **middleware step** before the LLM call, not embedded in the prompt template.
- For Laravel, implement the indexing pipeline as a **queued job** and the query pipeline as a **synchronous service** injected into controllers.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Embedding latency: 50-200ms per query (depends on embedding model and hardware).
- Vector search: 10-100ms with ANN indexing (vs. 100-1000ms with brute force).
- Total RAG latency = embedding + search + LLM inference. Typically 1-3 seconds total.
- Indexing throughput: optimize chunking and embedding for batch processing (parallel jobs).
- Cache embeddings: cache query embeddings for repeated queries (TTL based on query freshness).

## Production Considerations

- **Document-level access control:** Retrieved documents may contain sensitive information. Filter results based on user permissions.
- **Data leakage:** Ensure the retrieval system doesn't expose documents the user shouldn't see.
- **Injection via documents:** Retrieved documents may contain prompt injection payloads. Sanitize before injecting into context.
- **Index poisoning:** If users can add documents to the knowledge base, they may inject malicious content. Validate all ingested documents.
- **Citation integrity:** Ensure retrieved documents are authentic and haven't been tampered with (content addressed storage).

## Common Mistakes

- Using the wrong chunk size â€” chunks that are too small lose context; too large include irrelevant information.
- Not tracking which documents were retrieved for which queries â€” impossible to debug retrieval quality.
- Retrieving too many documents â€” consuming the entire context window with low-value content.
- Ignoring metadata filtering â€” every query searches the entire corpus instead of a relevant subset.
- Not handling the case where no relevant documents are found â€” the model should say "I don't know" instead of hallucinating.

## Failure Modes

- **Garbage In, Garbage Out:** Poor quality documents in the knowledge base produce poor quality retrieval. Curate your document corpus.
- **One-Size-Fits-All Retrieval:** Using the same chunk size and top-K for all document types. Different content types need different strategies.
- **No Relevance Scoring:** Presenting all retrieved documents as equally relevant. Surface the similarity score and let the model weigh them.
- **Retrieval Without Caching:** Embedding the same query repeatedly. Implement semantic caching for repeated or similar queries.
- **RAG as Silver Bullet:** RAG doesn't solve all hallucination problems. It reduces hallucination but doesn't eliminate it.

## Ecosystem Usage

### RAG Service
```php
class RAGService {
    public function __construct(
        private EmbeddingService $embeddings,
        private VectorStore $vectorStore,
        private ContextFormatter $formatter,
    ) {}

    public function query(string $query, int $topK = 5): RAGContext {
        $queryVector = $this->embeddings->embed($query);
        $results = $this->vectorStore->search($queryVector, $topK);
        $context = $this->formatter->format($results);
        return new RAGContext(
            documents: $results,
            context: $context,
            totalTokens: $this->countTokens($context),
        );
    }
}
```

### RAG Pipeline Config
```php
$ragConfig = [
    'embedding' => [
        'model' => 'text-embedding-3-small',
        'dimensions' => 1536,
    ],
    'chunking' => [
        'size' => 512,       // tokens
        'overlap' => 64,     // tokens
    ],
    'retrieval' => [
        'top_k' => 5,
        'min_score' => 0.7,  // relevance threshold
        'hybrid_search' => true,
    ],
    'context' => [
        'max_tokens' => 2000, // max tokens for retrieved context
        'include_metadata' => true,
    ],
];
```

## Related Knowledge Units

- ku-02 (Document Chunking Strategies): Optimizing chunk size and overlap.
- ku-03 (Embedding Generation): Embedding models and techniques.
- ku-04 (Context Injection & Prompt Design): Formatting retrieved context for the LLM.
- ku-05 (Retrieval Quality): Measuring and improving retrieval accuracy.
- vector-database-integration/ku-01: Vector DB fundamentals for RAG.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

