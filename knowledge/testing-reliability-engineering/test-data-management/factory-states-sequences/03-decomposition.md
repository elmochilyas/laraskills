# Decomposition: factory states sequences

## Topic Overview

Factory states and sequences are Laravel model factory features that enable concise creation of models with specific attributes and ordered variations. States (`->state()`) define predetermined attribute sets (e.g., `draft`, `published`, `archived`), allowing tests to create models with contextually appropriate data. Sequences (`->sequence()`) apply different attribute sets to each created model in order, useful for creating a range of models (e.g., one admin and three regular users). States ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
factory-states-sequences/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### factory states sequences
- **Purpose:** Factory states and sequences are Laravel model factory features that enable concise creation of models with specific attributes and ordered variations. States (`->state()`) define predetermined attribute sets (e.g., `draft`, `published`, `archived`), allowing tests to create models with contextually appropriate data. Sequences (`->sequence()`) apply different attribute sets to each created model in order, useful for creating a range of models (e.g., one admin and three regular users). States ...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Model factory fundamentals (definition, create, make), **Related Topics**: Declarative factory methods, Minimal data principle, Database testing lifecycle, **Advanced Follow-up**: Custom factory classes, Factory for non-Eloquent objects (DTO factories), and Factory callbacks and events

## Dependency Graph
**Depends on:** **Prerequisites**: Model factory fundamentals (definition, create, make), **Related Topics**: Declarative factory methods, Minimal data principle, Database testing lifecycle, **Advanced Follow-up**: Custom factory classes, Factory for non-Eloquent objects (DTO factories), and Factory callbacks and events
**Depended on by:** Knowledge units that leverage or extend factory states sequences patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for factory states sequences.
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