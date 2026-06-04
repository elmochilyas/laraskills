# Decomposition: rag evaluation metrics

## Topic Overview

RAG evaluation measures both retrieval quality and generation quality. Retrieval metrics (recall, precision, MRR, NDCG) assess whether relevant context was found. Generation metrics (faithfulness, relevance, answer rate) assess whether the LLM produced correct answers grounded in context. The RAGAS framework provides a structured approach to evaluation.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


rag-evaluation-metrics/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### rag evaluation metrics
- **Purpose:** RAG evaluation measures both retrieval quality and generation quality. Retrieval metrics (recall, precision, MRR, NDCG) assess whether relevant context was found. Generation metrics (faithfulness, relevance, answer rate) assess whether the LLM produced correct answers grounded in context. The RAG...
- **Difficulty:** Foundation
- **Dependencies:** K069, K062, K067, K068

## Dependency Graph
**Depends on:** K069, K062, K067, K068
**Depended on by:** Knowledge units that leverage or extend rag evaluation metrics patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for rag evaluation metrics.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

? No Knowledge Unit is overloaded

? No major concept is missing

? Boundaries are clear

? Future phases can operate on individual units

? The structure can scale without reorganization
