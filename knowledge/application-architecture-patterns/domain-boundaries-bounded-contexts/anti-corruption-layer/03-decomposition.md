# Decomposition: Anti-corruption layer pattern

## Topic Overview

An Anti-Corruption Layer (ACL) is a translation layer that prevents one context's domain model from corrupting another's. When Context A must integrate with Context B (or a legacy system), the ACL translates between B's model and A's model.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-04-anti-corruption-layer/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Anti-corruption layer pattern
- **Purpose:** An Anti-Corruption Layer (ACL) is a translation layer that prevents one context's domain model from corrupting another's. When Context A must integrate with Context B (or a legacy system), the ACL translates between B's model and A's model.
- **Difficulty:** Advanced
- **Dependencies:** DBC-02 Context mapping

## Dependency Graph

This KU depends on: DBC-02 Context mapping
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** ``` [Context A] → ACL → [Legacy System B]     own model      translates       legacy model
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