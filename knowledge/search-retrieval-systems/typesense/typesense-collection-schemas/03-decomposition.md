# Decomposition: typesense collection schemas

## Topic Overview

Typesense requires explicit collection schemas before indexing documents. Unlike Meilisearch's schema-free approach, Typesense collections define field names, types, and optional facets. In Laravel Scout, these schemas are defined in the `typesense` section of `config/scout.php` under `model-settings`. Schema changes require creating a new collection and performing an alias swap.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
typesense-collection-schemas/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### typesense collection schemas
- **Purpose:** Typesense requires explicit collection schemas before indexing documents. Unlike Meilisearch's schema-free approach, Typesense collections define field names, types, and optional facets. In Laravel Scout, these schemas are defined in the `typesense` section of `config/scout.php` under `model-settings`. Schema changes require creating a new collection and performing an alias swap.
- **Difficulty:** Foundation
- **Dependencies:** K033 (Typesense driver setup), K005 (toSearchableArray), and K035 (Typesense dynamic search parameters)

## Dependency Graph
**Depends on:** K033 (Typesense driver setup), K005 (toSearchableArray), and K035 (Typesense dynamic search parameters)
**Depended on by:** Knowledge units that leverage or extend typesense collection schemas patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for typesense collection schemas.
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