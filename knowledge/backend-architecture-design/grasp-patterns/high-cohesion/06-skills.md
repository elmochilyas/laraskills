# Skill: Apply the High Cohesion GRASP Pattern

## Purpose

Keep objects focused and understandable by ensuring each class has closely related responsibilities.

## When To Use

- Designing class responsibilities
- Refactoring classes with multiple unrelated concerns
- Evaluating class design during code review

## When NOT To Use

- Facade classes designed to orchestrate (intentionally low cohesion)
- Infrastructure classes with naturally multiple dependencies

## Prerequisites

- SRP understanding
- Cohesion measurement

## Workflow

1. Identify all responsibilities of a class
2. Evaluate if they form a single, focused purpose
3. Split unrelated responsibilities into separate classes
4. Target LCOM4 = 1 for each class
5. Verify coupling does not increase excessively after splitting

## Related Rules (from 05-rules.md)

- Rule 1 (Cohesion): Keep LCOM4 at 1 for non-infrastructure classes
- Rule 3 (Cohesion): Use the Single Responsibility Prompt test
- Rule 5 (Cohesion): Do not sacrifice coupling quality to improve cohesion artificially

## Related Skills

- Measure Cohesion Types
- Apply Low Coupling GRASP Pattern
- Detect and Refactor God Classes
