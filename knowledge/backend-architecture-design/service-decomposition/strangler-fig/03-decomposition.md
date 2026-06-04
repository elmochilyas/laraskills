# Decomposition: Strangler fig pattern for incremental decomposition

## Topic Overview

Strangler Fig pattern incrementally replaces legacy functionality with new services by routing specific features to new implementations while the rest continue on the legacy system. Over time, the legacy system is "strangled" — replaced piece by piece until nothing remains.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
strangler-fig/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Strangler fig pattern for incremental decomposition
- **Purpose:** Strangler Fig pattern incrementally replaces legacy functionality with new services by routing specific features to new implementations while the rest continue on the legacy system. Over time, the legacy system is "strangled" — replaced piece by piece until nothing remains.
- **Difficulty:** Advanced
- **Dependencies:** Bounded contexts, Service decomposition |

## Dependency Graph

This KU depends on: Bounded contexts, Service decomposition |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** strangler-fig is built on foundational concepts that govern its application in backend architecture. | Concept | Description | Relevance | |---------|-------------|-----------|
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