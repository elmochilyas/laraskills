# Decomposition: Avoiding anemic domain model in service-layer architectures

## Topic Overview

Anemic Domain Model (Martin Fowler's anti-pattern) occurs when domain logic lives in service classes while the model classes are property bags with getters and setters. `User` has `getName()`/`setName()` but no `register()`/`activate()`/`changePassword()` methods.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-18-anemic-domain-model/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Avoiding anemic domain model in service-layer architectures
- **Purpose:** Anemic Domain Model (Martin Fowler's anti-pattern) occurs when domain logic lives in service classes while the model classes are property bags with getters and setters. `User` has `getName()`/`setName()` but no `register()`/`activate()`/`changePassword()` methods.
- **Difficulty:** Expert
- **Dependencies:** SLP-01 Service classes

## Dependency Graph

This KU depends on: SLP-01 Service classes
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Anemic Domain Model:** ```php class User extends Model {
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