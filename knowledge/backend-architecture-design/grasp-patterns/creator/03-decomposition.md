# Decomposition: GRASP: Creator

## Topic Overview

Creator assigns responsibility for creating instances of class A to class B that contains, composites, records, closely uses, or has the data to initialize A. In Laravel, Creator guides where object creation belongs — aggregate roots create their children, factories create complex objects, and repositories create domain objects.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
creator/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### GRASP: Creator
- **Purpose:** Creator assigns responsibility for creating instances of class A to class B that contains, composites, records, closely uses, or has the data to initialize A. In Laravel, Creator guides where object creation belongs — aggregate roots create their children, factories create complex objects, and repositories create domain objects.
- **Difficulty:** Foundation
- **Dependencies:** Information Expert, Object creation |

## Dependency Graph

This KU depends on: Information Expert, Object creation |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Assignment: B creates A if B contains A, composites A, records A, closely uses A, or has initialization data - Containment: B contains A → B creates A - Aggregation: B composites A → B creates...
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