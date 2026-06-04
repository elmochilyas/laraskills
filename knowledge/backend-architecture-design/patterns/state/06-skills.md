# Skill: Implement the State Pattern

## Purpose

Allow an object to alter its behavior when its internal state changes, appearing to change its class.

## When To Use

- Objects with complex state-dependent behavior (Order status, Document workflow)
- State transition logic that would otherwise require large conditionals
- When new states need to be added without modifying existing code

## When NOT To Use

- Simple boolean flags (overkill)
- Few states with simple transitions

## Prerequisites

- Polymorphism understanding
- Finite state machine concepts

## Workflow

1. Identify objects with state-dependent behavior
2. Define a State interface with methods representing state-dependent behavior
3. Create concrete state classes for each state
4. The context object delegates to the current state object
5. State objects transition to the next state by setting the context's state reference

## Related Skills

- Apply Polymorphism GRASP Pattern
- Implement Strategy Pattern
- Design a Rich Domain Model
