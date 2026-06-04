# Skill: Implement the Repository Pattern

## Purpose

Mediate between the domain and data mapping layers using a collection-like interface for accessing domain objects.

## When To Use

- Hexagonal/Clean architecture (repository is a port)
- Complex query logic that should be encapsulated
- Multiple data sources needing a unified access interface
- Unit testing domain logic without database dependency

## When NOT To Use

- Simple CRUD without complex query logic (use Eloquent directly)
- When the abstraction adds no value (single source, simple queries)

## Prerequisites

- Domain model pattern
- Data Mapper or ORM knowledge
- Dependency injection

## Workflow

1. Define repository interface in the domain layer (e.g., OrderRepository)
2. Include methods: save, findById, find/by criteria, delete
3. Implement the interface in the infrastructure layer (EloquentOrderRepository)
4. Inject repository via constructor into application services
5. Keep query logic (filtering, sorting) in repository methods
6. Write integration tests for the repository implementation

## Related Rules (from 05-rules.md)

- Rule 2 (Hexagonal): Define ports (interfaces) in the domain layer, adapters in infrastructure
- Rule 3 (Clean): Outer circles must communicate via ports and adapters, not direct instantiation

## Related Skills

- Implement Data Mapper Pattern
- Design Hexagonal Architecture
- Implement Unit of Work Pattern
