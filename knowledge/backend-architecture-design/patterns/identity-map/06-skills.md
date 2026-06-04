# Skill: Implement the Identity Map Pattern

## Purpose

Ensure each database row is loaded only once per transaction, avoiding duplicate in-memory objects.

## When To Use

- ORM-based applications experiencing duplicate object issues
- Long-running transactions with repeated object access
- When object identity consistency is critical

## When NOT To Use

- Read-only queries where identity doesn't matter
- Short request lifecycle where duplicate objects aren't an issue

## Prerequisites

- Object-relational mapping understanding
- Unit of Work pattern knowledge

## Workflow

1. Create an identity map (typically a map keyed by class and primary key)
2. Before loading from DB, check the identity map first
3. If found, return the cached object (no DB call)
4. If not found, load from DB and store in the identity map
5. Ensure all writes go through the same identity map
6. Clear the identity map at the end of the unit of work

## Related Skills

- Implement Unit of Work Pattern
- Implement Repository Pattern
- Apply Data Mapper Pattern
