# Decomposition: Eloquent model ownership per context

## Topic Overview

Each Eloquent model belongs to exactly one bounded context. The "User" model in Identity is not the same as the "User" reference in Billing.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-05-model-ownership/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Eloquent model ownership per context
- **Purpose:** Each Eloquent model belongs to exactly one bounded context. The "User" model in Identity is not the same as the "User" reference in Billing.
- **Difficulty:** Intermediate
- **Dependencies:** DBC-01 Context identification

## Dependency Graph

This KU depends on: DBC-01 Context identification
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Owned model:** The context that defines the model's schema, behavior, and lifecycle. Only the owning context creates, updates, or deletes the model's records. **Referenced model:** Another context t...
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