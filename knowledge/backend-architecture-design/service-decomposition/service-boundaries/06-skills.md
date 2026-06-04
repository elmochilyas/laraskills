# Skill: Design Service Boundaries in Distributed Systems

## Purpose

Define ownership scope, data boundaries, and communication contracts for each service to create autonomous, loosely coupled services that avoid distributed monolith anti-patterns.

## When To Use

- Designing microservice boundaries
- Reviewing existing service decomposition for coupling issues
- Avoiding distributed monolith anti-pattern

## When NOT To Use

- Before understanding business domain and bounded contexts
- For applications that don't need distributed systems complexity

## Prerequisites

- Bounded context identification
- Aggregate design

## Workflow

1. Align service boundaries with business capabilities or DDD subdomains
2. Each service owns its data exclusively (no shared databases)
3. Design asynchronous communication for cross-service interactions
4. Add anti-corruption layers at each service boundary
5. Validate: can this service operate autonomously? Can we deploy it independently?
6. Minimize network calls — chatty services indicate wrong boundaries

## Related Skills

- Decompose by Business Capability
- Design Data Ownership Boundaries
- Apply Anti-Corruption Layer Pattern
