# Decomposition: Cohesion types and measurement

## Topic Overview

Cohesion measures how closely the responsibilities of a module are related. Higher cohesion is better — elements within a module should contribute to a single, well-defined purpose.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
cohesion-types-measurement/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Cohesion types and measurement
- **Purpose:** Cohesion measures how closely the responsibilities of a module are related. Higher cohesion is better — elements within a module should contribute to a single, well-defined purpose.
- **Difficulty:** Intermediate
- **Dependencies:** Coupling types, Class design |

## Dependency Graph

This KU depends on: Coupling types, Class design |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** cohesion-types-measurement is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
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