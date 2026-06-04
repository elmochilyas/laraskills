# Skill: Apply the Protected Variations GRASP Pattern

## Purpose

Identify points of instability or variation and encapsulate them behind stable interfaces.

## When To Use

- Points where the system interacts with external systems
- Known variation points (different providers, evolving requirements)
- Unstable or frequently changing domain logic

## When NOT To Use

- When the variation is unlikely to ever occur (YAGNI)
- When the cost of the interface outweighs the risk of change

## Prerequisites

- Design pattern experience
- Understanding of system variation points

## Workflow

1. Identify predicted or potential variation points in the system
2. For each variation point, define a stable interface that encapsulates it
3. Ensure clients depend only on the stable interface, not the varying implementation
4. Implement concrete classes for each variation
5. Use a factory or DI to inject the appropriate implementation
6. Add new variations by implementing the interface, not modifying clients

## Related Skills

- Apply Polymorphism GRASP Pattern
- Implement Strategy Pattern
- Design Hexagonal Architecture Ports and Adapters
