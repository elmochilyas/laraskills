# Skill: Apply the Polymorphism GRASP Pattern

## Purpose

Use polymorphic operations to handle variations in behavior based on type, avoiding conditional logic.

## When To Use

- Multiple variants of a behavior based on object type
- Replacing switch/if-else chains that dispatch on type
- When new variation types need to be added without changing existing code

## When NOT To Use

- Simple conditionals with few and stable variants
- When the variation is better expressed as data, not types

## Prerequisites

- Polymorphism and inheritance understanding
- Strategy or State pattern knowledge

## Workflow

1. Identify conditional logic that dispatches on a type indicator (switch on type field)
2. Define a common interface or abstract base class
3. Create concrete subclasses for each variant
4. Move variant-specific behavior into each subclass
5. Replace the conditional with a polymorphic call
6. Use a factory or registry to map type to implementation

## Related Skills

- Apply Protected Variations GRASP Pattern
- Implement Strategy Pattern
- Apply Information Expert GRASP Pattern
