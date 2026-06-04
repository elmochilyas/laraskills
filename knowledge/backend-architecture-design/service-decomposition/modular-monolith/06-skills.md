# Skill: Design a Modular Monolith as Starting Architecture

## Purpose

Build a single deployment unit with clear module boundaries, domain-aligned schemas, and well-defined interfaces — enabling future extraction to microservices if needed.

## When To Use

- Starting new projects (recommended default architecture)
- Reducing coupling in existing monolithic codebases
- Preparing for eventual microservices extraction

## When NOT To Use

- Simple CRUD applications where modules add unnecessary overhead
- When team is not ready for modular discipline

## Prerequisites

- Modular design principles
- Bounded context concepts

## Workflow

1. Organize code by domain/bounded context, not by technical layer
2. Each module has its own routes, controllers, models, services, and database tables
3. Define explicit interfaces between modules (no direct Eloquent model references)
4. Use events for cross-module communication
5. Enforce boundaries with automation (PHPStan, Deptrac, PHPArkitect)
6. Keep modules independently testable

## Related Skills

- Design Module Boundaries in Monoliths
- Assess Microservices Decomposition Threshold
- Design Service Boundaries in Distributed Systems
