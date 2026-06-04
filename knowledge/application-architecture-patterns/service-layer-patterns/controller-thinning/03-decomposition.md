# Decomposition: Controller thinning: what to extract and what to keep

## Topic Overview

Controller thinning is the practice of extracting business logic from controllers into dedicated classes (services, actions, use cases), leaving controllers responsible only for HTTP concerns: receiving requests, calling services, and returning responses. The rule is: if code doesn't involve HTTP request/response handling, it doesn't belong in a controller.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-03-controller-thinning/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Controller thinning: what to extract and what to keep
- **Purpose:** Controller thinning is the practice of extracting business logic from controllers into dedicated classes (services, actions, use cases), leaving controllers responsible only for HTTP concerns: receiving requests, calling services, and returning responses. The rule is: if code doesn't involve HTTP request/response handling, it doesn't belong in a controller.
- **Difficulty:** Foundation
- **Dependencies:** SLP-01 Service classes

## Dependency Graph

This KU depends on: SLP-01 Service classes
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **What stays in controllers:** - Calling the service/action/use case - Passing validated data from Form Request
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