# Skill: Detect and Refactor God Classes

## Purpose

Identify classes that have accumulated too many responsibilities and incrementally extract them into focused, cohesive classes.

## When To Use

- Eloquent models with hundreds of lines and unrelated methods
- Classes that change for multiple different reasons
- Classes with LCOM4 > 2 indicating low cohesion
- "Manager" or "Service" classes that seem to do everything

## When NOT To Use

- Facade classes that deliberately delegate (not implement) multiple services
- DTOs and value objects that intentionally carry data
- Controllers that orchestrate but don't implement business logic

## Prerequisites

- SRP understanding
- Cohesion measurement tooling (LCOM4)
- Refactoring skills (extract class, extract method)

## Inputs

- Source code of suspected god class
- LCOM4 metric report
- Team knowledge of which responsibilities exist

## Workflow

1. Identify the god class: > 200 lines, > 5 public methods, or LCOM4 > 2
2. Apply the "why would this change?" test: list all possible change reasons
3. Apply the one-sentence test: describe the class without using "and"
4. Identify disjoint field groups used by different method subsets
5. Extract methods/classes one at a time using Tease Apart Inheritance
6. Prefer delegation over inheritance when extracting
7. Keep tests passing after each extraction step
8. Convert extracted classes to constructor-injected dependencies

## Validation Checklist

- [ ] God class identified by size, method count, or LCOM4
- [ ] Multiple change reasons documented
- [ ] Disjoint field groups extracted to separate classes
- [ ] Each extraction step preserves passing tests
- [ ] Delegation used instead of inheritance from god class
- [ ] Post-refactoring LCOM4 is 1 for each extracted class
- [ ] No single class exceeds 200 lines after extraction

## Common Failures

- Big-bang refactoring of god class (error-prone, often abandoned)
- Inheriting from god class instead of delegating
- Extracting without tests (breaking functionality)
- All-or-nothing thinking (partial extraction is progress)
- Creating new god classes by merging extracted pieces

## Decision Points

- Extract method first or extract class first?
- Which responsibility to extract first? (most isolated, easiest to test)
- How to handle shared state between extracted classes?

## Performance Considerations

- Extracted classes may increase object graph size
- Constructor injection of many small classes may increase instantiation time
- Balance granularity with reasonable number of collaborators (max 5-7)

## Security Considerations

- Extracted security logic must remain intact; never split auth checks across classes
- Ensure extracted classes don't bypass previously centralized security gates

## Related Rules (from 05-rules.md)

- Rule 1: Split any class whose single-responsibility description requires "and"
- Rule 2: Extract data groups from god classes into dedicated value objects or models
- Rule 3: Use the "why would this change?" test to identify god class boundaries
- Rule 4: Break god classes incrementally — Tease Apart Inheritance pattern
- Rule 5: Prefer delegation over inheritance when extracting from a god class

## Related Skills

- Measure Cohesion Types
- Design a Rich Domain Model
- Measure and Reduce Coupling

## Success Criteria

- Each class has exactly one reason to change
- No class exceeds 200 lines
- LCOM4 is 1 for all extracted classes
- Tenure of extraction: weeks, not months
