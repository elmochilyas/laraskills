# Decomposition: qdrant edge

## Topic Overview

Qdrant Edge is a lightweight, embedded version of Qdrant designed for edge devices, mobile, and offline environments. It runs as a library (not a server) within the application process, with no network dependency. Qdrant Edge supports the same vector search capabilities as the full Qdrant server — HNSW indexing, payload filtering, and quantization — but optimized for constrained environments.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
qdrant-edge/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### qdrant edge
- **Purpose:** Qdrant Edge is a lightweight, embedded version of Qdrant designed for edge devices, mobile, and offline environments. It runs as a library (not a server) within the application process, with no network dependency. Qdrant Edge supports the same vector search capabilities as the full Qdrant server — HNSW indexing, payload filtering, and quantization — but optimized for constrained environments.
- **Difficulty:** Foundation
- **Dependencies:** K048 (Qdrant vector search), and K053 (Qdrant FastEmbed)

## Dependency Graph
**Depends on:** K048 (Qdrant vector search), and K053 (Qdrant FastEmbed)
**Depended on by:** Knowledge units that leverage or extend qdrant edge patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for qdrant edge.
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