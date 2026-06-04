# Decomposition: Testing strategies for modular monolith

## Topic Overview

Testing a modular monolith requires testing both within-module behavior (module is self-contained) and cross-module contracts (module boundaries work correctly). The testing pyramid shifts: unit tests for module-internal logic, contract tests for cross-module interfaces, integration tests for module boundaries, and end-to-end tests for critical user journeys.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-16-testing-strategies/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Testing strategies for modular monolith
- **Purpose:** Testing a modular monolith requires testing both within-module behavior (module is self-contained) and cross-module contracts (module boundaries work correctly). The testing pyramid shifts: unit tests for module-internal logic, contract tests for cross-module interfaces, integration tests for module boundaries, and end-to-end tests for critical user journeys.
- **Difficulty:** Expert
- **Dependencies:** MMD-05 Module autonomy

## Dependency Graph

This KU depends on: MMD-05 Module autonomy
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Within-module tests:** Unit tests for module-internal services, actions, and domain logic. These are fast and don't cross module boundaries. **Contract tests:** Tests that verify a module's contract...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

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