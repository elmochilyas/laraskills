# Skill: Implement the Builder Pattern

## Purpose

Separate the construction of a complex object from its representation, allowing the same construction process to create different representations.

## When To Use

- Objects with many optional constructor parameters (fluent builders)
- Creating complex aggregates step by step
- When the construction process should be separated from the product's representation

## When NOT To Use

- Simple objects with few parameters
- When constructor injection with named parameters is sufficient

## Prerequisites

- Fluent interface design

## Workflow

1. Identify a complex object with many optional configuration parameters
2. Create a Builder class with methods for each configurable aspect
3. Each builder method returns `$this` for method chaining
4. Provide a `build()` method that returns the constructed object
5. Optionally, create a Director class that pre-defines common construction recipes

## Related Skills

- Implement Abstract Factory Pattern
- Implement Factory Method Pattern
- Apply Creator GRASP Pattern
