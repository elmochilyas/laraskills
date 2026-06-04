# Decomposition: Conditional Validation

## Topic Overview
Declarative rules (required_if, required_with, prohibited_if, exclude_if), the sometimes() method, and ConditionalRules class for applying validation rules selectively based on field state or external conditions.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
conditional-validation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Conditional Validation
- **Purpose:** sometimes, required_if, required_with rules
- **Difficulty:** Advanced
- **Dependencies:** Validation Rule Patterns

## Dependency Graph
This KU depends on: Validation Rule Patterns. It also relates to After Validation Hooks for withValidator() patterns.

## Boundary Analysis
**In scope:** Declarative conditional rules (required_if, prohibited_if, exclude_if, required_with, required_unless), sometimes() method, ConditionalRules class, withValidator() for complex conditions, database-driven conditional rules, cross-field validation, pre-validation vs during-validation evaluation.
**Out of scope:** Custom rule classes (covered in Custom Validation Rules), after() callbacks (covered in After Validation Hooks), input preparation (covered in Input Preparation).

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