# Decomposition: Document Chunking Strategies

## Topic Overview

Document chunking is the process of splitting documents into smaller segments for embedding and retrieval. Chunking strategy is one of the most impactful decisions in RAG system design â€” it directly determines retrieval quality, context relevance, and the amount of information the LLM receives. Poor chunking leads to missed or irrelevant retrieval, while optimal chunking ensures each chunk is semantically coherent and contains enough context for the LLM to answer correctly.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-02/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Document Chunking Strategies
- **Purpose:** Document chunking is the process of splitting documents into smaller segments for embedding and retrieval. Chunking strategy is one of the most impactful decisions in RAG system design â€” it directly determines retrieval quality, context relevance, and the amount of information the LLM receives. Poor chunking leads to missed or irrelevant retrieval, while optimal chunking ensures each chunk is semantically coherent and contains enough context for the LLM to answer correctly.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-03, ku-05, ku-02, ku-06

## Dependency Graph
**Depends on:**
- ku-01
- ku-03
- ku-05
- ku-02
- ku-06

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Chunk Size:** The length of each chunk in tokens or characters. Common range: 128-1024 tokens.
- **Chunk Overlap:** The number of tokens shared between consecutive chunks. Prevents information loss at boundaries.
- **Semantic Chunking:** Splitting at natural semantic boundaries (paragraphs, sections, sentences) rather than fixed token counts.
- **Hierarchical Chunking:** Creating multiple levels of chunks (sections â†’ paragraphs â†’ sentences) for multi-granularity retrieval.
- **Sliding Window Chunking:** A fixed-size window that slides across the document with overlap. Simple but may split mid-sentence.
- **Document Structure-Aware Chunking:** Respecting document structure (headings, lists, code blocks, tables) for semantically meaningful chunks.
- **Recursive Chunking:** Applying progressively smaller separators until the chunk fits within the size limit.
- **Metadata Propagation:** Carrying document-level metadata (title, source, date) to each chunk.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-05 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs

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

