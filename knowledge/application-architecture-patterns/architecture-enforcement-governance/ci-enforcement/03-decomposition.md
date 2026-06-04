# Decomposition: CI enforcement of architecture rules

## Topic Overview

CI enforcement runs architecture tests, static analysis, and linters on every push. Rules are checked before a PR is merged.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
AEG-02-ci-enforcement/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### CI enforcement of architecture rules
- **Purpose:** CI enforcement runs architecture tests, static analysis, and linters on every push. Rules are checked before a PR is merged.
- **Difficulty:** Advanced
- **Dependencies:** AEG-01 Architecture testing

## Dependency Graph

This KU depends on: AEG-01 Architecture testing
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Pre-merge gate:** Architecture tests run in CI and must pass before a PR merges. No manual override. Violations must be fixed (or the rule must be changed). **Fail fast:** Architecture tests run ear...
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