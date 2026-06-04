# Skill: Implement the Strategy Pattern

## Purpose

Define a family of algorithms, encapsulate each one, and make them interchangeable at runtime.

## When To Use

- Multiple algorithms for the same task (discount calculation, tax strategy, shipping cost)
- When you want to select an algorithm at runtime
- Replacing long switch/if-else chains with polymorphic dispatch

## When NOT To Use

- Single algorithm with no variation
- When the conditionals are simple and stable

## Prerequisites

- Polymorphism and interface design

## Workflow

1. Identify the varying algorithm and define a Strategy interface
2. Create concrete strategy classes for each variation
3. The context class receives a strategy via constructor or setter
4. The context delegates to the strategy at the appropriate point
5. Strategies are interchangeable without modifying the context

## Related Skills

- Apply Polymorphism GRASP Pattern
- Apply Protected Variations GRASP Pattern
- Implement Template Method Pattern
