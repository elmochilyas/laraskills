# Skill: Implement the Template Method Pattern

## Purpose

Define the skeleton of an algorithm in a base class, letting subclasses override specific steps without changing the algorithm's structure.

## When To Use

- Multiple implementations share the same algorithm structure but vary in specific steps
- Framework hook methods where subclasses customize behavior
- When you want to enforce an algorithm's structure across implementations

## When NOT To Use

- When the algorithm steps vary completely between implementations (use Strategy)
- Inheritance depth causes rigidity

## Prerequisites

- Inheritance and method overriding
- Abstract class design

## Workflow

1. Define the algorithm skeleton as a template method in an abstract base class
2. Declare abstract methods for steps that vary
3. Implement common steps in the base class
4. Subclasses override only the varying steps
5. Subclasses cannot change the algorithm's overall structure

## Related Skills

- Implement Strategy Pattern
- Apply Polymorphism GRASP Pattern
- Apply Creator GRASP Pattern
