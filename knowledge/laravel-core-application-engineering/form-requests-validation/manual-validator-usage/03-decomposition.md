# Decomposition: Manual Validator Usage

## Topic Overview
Validator::make() outside Form Requests — using the Validator class directly in non-HTTP contexts such as commands, queued jobs, service classes, and domain actions.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
manual-validator-usage/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Manual Validator Usage
- **Purpose:** Validator::make() outside Form Requests
- **Difficulty:** Intermediate
- **Dependencies:** Form Request Fundamentals

## Dependency Graph
This KU depends on: Form Request Fundamentals. It serves as prerequisite for validation in service/action classes.

## Boundary Analysis
**In scope:** Validator::make() factory, passes()/fails()/validate()/validated() methods, action-level validation, service-level validation, queue job validation, reusing FormRequest rules, validate() vs passes() + manual errors, batch validation performance, Validator::make() facade vs factory injection.
**Out of scope:** Form Request auto-validation pipeline (covered in Form Request Fundamentals), custom rule objects (covered in Custom Validation Rules), after-validation hooks (covered in After Validation Hooks).

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