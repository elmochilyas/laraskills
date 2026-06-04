# Decomposition: Form Request Fundamentals

## Topic Overview
Form Request classes — encapsulating HTTP input validation and authorization into dedicated autoloaded classes via the ValidatesWhenResolved contract, with rules(), authorize(), messages(), and attributes() methods.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
form-request-fundamentals/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Form Request Fundamentals
- **Purpose:** Form Request classes — rules, messages, attributes
- **Difficulty:** Foundation
- **Dependencies:** Controllers

## Dependency Graph
This KU depends on: Controllers. It serves as prerequisite for all other Form Request & Validation KUs.

## Boundary Analysis
**In scope:** ValidatesWhenResolved contract, auto-validation pipeline, rules()/authorize()/messages()/attributes() methods, getValidatorInstance() flow, validateResolved() execution order, string vs array syntax, per-action FormRequests, inheritance for shared rules, ValidationException formatting.
**Out of scope:** authorize() deep dive (covered in Authorization in Requests), rule syntax details (covered in Validation Rule Patterns), custom rules (covered in Custom Validation Rules), conditional rules (covered in Conditional Validation).

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