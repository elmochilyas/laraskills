# Skill: Implement the Adapter Pattern

## Purpose

Convert the interface of a class into another interface clients expect, allowing classes to work together that couldn't otherwise due to incompatible interfaces.

## When To Use

- Integrating third-party libraries with incompatible interfaces
- Wrapping legacy code to work with modern interfaces
- Making existing classes conform to expected interfaces

## When NOT To Use

- When source code can be modified directly
- When you can use composition instead of wrapping

## Prerequisites

- Interface design understanding

## Workflow

1. Identify the client's target interface
2. Identify the adaptee with the incompatible interface
3. Create an adapter class that implements the target interface
4. The adapter wraps the adaptee and translates calls
5. Clients use the adapter through the target interface

## Related Skills

- Apply Indirection GRASP Pattern
- Implement Facade Pattern
- Apply Low Coupling GRASP Pattern
