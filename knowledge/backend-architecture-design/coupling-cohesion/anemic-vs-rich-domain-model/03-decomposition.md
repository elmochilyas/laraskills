# Decomposition: Anemic domain model vs rich domain model

## Topic Overview

Anemic domain model is a domain object with public getters/setters but no business behavior — essentially a data structure. All logic lives in services (Transaction Script style).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
anemic-vs-rich-domain-model/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Anemic domain model vs rich domain model
- **Purpose:** Anemic domain model is a domain object with public getters/setters but no business behavior — essentially a data structure. All logic lives in services (Transaction Script style).
- **Difficulty:** Intermediate
- **Dependencies:** Domain Model pattern, Information Expert GRASP |

## Dependency Graph

This KU depends on: Domain Model pattern, Information Expert GRASP |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** anemic-vs-rich-domain-model is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
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