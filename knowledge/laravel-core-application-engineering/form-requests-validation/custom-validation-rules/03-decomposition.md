# Decomposition: Custom Validation Rules

## Topic Overview
Custom Rule classes implementing ValidationRule — invokable rule objects (preferred), Closure rules (quick inline), and legacy Validator::extend() for application-specific validation constraints.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
custom-validation-rules/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Custom Validation Rules
- **Purpose:** Custom Rule classes and Rule objects
- **Difficulty:** Intermediate
- **Dependencies:** Validation Rule Patterns

## Dependency Graph
This KU depends on: Validation Rule Patterns. It builds on understanding of rule syntax and parsing.

## Boundary Analysis
**In scope:** Invokable rule classes (ValidationRule interface), InvokableValidationRule wrapper, Closure rules, legacy Validator::extend(), constructor injection for dynamic rules, naming conventions (app/Rules/), stateless design constraint, database query caching in rules, error message localization.
**Out of scope:** Conditional validation (covered in Conditional Validation), after-validation hooks (covered in After Validation Hooks), string vs array syntax (covered in Validation Rule Patterns).

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