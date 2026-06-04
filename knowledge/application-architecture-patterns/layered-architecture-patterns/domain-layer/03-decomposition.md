# Decomposition: Domain layer: entities, value objects, domain services

## Topic Overview

The Domain layer is the innermost layer of Clean/Hexagonal Architecture, containing pure business logic with zero framework dependencies. It consists of Entities (objects with identity that persist over time), Value Objects (immutable objects defined by their attributes), and Domain Services (stateless operations that don't naturally fit on an Entity).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-05-domain-layer/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Domain layer: entities, value objects, domain services
- **Purpose:** The Domain layer is the innermost layer of Clean/Hexagonal Architecture, containing pure business logic with zero framework dependencies. It consists of Entities (objects with identity that persist over time), Value Objects (immutable objects defined by their attributes), and Domain Services (stateless operations that don't naturally fit on an Entity).
- **Difficulty:** Advanced
- **Dependencies:** DDD tactical patterns

## Dependency Graph

This KU depends on: DDD tactical patterns
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Entities:** Objects with a unique identity that remains constant through state changes. `Invoice` (identified by invoice number), `User` (identified by user ID), `Order` (identified by order ID). En...
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