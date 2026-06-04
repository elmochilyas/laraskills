# Skill: Implement the Layer Supertype Pattern

## Purpose

Provide a common base class for all objects in a layer that encapsulates shared behavior (identity, timestamps, equality).

## When To Use

- Multiple classes in the same layer share common behavior
- Centralizing cross-cutting behavior (timestamps, versioning)
- Framework base classes (Eloquent Model is a layer supertype)

## When NOT To Use

- When inheritance forces coupling to concerns not shared by all subclasses
- When composition would be more appropriate

## Prerequisites

- Inheritance and polymorphism understanding
- Layer architecture knowledge

## Workflow

1. Identify common behavior across classes in a layer (e.g., all entities have an ID and timestamps)
2. Create a base class encapsulating this shared behavior
3. Have all classes in the layer extend the base class
4. Keep the base class focused on genuine commonalities, not speculative features
5. Avoid deep inheritance hierarchies (max 2-3 levels)

## Related Skills

- Apply Creator GRASP Pattern
- Implement Domain Model Pattern
- Apply High Cohesion GRASP Pattern
