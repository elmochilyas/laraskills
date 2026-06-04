# Decomposition: database full text vs dedicated

## Topic Overview

Scout offers two zero-infrastructure engines (database and collection) alongside three dedicated engine integrations (Meilisearch, Typesense, Algolia). The database engine leverages MySQL FULLTEXT or PostgreSQL GIN indexes. The collection engine uses PHP in-memory filtering. Dedicated engines run as separate servers. This KU compares when to use each approach.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


database-full-text-vs-dedicated/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### database full text vs dedicated
- **Purpose:** Scout offers two zero-infrastructure engines (database and collection) alongside three dedicated engine integrations (Meilisearch, Typesense, Algolia). The database engine leverages MySQL FULLTEXT or PostgreSQL GIN indexes. The collection engine uses PHP in-memory filtering. Dedicated engines run...
- **Difficulty:** Foundation
- **Dependencies:** K002, K003, K023, K033, K018

## Dependency Graph
**Depends on:** K002, K003, K023, K033, K018
**Depended on by:** Knowledge units that leverage or extend database full text vs dedicated patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for database full text vs dedicated.
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
