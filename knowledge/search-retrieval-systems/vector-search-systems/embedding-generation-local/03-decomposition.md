# Decomposition: embedding generation local

## Topic Overview

Local embedding generation runs embedding models on the application server (CPU or GPU), eliminating API costs and data privacy concerns. FastEmbed (ONNX-optimized) provides fast local embeddings. sentence-transformers offers higher quality but requires Python. Qdrant FastEmbed integration provides on-device embeddings with PHP SDK.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


embedding-generation-local/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### embedding generation local
- **Purpose:** Local embedding generation runs embedding models on the application server (CPU or GPU), eliminating API costs and data privacy concerns. FastEmbed (ONNX-optimized) provides fast local embeddings. sentence-transformers offers higher quality but requires Python. Qdrant FastEmbed integration provid...
- **Difficulty:** Foundation
- **Dependencies:** K053, K067

## Dependency Graph
**Depends on:** K053, K067
**Depended on by:** Knowledge units that leverage or extend embedding generation local patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for embedding generation local.
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
