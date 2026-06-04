# Decomposition: Onion Architecture / Clean Architecture dependency rule

## Topic Overview

Clean Architecture (and its precursor Onion Architecture) organizes code into concentric rings where dependencies point inward — outer rings (frameworks, databases, UI) depend on inner rings (business rules), never the reverse. The dependency rule ensures that business logic is framework-independent, testable, and swappable.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
onion-clean-architecture/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Onion Architecture / Clean Architecture dependency rule
- **Purpose:** Clean Architecture (and its precursor Onion Architecture) organizes code into concentric rings where dependencies point inward — outer rings (frameworks, databases, UI) depend on inner rings (business rules), never the reverse. The dependency rule ensures that business logic is framework-independent, testable, and swappable.
- **Difficulty:** Advanced
- **Dependencies:** Dependency Inversion Principle, Hexagonal Architecture |

## Dependency Graph

This KU depends on: Dependency Inversion Principle, Hexagonal Architecture |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** onion-clean-architecture is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
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