# Decomposition: Import violation detection

## Topic Overview

Import violation detection prevents code in one bounded context from importing classes in another context that it should not depend on. The detection layer scans all PHP `use` statements and matches them against a dependency map.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
AEG-05-import-violation-detection/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Import violation detection
- **Purpose:** Import violation detection prevents code in one bounded context from importing classes in another context that it should not depend on. The detection layer scans all PHP `use` statements and matches them against a dependency map.
- **Difficulty:** Advanced
- **Dependencies:** DBC-01 Bounded context basics

## Dependency Graph

This KU depends on: DBC-01 Bounded context basics
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Dependency map:** A matrix of allowed imports between contexts. Context A can import from Context B and C, but not from Context D. The map is documented in the architecture guide and encoded in test...
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