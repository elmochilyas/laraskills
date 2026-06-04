# Skill: Implement the Prototype Pattern

## Purpose

Create new objects by cloning an existing object (prototype) rather than instantiating new classes.

## When To Use

- Creating many similar objects with minor differences
- When object creation is expensive and cloning is cheaper
- Hiding complex construction logic from clients

## When NOT To Use

- Simple `new` instantiation is adequate
- When deep cloning complexity outweighs benefit

## Prerequisites

- Object cloning understanding (PHP `clone` keyword)

## Workflow

1. Identify objects that are expensive to create
2. Make the class implement `Cloneable` or provide a `clone` method
3. Create a prototype instance with default state
4. Clone the prototype for each new instance needed
5. Customize the cloned instance as needed

## Related Skills

- Implement Factory Method Pattern
- Implement Builder Pattern
- Apply Creator GRASP Pattern
