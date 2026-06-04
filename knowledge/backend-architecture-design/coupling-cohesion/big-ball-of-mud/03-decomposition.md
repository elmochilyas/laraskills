# Decomposition: Big Ball of Mud detection and remediation

## Topic Overview

Big Ball of Mud is a system with no recognizable architecture: tangled dependencies, inconsistent patterns, global state, and ad-hoc organization. It's the default architecture — systems naturally degrade into mud without intentional architectural governance.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
big-ball-of-mud/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Big Ball of Mud detection and remediation
- **Purpose:** Big Ball of Mud is a system with no recognizable architecture: tangled dependencies, inconsistent patterns, global state, and ad-hoc organization. It's the default architecture — systems naturally degrade into mud without intentional architectural governance.
- **Difficulty:** Intermediate
- **Dependencies:** Coupling types, Cohesion types |

## Dependency Graph

This KU depends on: Coupling types, Cohesion types |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** big-ball-of-mud is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
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