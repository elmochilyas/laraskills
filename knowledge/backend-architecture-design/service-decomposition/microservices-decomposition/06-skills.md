# Skill: Assess Microservices Decomposition Threshold

## Purpose

Evaluate organizational, technical, and domain factors to determine whether a monolith should be split into microservices, following "monolith first, extract later."

## When To Use

- Evaluating whether to adopt microservices
- Planning incremental extraction from a modular monolith
- Debating monolith vs microservices architecture

## When NOT To Use

- For new projects that should start as modular monoliths
- Without understanding bounded contexts and domain boundaries

## Prerequisites

- Modular monolith as starting architecture
- Bounded context identification

## Workflow

1. Start with a well-structured modular monolith
2. Assess organizational readiness: team size (2-pizza rule), Conway's Law alignment
3. Assess technical need: deployment frequency conflicts, independent scaling requirements
4. Assess domain stability: only extract stable bounded contexts
5. Extract incrementally using strangler fig pattern, one module at a time

## Related Skills

- Apply Strangler Fig Pattern
- Design Modular Monolith as Starting Architecture
- Design Service Boundaries in Distributed Systems
