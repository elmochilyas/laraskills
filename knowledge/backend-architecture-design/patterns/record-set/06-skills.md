# Skill: Implement the Record Set Pattern

## Purpose

Represent tabular data from a database as an in-memory collection with filtering, sorting, and pagination capabilities.

## When To Use

- Returning query results as collections (Laravel Collections are record sets)
- In-memory data manipulation after database retrieval
- When a flexible, iterable result representation is needed

## When NOT To Use

- Single-record lookups (use specific DTO or entity)
- When lazy evaluation causes unexpected query execution

## Prerequisites

- Collection/array manipulation patterns
- Database query results understanding

## Workflow

1. Return query results as a Record Set (Illuminate\Support\Collection or custom)
2. Support chaining of filtering, sorting, and mapping operations
3. Keep the record set lazy where possible (deferred execution)
4. Provide pagination support for large result sets
5. Convert to specific types (arrays, custom DTOs) when leaving the data layer

## Related Skills

- Implement Data Mapper Pattern
- Implement Repository Pattern
- Apply Gateway Pattern
