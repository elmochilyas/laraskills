# Decomposition: After Validation Hooks

## Topic Overview
withValidator, passedValidation, failedValidation callbacks — hooks for mutating the validator before validation runs, reacting to successful validation, and customizing validation failure responses.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
after-validation-hooks/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### After Validation Hooks
- **Purpose:** withValidator, after validation callbacks
- **Difficulty:** Advanced
- **Dependencies:** Form Request Fundamentals

## Dependency Graph
This KU depends on: Form Request Fundamentals. It also relates to Conditional Validation and Input Preparation for complementary hooks.

## Boundary Analysis
**In scope:** withValidator() for cross-field rules and dynamic rule adding, Validator::after() callbacks, passedValidation() for audit logging, failedValidation() for custom error responses, hook execution order in validateResolved(), after() callback queue, after() vs custom validation rule comparison.
**Out of scope:** Conditional rules like required_if (covered in Conditional Validation), input preparation (covered in Input Preparation), Form Request pipeline basics (covered in Form Request Fundamentals).

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