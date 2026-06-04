# Decomposition: chunking strategies for rag

## Topic Overview

Chunking divides documents into smaller segments before embedding and indexing for RAG. Chunk size, overlap, and strategy directly impact retrieval quality. Common strategies include fixed-size chunking, recursive character splitting, semantic chunking (by topic boundaries), and agentic chunking (using an LLM to identify boundaries). The optimal strategy depends on document type, retrieval use case, and LLM context window.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
chunking-strategies-for-rag/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### chunking strategies for rag
- **Purpose:** Chunking divides documents into smaller segments before embedding and indexing for RAG. Chunk size, overlap, and strategy directly impact retrieval quality. Common strategies include fixed-size chunking, recursive character splitting, semantic chunking (by topic boundaries), and agentic chunking (using an LLM to identify boundaries). The optimal strategy depends on document type, retrieval use case, and LLM context window.
- **Difficulty:** Foundation
- **Dependencies:** K067 (Embedding generation strategies), and K069 (RAG pipeline architecture)

## Dependency Graph
**Depends on:** K067 (Embedding generation strategies), and K069 (RAG pipeline architecture)
**Depended on by:** Knowledge units that leverage or extend chunking strategies for rag patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for chunking strategies for rag.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization