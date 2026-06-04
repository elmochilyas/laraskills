# Skill: Define Module Boundaries in Monoliths

## Purpose

Define clear, domain-aligned internal module boundaries in a monolithic application that allow future extraction into services with minimal changes.

## When To Use

- Organizing a monolithic Laravel codebase by domain
- Preparing for future service extraction
- Enforcing separation of concerns in a single-deployment app

## When NOT To Use

- When application is too simple to benefit from module separation
- Premature perfect boundaries that cause costly refactoring later

## Prerequisites

- Modular design concepts
- Bounded context understanding

## Workflow

1. Group related domain logic into modules (bounded contexts)
2. Each module owns its Eloquent models, migrations, routes, and controllers
3. Define module interfaces (contracts) for cross-module communication
4. Never reference another module's models directly — use the interface
5. Enforce boundaries with automated tooling (Deptrac, PHPStan rules)
6. Keep shared kernel minimal to prevent coupling

## Related Skills

- Design Modular Monolith as Starting Architecture
- Design Service Boundaries in Distributed Systems
- Decompose by Business Capability
