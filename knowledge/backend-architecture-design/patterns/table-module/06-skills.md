# Skill: Implement the Table Module Pattern

## Purpose

Handle business logic for all rows in a database table through a single class instance.

## When To Use

- Simple business logic where a domain model would be overkill
- Data-centric applications with simple validation rules
- When the application logic matches table structure closely

## When NOT To Use

- Complex business logic with state transitions and invariants (use Domain Model)
- Object-oriented design where behavior belongs on individual records

## Prerequisites

- Record Set pattern
- Business logic organization understanding

## Workflow

1. Identify a database table with related business operations
2. Create a Table Module class with methods for each operation (find, validate, calculate)
3. The module works with record sets (multiple rows), not single instance
4. Keep validation and computation logic in the table module
5. Transform data through the module before output

## Related Skills

- Implement Transaction Script Pattern
- Implement Domain Model Pattern
- Implement Record Set Pattern
