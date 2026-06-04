# Decomposition: Mapping between domain entities and Eloquent models

## Topic Overview

Mapping between domain entities (pure PHP business objects) and Eloquent models (Laravel's ORM implementation) is the central challenge of Clean Architecture in Laravel. Domain entities know nothing about databases; Eloquent models know nothing about business rules.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-10-domain-entity-mapping/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Mapping between domain entities and Eloquent models
- **Purpose:** Mapping between domain entities (pure PHP business objects) and Eloquent models (Laravel's ORM implementation) is the central challenge of Clean Architecture in Laravel. Domain entities know nothing about databases; Eloquent models know nothing about business rules.
- **Difficulty:** Expert
- **Dependencies:** LAP-05 Domain layer

## Dependency Graph

This KU depends on: LAP-05 Domain layer
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Domain entity:** Pure PHP object with business behavior. `Invoice` entity with `markAsPaid()`, `addLineItem()`, `calculateTotal()` methods. No extends, no traits, no framework. **Eloquent model:** L...
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