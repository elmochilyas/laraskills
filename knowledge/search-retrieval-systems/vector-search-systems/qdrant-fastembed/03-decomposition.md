# Decomposition: qdrant fastembed

## Topic Overview

Qdrant integrates with FastEmbed, a library for on-device embedding generation using quantized ONNX models. FastEmbed runs embedding inference locally (CPU), eliminating the need for external embedding API calls. It supports models for dense embeddings (BGE, Instructor), sparse embeddings (SPLADE), and cross-encoder re-ranking.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
qdrant-fastembed/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### qdrant fastembed
- **Purpose:** Qdrant integrates with FastEmbed, a library for on-device embedding generation using quantized ONNX models. FastEmbed runs embedding inference locally (CPU), eliminating the need for external embedding API calls. It supports models for dense embeddings (BGE, Instructor), sparse embeddings (SPLADE), and cross-encoder re-ranking.
- **Difficulty:** Foundation
- **Dependencies:** K048 (Qdrant vector search), K054 (Qdrant cross-encoder re-ranking), and K055 (Qdrant Edge)

## Dependency Graph
**Depends on:** K048 (Qdrant vector search), K054 (Qdrant cross-encoder re-ranking), and K055 (Qdrant Edge)
**Depended on by:** Knowledge units that leverage or extend qdrant fastembed patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for qdrant fastembed.
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