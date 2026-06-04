# Decomposition: Module boundary identification: bounded context heuristics

## Topic Overview

Module boundaries are determined by business domain boundaries, not technical convenience. The primary heuristic for identifying a module boundary is language: do the same words (User, Order, Account) mean different things in different contexts? If "User" means "login credentials" in one context and "shipping recipient" in another, those are separate modules.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-02-boundary-identification/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Module boundary identification: bounded context heuristics
- **Purpose:** Module boundaries are determined by business domain boundaries, not technical convenience. The primary heuristic for identifying a module boundary is language: do the same words (User, Order, Account) mean different things in different contexts? If "User" means "login credentials" in one context and "shipping recipient" in another, those are separate modules.
- **Difficulty:** Intermediate
- **Dependencies:** MMD-01 Module vs microservice

## Dependency Graph

This KU depends on: MMD-01 Module vs microservice
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Bounded Context (DDD):** A boundary within which a particular domain model applies. Words and concepts have specific, unambiguous meanings inside the context. Outside it, they may mean different thi...
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