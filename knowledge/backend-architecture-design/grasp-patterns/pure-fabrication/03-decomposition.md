# Decomposition: GRASP: Pure Fabrication

## Topic Overview

Pure Fabrication assigns responsibility to a class that does NOT represent a domain concept when assigning it to a domain class would violate Low Coupling or High Cohesion. These are "made up" classes that solve technical or architectural problems without existing in the domain vocabulary.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
pure-fabrication/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### GRASP: Pure Fabrication
- **Purpose:** Pure Fabrication assigns responsibility to a class that does NOT represent a domain concept when assigning it to a domain class would violate Low Coupling or High Cohesion. These are "made up" classes that solve technical or architectural problems without existing in the domain vocabulary.
- **Difficulty:** Foundation
- **Dependencies:** Information Expert, Low Coupling, High Cohesion |

## Dependency Graph

This KU depends on: Information Expert, Low Coupling, High Cohesion |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Non-domain class: not part of the business domain vocabulary - Purpose: achieve low coupling or high cohesion that domain class assignment would violate - Examples: Repository (persistence abstrac...
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