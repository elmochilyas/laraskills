# Decomposition: When to deviate from defaults: decision criteria

## Topic Overview

The decision to deviate from Laravel's default structure is one of the most consequential in a project's lifecycle. The community consensus is clear: start with defaults, deviate only when measurable pain emerges.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-09-when-to-deviate/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### When to deviate from defaults: decision criteria
- **Purpose:** The decision to deviate from Laravel's default structure is one of the most consequential in a project's lifecycle. The community consensus is clear: start with defaults, deviate only when measurable pain emerges.
- **Difficulty:** Advanced
- **Dependencies:** COS-01 Default structure

## Dependency Graph

This KU depends on: COS-01 Default structure
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** Deviating from defaults creates two categories of cost: 1. **Setup cost:** Initial restructuring, PSR-4 configuration, tooling reconfiguration, documentation updates. 2. **Ongoing cost:** Developer tr...
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