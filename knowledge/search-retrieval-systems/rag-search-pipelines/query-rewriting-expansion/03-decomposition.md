# Decomposition: query rewriting expansion

## Topic Overview

Query rewriting and expansion improve retrieval quality by transforming user queries before search. Techniques include: query expansion (adding related terms), HyDE (Hypothetical Document Embeddings), query decomposition (breaking complex questions into sub-questions), and query normalization (spelling correction, stop word removal). These are especially valuable in RAG pipelines where retrieval quality directly affects answer quality.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


query-rewriting-expansion/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### query rewriting expansion
- **Purpose:** Query rewriting and expansion improve retrieval quality by transforming user queries before search. Techniques include: query expansion (adding related terms), HyDE (Hypothetical Document Embeddings), query decomposition (breaking complex questions into sub-questions), and query normalization (sp...
- **Difficulty:** Foundation
- **Dependencies:** K067, K069, K061

## Dependency Graph
**Depends on:** K067, K069, K061
**Depended on by:** Knowledge units that leverage or extend query rewriting expansion patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for query rewriting expansion.
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
