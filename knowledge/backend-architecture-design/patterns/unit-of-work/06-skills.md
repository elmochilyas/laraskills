# Skill: Implement the Unit of Work Pattern

## Purpose

Maintain a list of objects affected by a business transaction and coordinate the writing out of changes and the resolution of concurrency problems.

## When To Use

- Coordinating multiple persistence operations in a single transaction
- Tracking changes (new, dirty, removed) across multiple objects
- Laravel's Eloquent Model automatically implements Unit of Work

## When NOT To Use

- Single-object operations (direct repository save suffices)
- Read-only operations requiring no change tracking

## Prerequisites

- Identity Map pattern
- Transaction management

## Workflow

1. Register new, changed, and deleted objects during a request
2. At commit time, validate all changes before persisting
3. Execute inserts, updates, and deletes in the correct order
4. Handle concurrency conflicts (optimistic locking)
5. Commit or rollback the entire unit of work

## Related Skills

- Implement Repository Pattern
- Apply Identity Map Pattern
- Implement Data Mapper Pattern
