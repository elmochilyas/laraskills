# Decomposition: Service vs. Action vs. Use Case: decision criteria

## Topic Overview

Service, Action, and Use Case classes are not competing alternatives—they solve different organizational problems at different scales. The decision depends on operation complexity, team size, and architecture maturity.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-10-service-action-usecase-decision/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Service vs. Action vs. Use Case: decision criteria
- **Purpose:** Service, Action, and Use Case classes are not competing alternatives—they solve different organizational problems at different scales. The decision depends on operation complexity, team size, and architecture maturity.
- **Difficulty:** Advanced
- **Dependencies:** SLP-01 Service classes

## Dependency Graph

This KU depends on: SLP-01 Service classes
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** | Criterion | Service | Action | Use Case | |---|---|---|---| | Scope | Multiple related operations | One operation | One business intent |
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