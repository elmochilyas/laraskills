# Decomposition: scout engine integration

## Topic Overview

Scout's engine integration layer connects Laravel models to search backends. Built-in engines: database (MySQL/PostgreSQL FTS), collection (in-memory), Meilisearch, Typesense, Algolia. Custom engines extend Laravel\Scout\Engines\Engine. The Scout::extend() method registers custom engines.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


scout-engine-integration/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### scout engine integration
- **Purpose:** Scout's engine integration layer connects Laravel models to search backends. Built-in engines: database (MySQL/PostgreSQL FTS), collection (in-memory), Meilisearch, Typesense, Algolia. Custom engines extend Laravel\Scout\Engines\Engine. The Scout::extend() method registers custom engines.
- **Difficulty:** Foundation
- **Dependencies:** K014, K023, K033, K018

## Dependency Graph
**Depends on:** K014, K023, K033, K018
**Depended on by:** Knowledge units that leverage or extend scout engine integration patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for scout engine integration.
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
