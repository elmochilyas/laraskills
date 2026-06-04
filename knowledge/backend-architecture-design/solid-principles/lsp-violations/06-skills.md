# Skill: Detect and Fix Liskov Substitution Principle Violations

## Purpose

Ensure subtypes are substitutable for their base types without altering program correctness, preventing runtime surprises from inheritance misuse.

## When To Use

- Extending base classes or implementing interfaces
- Overriding methods with different preconditions, postconditions, or exceptions
- Code reuse through inheritance (check substitutability)

## When NOT To Use

- When composition is used instead of inheritance (avoids LSP issues)
- When inheritance depth is limited to 1-2 levels

## Prerequisites

- Inheritance and polymorphism
- Design by Contract concepts

## Workflow

1. Check overridden methods: they must not strengthen preconditions, weaken postconditions, or throw new exception types
2. Verify base class invariants are preserved by the subtype
3. Ensure the subtype's interface contract is compatible with the base type
4. Replace inheritance with composition when substitutability cannot be guaranteed
5. Use PHPStan static analysis to detect type compatibility violations

## Related Skills

- Apply Polymorphism GRASP Pattern
- Detect OCP Violations
- Detect ISP Violations
