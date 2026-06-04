# Decomposition: hybrid search concept

## Topic Overview

Hybrid search combines keyword-based (BM25, full-text) and semantic (vector embedding) retrieval to get the best of both approaches. Keyword search excels at exact matches, proper nouns, and rare terms. Vector search excels at conceptual matches, synonyms, and understanding intent. Fusion algorithms combine results into a single ranked list.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


hybrid-search-concept/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### hybrid search concept
- **Purpose:** Hybrid search combines keyword-based (BM25, full-text) and semantic (vector embedding) retrieval to get the best of both approaches. Keyword search excels at exact matches, proper nouns, and rare terms. Vector search excels at conceptual matches, synonyms, and understanding intent. Fusion algorit...
- **Difficulty:** Foundation
- **Dependencies:** K045, K049, K061, K062, K028

## Dependency Graph
**Depends on:** K045, K049, K061, K062, K028
**Depended on by:** Knowledge units that leverage or extend hybrid search concept patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for hybrid search concept.
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
