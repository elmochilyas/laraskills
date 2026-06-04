# Decomposition: meilisearch rag

## Topic Overview

Meilisearch RAG (Retrieval-Augmented Generation) enables conversational search by combining Meilisearch's hybrid search (keyword + vector) with an LLM for answer generation. When a user asks a question, Meilisearch retrieves relevant documents, and an LLM generates a grounded answer using those documents as context. This is available as a Meilisearch Cloud feature or can be built custom using the Meilisearch API.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
meilisearch-rag/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### meilisearch rag
- **Purpose:** Meilisearch RAG (Retrieval-Augmented Generation) enables conversational search by combining Meilisearch's hybrid search (keyword + vector) with an LLM for answer generation. When a user asks a question, Meilisearch retrieves relevant documents, and an LLM generates a grounded answer using those documents as context. This is available as a Meilisearch Cloud feature or can be built custom using the Meilisearch API.
- **Difficulty:** Foundation
- **Dependencies:** K028 (Meilisearch hybrid search), K067 (Embedding generation strategies), and K068 (Chunking strategies for RAG)

## Dependency Graph
**Depends on:** K028 (Meilisearch hybrid search), K067 (Embedding generation strategies), and K068 (Chunking strategies for RAG)
**Depended on by:** Knowledge units that leverage or extend meilisearch rag patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for meilisearch rag.
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