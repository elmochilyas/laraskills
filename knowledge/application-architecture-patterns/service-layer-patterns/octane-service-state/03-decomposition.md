# Decomposition: Service layer in Octane: state management considerations

## Topic Overview

Laravel Octane fundamentally changes assumptions about service layer state. Under Octane's persistent worker model, services are resolved once per worker, not once per request.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-19-octane-service-state/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Service layer in Octane: state management considerations
- **Purpose:** Laravel Octane fundamentally changes assumptions about service layer state. Under Octane's persistent worker model, services are resolved once per worker, not once per request.
- **Difficulty:** Expert
- **Dependencies:** LAP-15 Octane compatibility

## Dependency Graph

This KU depends on: LAP-15 Octane compatibility
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Stateless service contract:** - No mutable properties (everything is `readonly` or not set after construction) - No captured request context (no `$this->user`, `$this->request`)
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