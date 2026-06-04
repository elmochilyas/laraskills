# Decomposition: meilisearch custom ranking

## Topic Overview

Meilisearch custom ranking rules allow sorting results by a numeric attribute in ascending or descending order within the ranking hierarchy. They are inserted into the sequence of seven default ranking rules to prioritize business-specific signals like popularity, recency, price, or revenue. Custom ranking is the primary mechanism for business-aware relevance tuning.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
meilisearch-custom-ranking/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### meilisearch custom ranking
- **Purpose:** Meilisearch custom ranking rules allow sorting results by a numeric attribute in ascending or descending order within the ranking hierarchy. They are inserted into the sequence of seven default ranking rules to prioritize business-specific signals like popularity, recency, price, or revenue. Custom ranking is the primary mechanism for business-aware relevance tuning.
- **Difficulty:** Foundation
- **Dependencies:** K023 (Meilisearch driver setup), K030 (Meilisearch ranking rules 7 defaults), and K024 (Meilisearch filterable/sortable)

## Dependency Graph
**Depends on:** K023 (Meilisearch driver setup), K030 (Meilisearch ranking rules 7 defaults), and K024 (Meilisearch filterable/sortable)
**Depended on by:** Knowledge units that leverage or extend meilisearch custom ranking patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for meilisearch custom ranking.
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