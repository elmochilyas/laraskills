# Decomposition: Refactoring and remediation workflows

## Topic Overview

Refactoring and remediation workflows fix architectural violations systematically. The workflow: detect violation, assess impact, plan remediation, execute, verify.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
AEG-09-refactoring-remediation/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Refactoring and remediation workflows
- **Purpose:** Refactoring and remediation workflows fix architectural violations systematically. The workflow: detect violation, assess impact, plan remediation, execute, verify.
- **Difficulty:** Expert
- **Dependencies:** AEG-08 Drift detection

## Dependency Graph

This KU depends on: AEG-08 Drift detection
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Remediation priority:** Violations are classified by severity—critical (broken isolation), high (unauthorized import), medium (missing contract), low (naming). Priority determines when the remedia...
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