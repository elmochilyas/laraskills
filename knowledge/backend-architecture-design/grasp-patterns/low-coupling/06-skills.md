# Skill: Apply the Low Coupling GRASP Pattern

## Purpose

Design classes that have minimal dependencies on other classes, reducing change impact and improving reusability.

## When To Use

- Designing class interfaces and dependencies
- Refactoring highly-coupled classes
- Evaluating module boundaries
- Extracting services or libraries

## When NOT To Use

- When coupling is an accepted design tradeoff (framework internals)
- Orchestrator classes that naturally coordinate many services

## Prerequisites

- Coupling types understanding (content, common, data, stamp, control)
- Dependency Injection pattern

## Workflow

1. Identify a class's current dependencies (constructor injection, static calls, globals)
2. Classify each dependency by coupling type (data coupling is best, content is worst)
3. Replace static/global dependencies with injected interfaces
4. Remove unnecessary dependencies by separating concerns
5. Ensure the class depends on abstractions, not concretions
6. Apply Law of Demeter to reduce method chaining

## Related Rules (from 05-rules.md)

- Rule 5 (Coupling): Use the Law of Demeter to reduce coupling depth
- Rule 1 (Coupling): Prefer content coupling -> stamp coupling -> data coupling

## Related Skills

- Measure and Reduce Coupling
- Apply Indirection GRASP Pattern
- Apply High Cohesion GRASP Pattern
