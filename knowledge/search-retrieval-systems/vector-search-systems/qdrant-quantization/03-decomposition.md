# Decomposition: qdrant quantization

## Topic Overview

Qdrant supports three quantization methods — scalar, product, and binary quantization — to reduce vector memory footprint. Scalar quantization (SQ) converts 32-bit floats to 8-bit integers, product quantization (PQ) compresses vector dimensions into codewords, and binary quantization (BQ) converts to sign bits. Quantization can reduce memory usage by 4-8x with configurable recall tradeoffs.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
qdrant-quantization/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### qdrant quantization
- **Purpose:** Qdrant supports three quantization methods — scalar, product, and binary quantization — to reduce vector memory footprint. Scalar quantization (SQ) converts 32-bit floats to 8-bit integers, product quantization (PQ) compresses vector dimensions into codewords, and binary quantization (BQ) converts to sign bits. Quantization can reduce memory usage by 4-8x with configurable recall tradeoffs.
- **Difficulty:** Foundation
- **Dependencies:** K048 (Qdrant vector search), and K047 (pgvector binary quantization)

## Dependency Graph
**Depends on:** K048 (Qdrant vector search), and K047 (pgvector binary quantization)
**Depended on by:** Knowledge units that leverage or extend qdrant quantization patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for qdrant quantization.
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