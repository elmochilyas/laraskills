# Decomposition: RAG Architecture Fundamentals

## Topic Overview

Retrieval-Augmented Generation (RAG) is a pattern that enhances LLM outputs by retrieving relevant information from a knowledge base and injecting it into the LLM's context. Instead of relying solely on the model's training data (which may be outdated or incomplete), RAG grounds the LLM's response in retrieved documents, improving accuracy, recency, and trustworthiness. In the Laravel AI ecosystem, RAG is implemented as a pipeline: embed query â†’ search vector/index â†’ retrieve documents â†’ inject context â†’ generate response.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-01/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### RAG Architecture Fundamentals
- **Purpose:** Retrieval-Augmented Generation (RAG) is a pattern that enhances LLM outputs by retrieving relevant information from a knowledge base and injecting it into the LLM's context. Instead of relying solely on the model's training data (which may be outdated or incomplete), RAG grounds the LLM's response in retrieved documents, improving accuracy, recency, and trustworthiness. In the Laravel AI ecosystem, RAG is implemented as a pipeline: embed query â†’ search vector/index â†’ retrieve documents â†’ inject context â†’ generate response.
- **Difficulty:** Intermediate
- **Dependencies:** ku-02, ku-03, ku-04, ku-05, ku-01

## Dependency Graph
**Depends on:**
- ku-02
- ku-03
- ku-04
- ku-05
- ku-01

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Indexing Pipeline:** The process of ingesting documents, chunking them, generating embeddings, and storing them in a vector database.
- **Query Pipeline:** The runtime process of embedding a user query, searching the vector index, retrieving top-K documents, and formatting them as context.
- **Embedding Model:** A model that converts text into dense vector representations. Same embedding model must be used for indexing and querying.
- **Chunking:** Splitting documents into smaller segments for embedding and retrieval. Chunk size and overlap strategy significantly impact retrieval quality.
- **Top-K Retrieval:** The number of documents retrieved per query (typically 3-10). Higher K increases recall but consumes more context tokens.
- **Context Window Budget:** Allocating a portion of the LLM's context window to retrieved documents. Critical for managing token costs.
- **Grounding:** The LLM uses retrieved documents as evidence, reducing hallucination and improving factual accuracy.
- **Retrieval Quality:** Measured by precision (are retrieved documents relevant?) and recall (are all relevant documents retrieved?).

**Out of scope:**
- ku-02 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-01 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

