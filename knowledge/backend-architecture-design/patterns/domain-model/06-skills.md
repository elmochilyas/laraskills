# Skill: Implement the Domain Model Pattern

## Purpose

Create an object model of the domain that incorporates both data and behavior, representing business rules explicitly.

## When To Use

- Complex business logic with rules, validations, and computations
- Domain-Driven Design projects
- Systems where business rules change frequently

## When NOT To Use

- Simple CRUD operations (Transaction Script is simpler)
- When the team is not familiar with OOP domain modeling

## Prerequisites

- Object-oriented design
- Rich domain model vs anemic domain model distinction

## Workflow

1. Identify domain concepts (entities, value objects, services)
2. Place business behavior on the entities and value objects they belong to
3. Enforce invariants in entity methods
4. Use domain services for cross-entity coordination
5. Keep persistence concerns outside the domain model
6. Write behavior-focused unit tests

## Related Skills

- Design a Rich Domain Model
- Apply Information Expert GRASP Pattern
- Implement Transaction Script Pattern
