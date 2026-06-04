# Decomposition: GRASP: Information Expert

## Topic Overview

Information Expert assigns responsibility to the class that has the information needed to fulfill it — the class with the most relevant data should perform operations on that data. This is the foundational principle for building rich domain models over anemic ones.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
information-expert/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### GRASP: Information Expert
- **Purpose:** Information Expert assigns responsibility to the class that has the information needed to fulfill it — the class with the most relevant data should perform operations on that data. This is the foundational principle for building rich domain models over anemic ones.
- **Difficulty:** Foundation
- **Dependencies:** Encapsulation, OOP basics |

## Dependency Graph

This KU depends on: Encapsulation, OOP basics |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Responsibility assignment: who should do this work? - Data locality: class with the data does the operation - High cohesion: operations live near the data they operate on
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