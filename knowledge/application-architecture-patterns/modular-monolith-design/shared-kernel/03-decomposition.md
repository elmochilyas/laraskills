# Decomposition: Shared kernel: what belongs in shared vs. modules

## Topic Overview

The shared kernel is the minimal set of code that multiple modules share. It includes base classes, utility interfaces, value objects, and foundation types that are genuinely cross-cutting.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-08-shared-kernel/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Shared kernel: what belongs in shared vs. modules
- **Purpose:** The shared kernel is the minimal set of code that multiple modules share. It includes base classes, utility interfaces, value objects, and foundation types that are genuinely cross-cutting.
- **Difficulty:** Intermediate
- **Dependencies:** MMD-03 Module internal structure

## Dependency Graph

This KU depends on: MMD-03 Module internal structure
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **What belongs in shared kernel:** - Base value objects (`Money`, `Email`, `Address`) - Cross-cutting interfaces (`EventBus`, `Logger`)
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