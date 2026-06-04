# Decomposition: meilisearch hybrid search

## Topic Overview

Meilisearch's hybrid search combines keyword (BM25) and semantic (vector) search in a single query, fusing results using an internal ranking algorithm. It supports automatic embedding generation via OpenAI, Hugging Face, or user-provided embeddings. The hybrid mode seamlessly integrates keyword precision with semantic understanding without requiring separate search infrastructure.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
meilisearch-hybrid-search/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### meilisearch hybrid search
- **Purpose:** Meilisearch's hybrid search combines keyword (BM25) and semantic (vector) search in a single query, fusing results using an internal ranking algorithm. It supports automatic embedding generation via OpenAI, Hugging Face, or user-provided embeddings. The hybrid mode seamlessly integrates keyword precision with semantic understanding without requiring separate search infrastructure.
- **Difficulty:** Foundation
- **Dependencies:** K023 (Meilisearch driver setup), K030 (Meilisearch ranking rules), and K061 (RRF - Reciprocal Rank Fusion)

## Dependency Graph
**Depends on:** K023 (Meilisearch driver setup), K030 (Meilisearch ranking rules), and K061 (RRF - Reciprocal Rank Fusion)
**Depended on by:** Knowledge units that leverage or extend meilisearch hybrid search patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for meilisearch hybrid search.
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