# Decomposition: Shared kernel design: minimal shared code

## Topic Overview

The Shared Kernel is the minimal set of code that multiple bounded contexts share. It must be the most stable code in the system—changing rarely and only with broad coordination.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-03-shared-kernel/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Shared kernel design: minimal shared code
- **Purpose:** The Shared Kernel is the minimal set of code that multiple bounded contexts share. It must be the most stable code in the system—changing rarely and only with broad coordination.
- **Difficulty:** Intermediate
- **Dependencies:** DBC-01 Context identification

## Dependency Graph

This KU depends on: DBC-01 Context identification
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **What belongs:** - Value objects that are genuinely universal: `Money`, `Email`, `Address` - Foundation interfaces: `EventDispatcher`, `Logger`, `IdGenerator`
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