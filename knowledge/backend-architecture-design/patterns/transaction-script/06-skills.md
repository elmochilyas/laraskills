# Skill: Implement the Transaction Script Pattern

## Purpose

Organize business logic as a single procedure for each use case, making simple applications straightforward.

## When To Use

- Simple business logic that doesn't warrant a domain model
- CRUD operations with minimal rules
- When team is not familiar with OOP domain modeling

## When NOT To Use

- Complex business logic with invariants and state transitions (prefer Domain Model)
- Systems where business rules change frequently and need clear organization

## Prerequisites

- Use case identification
- Procedural programming understanding

## Workflow

1. Identify each use case as a single procedure
2. Create a class with a method for each use case
3. The procedure retrieves data, processes it, and saves results
4. Keep the transaction boundary clear (success -> commit, failure -> rollback)
5. Extract repeated logic into shared private methods or helper classes

## Related Skills

- Implement Domain Model Pattern
- Implement Service Layer Pattern
- Implement Table Module Pattern
