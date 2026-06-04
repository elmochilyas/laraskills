# Decomposition: Clean Architecture layers: Domain, Application, Infrastructure, Presentation

## Topic Overview

Clean Architecture (Robert C. Martin, 2012) organizes code into four concentric layers: Domain (entities, business rules), Application (use cases, DTOs), Infrastructure (databases, external APIs), and Presentation (HTTP, controllers).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-02-clean-architecture/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Clean Architecture layers: Domain, Application, Infrastructure, Presentation
- **Purpose:** Clean Architecture (Robert C. Martin, 2012) organizes code into four concentric layers: Domain (entities, business rules), Application (use cases, DTOs), Infrastructure (databases, external APIs), and Presentation (HTTP, controllers).
- **Difficulty:** Advanced
- **Dependencies:** LAP-01 Three-layer architecture

## Dependency Graph

This KU depends on: LAP-01 Three-layer architecture
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Domain Layer (innermost):** Enterprise business rules. Entities, value objects, domain events, domain services. Zero framework dependencies. Pure PHP with no Laravel imports. **Application Layer:** ...
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