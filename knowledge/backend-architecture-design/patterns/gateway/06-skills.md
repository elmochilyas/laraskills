# Skill: Implement the Gateway Pattern

## Purpose

Wrap access to an external system or resource behind a simple, stable interface.

## When To Use

- Accessing external APIs, databases, or file systems
- Wrapping complex subsystems behind a simplified interface
- Decoupling domain code from infrastructure details

## When NOT To Use

- Direct access is simple and unlikely to change
- The gateway would be a thin wrapper with no added value

## Prerequisites

- Interface-based design
- Façade pattern understanding

## Workflow

1. Identify the external system or resource to wrap
2. Define a gateway interface in the domain/application layer
3. Implement the gateway in the infrastructure layer
4. The gateway encapsulates all communication details (HTTP, auth, parsing)
5. Clients depend only on the gateway interface

## Related Skills

- Implement Anti-Corruption Layer
- Design Hexagonal Architecture
- Apply Pure Fabrication GRASP Pattern
