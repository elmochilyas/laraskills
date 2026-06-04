# Decomposition: meilisearch ranking rules

## Topic Overview

Meilisearch uses seven default ranking rules applied sequentially to determine result order: words, typo, proximity, attribute, sort, position, exactness. These rules are evaluated in order — each subsequent rule acts as a tiebreaker for the previous. Understanding this hierarchy is essential for effective relevance tuning. Custom ranking rules can be inserted into this sequence.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
meilisearch-ranking-rules/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### meilisearch ranking rules
- **Purpose:** Meilisearch uses seven default ranking rules applied sequentially to determine result order: words, typo, proximity, attribute, sort, position, exactness. These rules are evaluated in order — each subsequent rule acts as a tiebreaker for the previous. Understanding this hierarchy is essential for effective relevance tuning. Custom ranking rules can be inserted into this sequence.
- **Difficulty:** Foundation
- **Dependencies:** K023 (Meilisearch driver setup), K031 (Meilisearch custom ranking), and K019 (Algolia index settings)

## Dependency Graph
**Depends on:** K023 (Meilisearch driver setup), K031 (Meilisearch custom ranking), and K019 (Algolia index settings)
**Depended on by:** Knowledge units that leverage or extend meilisearch ranking rules patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for meilisearch ranking rules.
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