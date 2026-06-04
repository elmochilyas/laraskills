# Decomposition: Transaction boundaries in layered architecture

## Topic Overview

Database transaction boundaries in layered architecture answer the question: where does the `DB::transaction()` call belong? The emerging consensus places transactions in the Application layer (Use Case/Service level), not in Controllers (Presentation) and not in Repositories (Infrastructure). Controllers should not manage transactions because they are HTTP concerns.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-11-transaction-boundaries/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Transaction boundaries in layered architecture
- **Purpose:** Database transaction boundaries in layered architecture answer the question: where does the `DB::transaction()` call belong? The emerging consensus places transactions in the Application layer (Use Case/Service level), not in Controllers (Presentation) and not in Repositories (Infrastructure). Controllers should not manage transactions because they are HTTP concerns.
- **Difficulty:** Expert
- **Dependencies:** LAP-06 Application layer

## Dependency Graph

This KU depends on: LAP-06 Application layer
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** Transactions ensure atomicity: a group of database operations either all succeed or all fail. In layered architecture, the transaction boundary should encompass the full business operation, not indivi...
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