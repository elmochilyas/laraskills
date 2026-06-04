# Skill: Implement the Data Mapper Pattern

## Purpose

Transfer data between domain objects and the database while keeping them independent of each other.

## When To Use

- Rich domain models that should not know about persistence
- Hexagonal/Clean architecture domain layers
- When ORM coupling (Active Record) is undesirable in domain logic

## When NOT To Use

- Simple CRUD where Eloquent's Active Record is adequate
- When the mapping overhead outweighs the benefit

## Prerequisites

- Domain model pattern
- Repository pattern
- ORM understanding

## Workflow

1. Define domain entities with no persistence awareness
2. Create mapper classes that translate between domain objects and database rows
3. Implement repository using the mapper for persistence operations
4. Handle identity map for avoiding duplicate objects
5. Keep mapping logic isolated in the infrastructure layer

## Related Skills

- Implement Repository Pattern
- Design Hexagonal Architecture
- Apply Identity Map Pattern
