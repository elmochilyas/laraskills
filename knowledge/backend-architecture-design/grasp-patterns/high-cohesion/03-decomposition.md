# Decomposition: GRASP: High Cohesion

## Topic Overview

High Cohesion keeps related responsibilities together within a class or module. High cohesion means the elements of a class are strongly related and focused on a single purpose.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
high-cohesion/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### GRASP: High Cohesion
- **Purpose:** High Cohesion keeps related responsibilities together within a class or module. High cohesion means the elements of a class are strongly related and focused on a single purpose.
- **Difficulty:** Foundation
- **Dependencies:** SRP, Class design |

## Dependency Graph

This KU depends on: SRP, Class design |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Cohesion spectrum: coincidental (worst) → logical → temporal → procedural → communicational → sequential → functional (best) - Functional cohesion: all elements contribute to a single w...
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