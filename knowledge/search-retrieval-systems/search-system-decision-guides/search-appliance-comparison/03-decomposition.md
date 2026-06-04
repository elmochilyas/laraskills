# Decomposition: search appliance comparison

## Topic Overview

Three primary dedicated search appliances integrate with Laravel Scout: Meilisearch (open-source, Rust), Typesense (open-source, C++), and Algolia (cloud-managed). Each makes different architectural tradeoffs in storage, schema, clustering, performance, and cost. This KU provides a structured comparison to guide engine selection.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure


search-appliance-comparison/
  02-knowledge-unit.md
  03-decomposition.md


## Knowledge Unit Inventory

### search appliance comparison
- **Purpose:** Three primary dedicated search appliances integrate with Laravel Scout: Meilisearch (open-source, Rust), Typesense (open-source, C++), and Algolia (cloud-managed). Each makes different architectural tradeoffs in storage, schema, clustering, performance, and cost. This KU provides a structured com...
- **Difficulty:** Foundation
- **Dependencies:** K002, K014, K018, K023, K033

## Dependency Graph
**Depends on:** K002, K014, K018, K023, K033
**Depended on by:** Knowledge units that leverage or extend search appliance comparison patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for search appliance comparison.
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
