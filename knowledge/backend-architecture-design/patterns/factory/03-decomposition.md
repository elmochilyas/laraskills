# Decomposition: Factory pattern in PHP/Laravel context

## Topic Overview

Factory encapsulates object creation logic, decoupling callers from concrete instantiation details. In Laravel, the service container's auto-resolution already handles most factory needs — when a class has dependencies, the container builds them.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
factory/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Factory pattern in PHP/Laravel context
- **Purpose:** Factory encapsulates object creation logic, decoupling callers from concrete instantiation details. In Laravel, the service container's auto-resolution already handles most factory needs — when a class has dependencies, the container builds them.
- **Difficulty:** Foundation
- **Dependencies:** Dependency Injection, Interface segregation |

## Dependency Graph

This KU depends on: Dependency Injection, Interface segregation |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Factory Method: a single method that returns a specific interface/abstract type - Static Factory: `Foo::create($args)` — simple but limits testability - Factory class: dedicated class with `make...
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