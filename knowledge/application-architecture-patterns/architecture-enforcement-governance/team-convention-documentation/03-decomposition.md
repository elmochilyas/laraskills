# Decomposition: Team convention documentation

## Topic Overview

Team convention documentation captures the team's agreed-upon coding and architecture standards in a living document. Unlike ADRs which capture individual decisions, conventions capture ongoing practices: naming, file layout, test structure, dependency rules, and review expectations.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
AEG-07-team-convention-documentation/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Team convention documentation
- **Purpose:** Team convention documentation captures the team's agreed-upon coding and architecture standards in a living document. Unlike ADRs which capture individual decisions, conventions capture ongoing practices: naming, file layout, test structure, dependency rules, and review expectations.
- **Difficulty:** Intermediate
- **Dependencies:** AEG-06 ADRs

## Dependency Graph

This KU depends on: AEG-06 ADRs
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Convention doc:** A living document in the repository (`docs/conventions.md`) that records the team's agreements. Updated by PR. Referenced in code review. **Living document:** The convention doc ev...
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