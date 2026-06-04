# Decomposition: typesense dynamic search params

## Topic Overview

Typesense's dynamic search parameters provide granular, query-level control over search behavior. Unlike configuration-based relevance tuning (Meilisearch ranking rules, Algolia settings), Typesense parameters like `query_by`, `query_by_weights`, `prefix`, and `drop_tokens_threshold` are specified per-query, enabling context-aware relevance strategies within a single request.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
typesense-dynamic-search-params/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### typesense dynamic search params
- **Purpose:** Typesense's dynamic search parameters provide granular, query-level control over search behavior. Unlike configuration-based relevance tuning (Meilisearch ranking rules, Algolia settings), Typesense parameters like `query_by`, `query_by_weights`, `prefix`, and `drop_tokens_threshold` are specified per-query, enabling context-aware relevance strategies within a single request.
- **Difficulty:** Foundation
- **Dependencies:** K033 (Typesense driver setup), K034 (Typesense collection schemas), and K013 (Customizing engine searches)

## Dependency Graph
**Depends on:** K033 (Typesense driver setup), K034 (Typesense collection schemas), and K013 (Customizing engine searches)
**Depended on by:** Knowledge units that leverage or extend typesense dynamic search params patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for typesense dynamic search params.
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