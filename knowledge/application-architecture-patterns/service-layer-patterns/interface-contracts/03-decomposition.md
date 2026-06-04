# Decomposition: Interface contracts for services: when and why

## Topic Overview

Interface contracts for services (e.g., `UserServiceInterface` → `UserService`) are a debated practice in the Laravel community. Proponents argue they enable loose coupling, test mocking, and implementation swapping.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-13-interface-contracts/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Interface contracts for services: when and why
- **Purpose:** Interface contracts for services (e.g., `UserServiceInterface` → `UserService`) are a debated practice in the Laravel community. Proponents argue they enable loose coupling, test mocking, and implementation swapping.
- **Difficulty:** Advanced
- **Dependencies:** SLP-09 Dependency injection

## Dependency Graph

This KU depends on: SLP-09 Dependency injection
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** An interface contract declares what a service does without specifying how: ```php interface PaymentService {
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