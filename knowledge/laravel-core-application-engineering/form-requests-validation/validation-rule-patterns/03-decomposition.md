# Decomposition: Validation Rule Patterns

## Topic Overview
String vs array syntax, common rule combinations — how ValidationRuleParser transforms human-readable rules into validation constraints, Rule::unique(), Rule::exists(), bail, and stopOnFirstFailure.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
validation-rule-patterns/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Validation Rule Patterns
- **Purpose:** String vs array syntax, common rule combinations
- **Difficulty:** Intermediate
- **Dependencies:** Form Request Fundamentals

## Dependency Graph
This KU depends on: Form Request Fundamentals. It serves as prerequisite for Custom Validation Rules and Conditional Validation.

## Boundary Analysis
**In scope:** String vs array syntax parsing, ValidationRuleParser internals, Rule::unique() and Rule::exists(), bail and stopOnFirstFailure, wildcard rule expansion, rule ordering conventions, regex rule special case, unique ignore on updates.
**Out of scope:** Custom rule classes (covered in Custom Validation Rules), conditional rules like required_if (covered in Conditional Validation), Form Request pipeline mechanics (covered in Form Request Fundamentals).

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