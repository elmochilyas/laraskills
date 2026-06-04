# Decomposition: embedding generation strategies

## Topic Overview

Embedding generation converts text into vector representations for semantic search. Strategies differ by provider (OpenAI, Cohere, Voyage), deployment (API vs local), model size (small/large), and dimensionality (256-3072). The choice impacts cost, latency, retrieval quality, and infrastructure requirements. For Laravel applications, API-based embeddings (OpenAI) are the most common starting point, with local models (FastEmbed) used for cost optimization at scale.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
embedding-generation-strategies/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### embedding generation strategies
- **Purpose:** Embedding generation converts text into vector representations for semantic search. Strategies differ by provider (OpenAI, Cohere, Voyage), deployment (API vs local), model size (small/large), and dimensionality (256-3072). The choice impacts cost, latency, retrieval quality, and infrastructure requirements. For Laravel applications, API-based embeddings (OpenAI) are the most common starting point, with local models (FastEmbed) used for cost optimization at scale.
- **Difficulty:** Foundation
- **Dependencies:** K068 (Chunking strategies for RAG), K069 (RAG pipeline architecture), and K053 (Qdrant FastEmbed)

## Dependency Graph
**Depends on:** K068 (Chunking strategies for RAG), K069 (RAG pipeline architecture), and K053 (Qdrant FastEmbed)
**Depended on by:** Knowledge units that leverage or extend embedding generation strategies patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for embedding generation strategies.
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