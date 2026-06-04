# Decomposition: reciprocal rank fusion

## Topic Overview

Reciprocal Rank Fusion (RRF) is a hybrid search fusion algorithm that combines multiple ranked result lists into a single ranked list. Each result's score is computed as `1 / (k + rank)` where `rank` is the item's position in each input list. RRF requires no training, no relevance scores from the input engines, and no normalization — only rank positions. This simplicity makes it the most widely used fusion method.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
reciprocal-rank-fusion/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### reciprocal rank fusion
- **Purpose:** Reciprocal Rank Fusion (RRF) is a hybrid search fusion algorithm that combines multiple ranked result lists into a single ranked list. Each result's score is computed as `1 / (k + rank)` where `rank` is the item's position in each input list. RRF requires no training, no relevance scores from the input engines, and no normalization — only rank positions. This simplicity makes it the most widely used fusion method.
- **Difficulty:** Foundation
- **Dependencies:** K028 (Meilisearch hybrid search), K045 (pgvector + FTS hybrid), and K049 (Qdrant hybrid queries)

## Dependency Graph
**Depends on:** K028 (Meilisearch hybrid search), K045 (pgvector + FTS hybrid), and K049 (Qdrant hybrid queries)
**Depended on by:** Knowledge units that leverage or extend reciprocal rank fusion patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for reciprocal rank fusion.
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