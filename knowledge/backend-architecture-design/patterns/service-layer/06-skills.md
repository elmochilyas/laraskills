# Skill: Implement the Service Layer Pattern

## Purpose

Define an application boundary with a layer of service classes that coordinate use cases and transactions.

## When To Use

- Defining clear use case boundaries
- Coordinating multiple domain objects for a single operation
- Encapsulating transaction and security concerns

## When NOT To Use

- Simple CRUD where controllers can handle directly
- When service layer becomes a dumping ground for logic that belongs in domain

## Prerequisites

- Use case identification
- Transaction management understanding

## Workflow

1. Identify application use cases (user stories, features)
2. Create a service class per use case group or individual use case
3. Services orchestrate domain objects, not implement domain logic
4. Handle transactions, security checks, and logging at the service level
5. Keep services thin — delegate business decisions to domain objects
6. Inject repositories and domain services into application services

## Related Skills

- Design a Rich Domain Model
- Implement Transaction Script Pattern
- Apply Controller GRASP Pattern
