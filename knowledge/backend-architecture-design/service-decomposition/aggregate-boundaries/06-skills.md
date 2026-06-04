# Skill: Decompose Services Using Aggregate Boundaries

## Purpose

Use DDD aggregate roots as natural service decomposition units, ensuring each service owns a complete consistency boundary.

## When To Use

- Identifying service boundaries from domain aggregates
- Designing microservices or modular monolith modules
- Determining transaction scope per service

## When NOT To Use

- Simple CRUD with no aggregate invariants
- When aggregates are not well-understood or defined

## Prerequisites

- DDD tactical aggregates
- Transaction boundary understanding

## Workflow

1. Identify aggregates from domain analysis (event storming, domain expert interviews)
2. Define aggregate root and its invariant rules
3. Ensure aggregate communicates with other aggregates only via domain events (not direct references)
4. Map each aggregate to a service or module boundary
5. Verify that cross-aggregate operations use eventual consistency

## Related Skills

- Identify Bounded Contexts
- Design Data Ownership Boundaries
- Design Module Boundaries in Monoliths
