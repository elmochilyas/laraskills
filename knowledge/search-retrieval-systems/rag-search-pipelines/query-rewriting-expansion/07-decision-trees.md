# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** RAG Search Pipelines
**Knowledge Unit:** Query Rewriting & Expansion
**Generated:** 2026-06-03

---

# Decision Inventory

1. RAG Pipeline Architecture Selection
2. Chunking Strategy Selection
3. Embedding Model Selection for RAG

---

# Architecture-Level Decision Trees

## RAG Pipeline Architecture Selection

---

### Decision Context

When implementing Query Rewriting & Expansion, you must decide on the overall architecture of your Retrieval-Augmented Generation pipeline.

### Decision Criteria

* architectural
* performance

### Decision Tree

What is the primary retrieval source for your RAG pipeline?
|
Structured data (database) -> Use text-to-SQL or structured retrieval
    |
    Is real-time data access required?
    YES -> Query live database with generated SQL
    NO -> Index structured data into vector store for RAG
Unstructured data (documents, PDFs) -> Use chunking + vector embeddings
    |
    Are documents pre-chunked or need real-time processing?
    Pre-chunked -> Index embeddings directly
    Real-time -> Implement ingestion pipeline with chunking step
Hybrid (both) -> Implement multi-source retrieval with fusion

### Rationale

RAG pipeline architecture depends on data source type and latency requirements. Structured data can be queried directly or indexed for semantic retrieval. Unstructured data requires chunking and embedding.

### Recommended Default

**Default:** Chunk documents, generate embeddings, vector store, LLM generation.
**Reason:** Most common RAG pattern supporting a wide range of document types.

### Risks Of Wrong Choice

- No chunking: oversized context windows and poor retrieval quality
- Direct DB queries at high volume: performance impact on production database

### Related Rules

- Start with Spelling Correction Before Expansion
- Cache All Rewritten Queries
- Keep Original Query as Fallback

### Related Skills

- Configure and Implement Query Rewriting & Expansion

---

## Chunking Strategy Selection

---

### Decision Context

When implementing Query Rewriting & Expansion, you must decide how to split documents into chunks for embedding and retrieval.

### Decision Criteria

* accuracy
* performance

### Decision Tree

What type of content are you chunking?
|
Code/files -> Use language-aware chunking (preserve syntax/semantic units)
Prose/narrative -> Use sentence/chunk overlap chunking (256-512 tokens)
Technical docs -> Use section/chapter chunking (respect document structure)
|
What is the overlap strategy?
Overlap chunks -> Use 10-20% overlap to maintain context across boundaries
No overlap -> Simpler but may lose context at chunk boundaries
|
Is chunk size fixed or variable?
Fixed -> Simpler implementation, consistent embedding dimensions
Variable -> More accurate but complex retrieval logic

### Rationale

Chunking strategy directly impacts retrieval quality. Code benefits from language-aware chunking; prose benefits from sentence-based approaches with overlap. Respecting document structure improves retrieval relevance.

### Recommended Default

**Default:** Sentence-level chunking with 10-20% overlap, 256-512 token chunks.
**Reason:** Balances retrieval quality with implementation simplicity for most text content.

### Risks Of Wrong Choice

- Chunks too large: context dilution, poor retrieval precision
- Chunks too small: lost context, incomplete answers
- No overlap: broken context at chunk boundaries

### Related Rules

- Start with Spelling Correction Before Expansion
- Cache All Rewritten Queries
- Keep Original Query as Fallback

### Related Skills

- Configure and Implement Query Rewriting & Expansion

---

## Embedding Model Selection for RAG

---

### Decision Context

When implementing Query Rewriting & Expansion, you must decide which embedding model to use for converting chunks into vector representations.

### Decision Criteria

* accuracy
* cost
* latency

### Decision Tree

Is retrieval accuracy the primary concern?
|
YES -> Use higher-dimensional models (text-embedding-3-large, 3072d)
    |
    Can you afford the storage and latency for large embeddings?
    YES -> Large embedding model with full dimensions
    NO -> Large embedding model with dimensionality reduction (matryoshka)
NO -> Is cost a concern?
    YES -> Use smaller models (text-embedding-3-small, 512d) or local models
    NO -> Cloud API models are simpler to implement
|
Is the content multilingual?
YES -> Choose multilingual embedding model (Cohere multilingual, multilingual-e5)
NO -> Single-language model is sufficient

### Rationale

Larger embedding models generally provide better retrieval accuracy at higher storage and latency costs. Smaller models or dimensionality reduction can reduce costs while maintaining reasonable accuracy.

### Recommended Default

**Default:** OpenAI text-embedding-3-small (512d) for cost-effective balanced performance.
**Reason:** Good accuracy-to-cost ratio with straightforward API integration.

### Risks Of Wrong Choice

- Overly large embeddings: high storage costs and slow retrieval
- Underpowered embeddings: poor retrieval recall affecting answer quality

### Related Rules

- Start with Spelling Correction Before Expansion
- Cache All Rewritten Queries
- Keep Original Query as Fallback

### Related Skills

- Configure and Implement Query Rewriting & Expansion

