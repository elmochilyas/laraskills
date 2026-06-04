# Decomposition: meilisearch filterable sortable

## Topic Overview

Meilisearch requires explicit declaration of which attributes are filterable and sortable. Unlike schema-free indexing where field types are inferred, filterable and sortable attributes must be configured in index settings before they can be used in queries. This is done via the `config/scout.php` file and synchronized with `scout:sync-index-settings`.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
meilisearch-filterable-sortable/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### meilisearch filterable sortable
- **Purpose:** Meilisearch requires explicit declaration of which attributes are filterable and sortable. Unlike schema-free indexing where field types are inferred, filterable and sortable attributes must be configured in index settings before they can be used in queries. This is done via the `config/scout.php` file and synchronized with `scout:sync-index-settings`.
- **Difficulty:** Foundation
- **Dependencies:** K023 (Meilisearch driver setup), K025 (Meilisearch typo tolerance), and K027 (Meilisearch faceted search)

## Dependency Graph
**Depends on:** K023 (Meilisearch driver setup), K025 (Meilisearch typo tolerance), and K027 (Meilisearch faceted search)
**Depended on by:** Knowledge units that leverage or extend meilisearch filterable sortable patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for meilisearch filterable sortable.
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