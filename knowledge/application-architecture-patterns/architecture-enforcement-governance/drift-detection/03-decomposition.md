# Decomposition: Drift detection and architecture health

## Topic Overview

Drift detection monitors how much the actual codebase deviates from the intended architecture. It produces a health metric—a percentage or score—that tracks drift over time.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
AEG-08-drift-detection/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Drift detection and architecture health
- **Purpose:** Drift detection monitors how much the actual codebase deviates from the intended architecture. It produces a health metric—a percentage or score—that tracks drift over time.
- **Difficulty:** Advanced
- **Dependencies:** AEG-05 Import violation detection

## Dependency Graph

This KU depends on: AEG-05 Import violation detection
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Architecture drift:** The gap between the intended architecture (documented rules) and the actual codebase. Measured as a drift score. **Baseline:** The initial drift score when monitoring started. ...
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