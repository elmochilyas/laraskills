# Skill: Implement the Facade Pattern

## Purpose

Provide a unified interface to a set of interfaces in a subsystem, defining a higher-level interface that makes the subsystem easier to use.

## When To Use

- Exposing a simplified API for a complex subsystem
- Decoupling clients from complex subsystem dependencies
- Providing a single entry point for a module or library

## When NOT To Use

- When clients need fine-grained control over the subsystem
- When the subsystem is already simple enough

## Prerequisites

- Module/subsystem boundary understanding

## Workflow

1. Identify a complex subsystem with many classes and interactions
2. Define a facade class with simplified methods that clients need
3. The facade delegates to the appropriate subsystem classes
4. Clients interact only with the facade, not the subsystem
5. Optionally, advanced clients can still access the subsystem directly

## Related Skills

- Apply Indirection GRASP Pattern
- Apply Low Coupling GRASP Pattern
- Implement Service Layer Pattern
