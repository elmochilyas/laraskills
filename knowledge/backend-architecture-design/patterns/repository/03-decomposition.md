# Decomposition: Repository (Fowler) in PHP/Laravel context

## Topic Overview

Repository mediates between domain and data mapping layers, acting like an in-memory domain object collection. It provides collection-style access to domain objects while hiding storage details.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
repository/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Repository (Fowler) in PHP/Laravel context
- **Purpose:** Repository mediates between domain and data mapping layers, acting like an in-memory domain object collection. It provides collection-style access to domain objects while hiding storage details.
- **Difficulty:** Intermediate
- **Dependencies:** Dependency Inversion Principle, Interface segregation |

## Dependency Graph

This KU depends on: Dependency Inversion Principle, Interface segregation |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Collection-like interface: `find()`, `findAll()`, `add()`, `remove()` - Hides storage: callers don't know about DB, cache, API - Domain focus: returns domain objects, not DB rows
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