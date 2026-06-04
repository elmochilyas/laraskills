# Decomposition: index schema design

## Topic Overview

Index schema design defines what data goes into the search index, how it's structured, and which fields are searchable, filterable, sortable. Scout's 	oSearchableArray() method controls the indexed payload. Schema differs per engine: Meilisearch is schema-free, Typesense requires explicit field types, Algolia combines both approaches.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


index-schema-design/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### index schema design
- **Purpose:** Index schema design defines what data goes into the search index, how it's structured, and which fields are searchable, filterable, sortable. Scout's 	oSearchableArray() method controls the indexed payload. Schema differs per engine: Meilisearch is schema-free, Typesense requires explicit field t...
- **Difficulty:** Foundation
- **Dependencies:** K005, K006, K024, K034

## Dependency Graph
**Depends on:** K005, K006, K024, K034
**Depended on by:** Knowledge units that leverage or extend index schema design patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for index schema design.
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
