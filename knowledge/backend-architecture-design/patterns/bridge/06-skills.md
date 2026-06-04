# Skill: Implement the Bridge Pattern

## Purpose

Decouple an abstraction from its implementation so that the two can vary independently.

## When To Use

- When both the abstraction and implementation may have multiple variants
- Avoiding permanent binding between abstraction and implementation
- When changes to implementation should not affect client code

## When NOT To Use

- Only one variant of both abstraction and implementation exists
- Simple inheritance suffices

## Prerequisites

- Composition over inheritance understanding

## Workflow

1. Identify dimensions that vary independently (abstraction vs. implementation)
2. Define an implementation interface
3. Create concrete implementation classes
4. The abstraction holds a reference to the implementation interface
5. Clients configure the abstraction with the desired implementation

## Related Skills

- Apply Protected Variations GRASP Pattern
- Implement Adapter Pattern
- Apply Low Coupling GRASP Pattern
