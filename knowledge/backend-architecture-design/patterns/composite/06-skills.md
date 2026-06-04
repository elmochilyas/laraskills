# Skill: Implement the Composite Pattern

## Purpose

Compose objects into tree structures to represent part-whole hierarchies, allowing clients to treat individual objects and compositions uniformly.

## When To Use

- Tree-like structures (menu systems, file systems, organizational charts)
- When clients should treat leaf and composite objects identically
- Recursive containment hierarchies

## When NOT To Use

- Flat structures without hierarchy
- When the uniform treatment of leaves and composites is not needed

## Prerequisites

- Recursive data structures understanding

## Workflow

1. Define a component interface for both leaf and composite objects
2. Create leaf classes that implement the component interface directly
3. Create a composite class that holds child components (leaf or composite)
4. Composite implements component operations by delegating to children
5. Clients interact with all objects through the component interface

## Related Skills

- Apply Polymorphism GRASP Pattern
- Implement Decorator Pattern
- Apply Creator GRASP Pattern
