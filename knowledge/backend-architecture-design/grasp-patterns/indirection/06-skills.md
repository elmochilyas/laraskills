# Skill: Apply the Indirection GRASP Pattern

## Purpose

Use an intermediate object to mediate between components, reducing direct coupling.

## When To Use

- Reducing direct coupling between two components
- Supporting multiple variations of a service
- When a stable interface is needed between volatile components

## When NOT To Use

- Direct communication is simpler and adequate
- The intermediary doesn't add value beyond forwarding

## Prerequisites

- Interface-based design
- Mediator pattern understanding

## Workflow

1. Identify two components that would be tightly coupled if connected directly
2. Introduce an intermediate interface/class between them
3. The first component communicates only with the intermediary
4. The intermediary handles the interaction with the second component
5. Additional intermediaries can be added without affecting the first component

## Related Skills

- Apply Pure Fabrication GRASP Pattern
- Apply Low Coupling GRASP Pattern
- Implement Adapter Pattern
