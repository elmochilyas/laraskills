# Skill: Implement the Factory Method Pattern

## Purpose

Define an interface for creating an object, but let subclasses decide which class to instantiate.

## When To Use

- A class can't anticipate the class of objects it must create
- Subclasses need to specify the objects they create
- Encapsulating complex creation logic in a dedicated method

## When NOT To Use

- Simple `new` instantiation suffices
- When the creation logic doesn't vary

## Prerequisites

- Polymorphism and inheritance

## Workflow

1. Identify object creation that varies or is complex
2. Declare a factory method (abstract or virtual) in the base class
3. Override the factory method in subclasses to create specific objects
4. The base class uses the factory method without knowing the concrete class

## Related Skills

- Implement Abstract Factory Pattern
- Implement Builder Pattern
- Apply Creator GRASP Pattern
