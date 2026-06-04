# Decomposition: SOLID principles in PHP: DIP violations

## Topic Overview

Dependency Inversion Principle states that high-level modules should not depend on low-level modules; both should depend on abstractions. Furthermore, abstractions should not depend on details; details should depend on abstractions.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
dip-violations/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### SOLID principles in PHP: DIP violations
- **Purpose:** Dependency Inversion Principle states that high-level modules should not depend on low-level modules; both should depend on abstractions. Furthermore, abstractions should not depend on details; details should depend on abstractions.
- **Difficulty:** Foundation
- **Dependencies:** Dependency injection, Interface design |

## Dependency Graph

This KU depends on: Dependency injection, Interface design |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - High-level policy: business logic should not depend on infrastructure - Abstraction ownership: interfaces belong to the high-level module (caller defines the contract) - Dependency injection: abst...
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