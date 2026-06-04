# Decomposition: Dependency injection for services and actions

## Topic Overview

Dependency injection (DI) is the mechanism that supplies services and actions with their dependencies. In Laravel, the service container automatically resolves constructor dependencies, making DI transparent and powerful.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-09-dependency-injection/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Dependency injection for services and actions
- **Purpose:** Dependency injection (DI) is the mechanism that supplies services and actions with their dependencies. In Laravel, the service container automatically resolves constructor dependencies, making DI transparent and powerful.
- **Difficulty:** Intermediate
- **Dependencies:** Laravel Service Container

## Dependency Graph

This KU depends on: Laravel Service Container
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Constructor injection:** Dependencies are declared as constructor parameters. Laravel's container resolves them automatically: ```php class UserService {
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