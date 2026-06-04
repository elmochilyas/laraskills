# Decomposition: Integrating legacy systems at context boundaries

## Topic Overview

Legacy integration at context boundaries uses the Anti-Corruption Layer (ACL) and Strangler Fig patterns to isolate the new system from legacy contamination. The ACL translates between legacy and new domain models.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-10-legacy-integration/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Integrating legacy systems at context boundaries
- **Purpose:** Legacy integration at context boundaries uses the Anti-Corruption Layer (ACL) and Strangler Fig patterns to isolate the new system from legacy contamination. The ACL translates between legacy and new domain models.
- **Difficulty:** Expert
- **Dependencies:** DBC-04 Anti-corruption layer

## Dependency Graph

This KU depends on: DBC-04 Anti-corruption layer
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Anti-Corruption Layer:** Translates between legacy model and new context model. Prevents legacy terminology and schema from leaking into the new system. **Strangler Fig:** Incrementally replaces leg...
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