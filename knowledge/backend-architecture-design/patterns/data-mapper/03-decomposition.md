# Decomposition: Data Mapper pattern in PHP/Laravel context

## Topic Overview

Data Mapper is a layer that transfers data between objects and a database while keeping them independent of each other and the mapper itself. Unlike Active Record (Eloquent), where objects carry both data and persistence logic, Data Mapper provides complete separation of concerns.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
data-mapper/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Data Mapper pattern in PHP/Laravel context
- **Purpose:** Data Mapper is a layer that transfers data between objects and a database while keeping them independent of each other and the mapper itself. Unlike Active Record (Eloquent), where objects carry both data and persistence logic, Data Mapper provides complete separation of concerns.
- **Difficulty:** Advanced
- **Dependencies:** Persistence ignorance, Hexagonal Architecture |

## Dependency Graph

This KU depends on: Persistence ignorance, Hexagonal Architecture |
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - Separation: domain objects know nothing about database - Mapper: handles all SQL/storage operations - Identity: mapper tracks object identity separately from database identity
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