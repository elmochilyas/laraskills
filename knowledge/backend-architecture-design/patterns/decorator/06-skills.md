# Skill: Implement the Decorator Pattern

## Purpose

Attach additional responsibilities to an object dynamically, providing a flexible alternative to subclassing for extending functionality.

## When To Use

- Adding optional behavior to objects (logging, caching, timing)
- When subclassing would lead to an explosion of classes
- When behavior needs to be added/removed at runtime

## When NOT To Use

- Simple fixed extensions (use inheritance)
- When the decorator chain becomes too complex to debug

## Prerequisites

- Composition and interface design

## Workflow

1. Define a component interface for the core functionality
2. Create concrete component classes that implement the interface
3. Create an abstract decorator class that also implements the interface and wraps a component
4. Create concrete decorator classes that add behavior before/after delegating
5. Stack decorators to compose desired functionality at runtime

## Related Skills

- Apply Indirection GRASP Pattern
- Apply Protected Variations GRASP Pattern
- Implement Chain of Responsibility Pattern
