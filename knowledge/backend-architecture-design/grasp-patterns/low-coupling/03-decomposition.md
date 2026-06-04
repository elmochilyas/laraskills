# Decomposition: GRASP: Low Coupling

## Topic Overview

Low Coupling assigns responsibilities to minimize the number and strength of dependencies between classes. Low coupling is essential for independent development, testing, and change.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
low-coupling/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### GRASP: Low Coupling
- **Purpose:** Low Coupling assigns responsibilities to minimize the number and strength of dependencies between classes. Low coupling is essential for independent development, testing, and change.
- **Difficulty:** Foundation
- **Dependencies:** Coupling types |

## Dependency Graph

This KU depends on: Coupling types |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Coupling types: content (worst) → common → external → control → stamp → data (best) - Afferent coupling: incoming dependencies (how many depend on this) - Efferent coupling: outgoing dep...
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