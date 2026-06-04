# Skill: Detect and Fix Open-Closed Principle Violations

## Purpose

Design classes that are open for extension (new behavior via new code) but closed for modification (existing code unchanged when adding variants).

## When To Use

- Switch/if-else chains on type fields that grow with each new variant
- Hardcoded driver or payment gateway selections
- When adding new behavior requires editing existing classes

## When NOT To Use

- When the variant count is small and stable (< 3 options)
- Premature abstraction before a second variant exists (YAGNI)

## Prerequisites

- Polymorphism and Strategy pattern

## Workflow

1. Identify conditional chains (switch/if-else on type) that grow with each new variant
2. Define an interface for the varying behavior
3. Extract each branch into its own class implementing the interface
4. Replace the conditional with polymorphic dispatch
5. Register new implementations without modifying the dispatching code (service container tags, config arrays)

## Related Skills

- Implement Strategy Pattern
- Apply Polymorphism GRASP Pattern
- Detect SRP Violations
