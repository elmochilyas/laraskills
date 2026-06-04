# Decomposition: weighted hybrid scoring

## Topic Overview

Weighted hybrid scoring combines keyword and vector search scores using a weighted formula: score = a * normalized_keyword_score + (1-a) * vector_similarity. The a parameter controls the balance between keyword and semantic contributions. Unlike RRF, weighted fusion uses actual relevance scores, requiring normalization since different engines produce scores on different scales.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


weighted-hybrid-scoring/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### weighted hybrid scoring
- **Purpose:** Weighted hybrid scoring combines keyword and vector search scores using a weighted formula: score = a * normalized_keyword_score + (1-a) * vector_similarity. The a parameter controls the balance between keyword and semantic contributions. Unlike RRF, weighted fusion uses actual relevance scores, ...
- **Difficulty:** Foundation
- **Dependencies:** K061, K062, K002

## Dependency Graph
**Depends on:** K061, K062, K002
**Depended on by:** Knowledge units that leverage or extend weighted hybrid scoring patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for weighted hybrid scoring.
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
