# Decomposition: Template Method pattern in PHP/Laravel context

## Topic Overview

Template Method defines the skeleton of an algorithm in a base class, letting subclasses override specific steps without changing the algorithm's structure. In Laravel, the pattern is pervasive: service providers (register/boot lifecycle), controller method flow, and many framework base classes use Template Method to define invariant processes with variant steps.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
template-method/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Template Method pattern in PHP/Laravel context
- **Purpose:** Template Method defines the skeleton of an algorithm in a base class, letting subclasses override specific steps without changing the algorithm's structure. In Laravel, the pattern is pervasive: service providers (register/boot lifecycle), controller method flow, and many framework base classes use Template Method to define invariant processes with variant steps.
- **Difficulty:** Foundation
- **Dependencies:** Inheritance, Abstract classes |

## Dependency Graph

This KU depends on: Inheritance, Abstract classes |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - AbstractClass: defines template method (algorithm skeleton) and abstract primitive operations - ConcreteClass: implements primitive operations - Template method: calls primitive operations in spec...
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