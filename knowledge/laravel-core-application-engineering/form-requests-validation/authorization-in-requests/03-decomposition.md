# Decomposition: Authorization in Requests

## Topic Overview
The authorize() method in Form Requests — HTTP-layer access control gate that runs before validation, integrating with Laravel's Gate/Policy system for action-specific permission checks.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
authorization-in-requests/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Authorization in Requests
- **Purpose:** authorize() method in Form Requests
- **Difficulty:** Intermediate
- **Dependencies:** Form Request Fundamentals

## Dependency Graph
This KU depends on: Form Request Fundamentals. It also references Gate/Policy system and Route Model Binding.

## Boundary Analysis
**In scope:** authorize() method mechanics, timing in pipeline (runs before validation), return types (bool, Response), Gate/Policy delegation, route parameter access, failedAuthorization() override, authorize() vs middleware comparison, info leakage prevention.
**Out of scope:** Gate/Policy system fundamentals (covered in Authorization), middleware-level authorization (covered in Middleware), route model binding mechanics (covered in Routing).

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization