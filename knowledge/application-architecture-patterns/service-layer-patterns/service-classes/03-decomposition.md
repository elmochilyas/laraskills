# Decomposition: Service classes: grouping operations by entity

## Topic Overview

Service classes are the most common architectural extension in Laravel. They group related business operations by entity or domain, extracting logic from controllers into dedicated classes.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-01-service-classes/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Service classes: grouping operations by entity
- **Purpose:** Service classes are the most common architectural extension in Laravel. They group related business operations by entity or domain, extracting logic from controllers into dedicated classes.
- **Difficulty:** Foundation
- **Dependencies:** COS-02 Layer-based organization

## Dependency Graph

This KU depends on: COS-02 Layer-based organization
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** Service classes group operations by the entity they operate on: ``` app/Services/
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