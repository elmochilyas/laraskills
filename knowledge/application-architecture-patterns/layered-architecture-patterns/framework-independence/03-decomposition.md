# Decomposition: Framework independence of domain layer in practice

## Topic Overview

Framework independence of the Domain layer is the defining promise of Clean/Hexagonal Architecture: your business rules should not know they're running inside Laravel. In practice, achieving true independence requires constant vigilance and is often not worth the cost for most Laravel applications.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-09-framework-independence/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Framework independence of domain layer in practice
- **Purpose:** Framework independence of the Domain layer is the defining promise of Clean/Hexagonal Architecture: your business rules should not know they're running inside Laravel. In practice, achieving true independence requires constant vigilance and is often not worth the cost for most Laravel applications.
- **Difficulty:** Expert
- **Dependencies:** LAP-05 Domain layer

## Dependency Graph

This KU depends on: LAP-05 Domain layer
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Full independence:** Domain classes import nothing from Laravel. No `Model` base class. No `Facades`. No `Helpers`. No `Carbon`. All dependencies are injected via interfaces defined in the Domain. *...
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