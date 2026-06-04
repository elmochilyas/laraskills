# Decomposition: Read model strategies (denormalized tables, materialized views, in-memory)

## Topic Overview

Read models are data structures optimized for specific query patterns, separate from write models. Strategies range from in-memory transformations (simplest) through denormalized database tables to materialized views and full-text indexes.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
read-model-strategies/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Read model strategies (denormalized tables, materialized views, in-memory)
- **Purpose:** Read models are data structures optimized for specific query patterns, separate from write models. Strategies range from in-memory transformations (simplest) through denormalized database tables to materialized views and full-text indexes.
- **Difficulty:** Intermediate
- **Dependencies:** CQRS, Database design |

## Dependency Graph

This KU depends on: CQRS, Database design |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** read-model-strategies is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent design patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization