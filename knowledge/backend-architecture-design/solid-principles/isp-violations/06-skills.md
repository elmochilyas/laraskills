# Skill: Detect and Fix Interface Segregation Principle Violations

## Purpose

Split large "fat" interfaces into smaller, role-specific interfaces so that clients depend only on methods they use.

## When To Use

- Monolithic repository interfaces with unrelated methods (find, save, export, search)
- Interfaces with empty or throwing method implementations
- Multiple clients depending on the same interface but using different subsets

## When NOT To Use

- When clients genuinely need all methods on an interface
- Interface explosion: one interface per method (over-segregation)

## Prerequisites

- Interface basics in PHP
- Role interface concept

## Workflow

1. Identify interfaces where implementors throw `BadMethodCallException` or have empty methods
2. Group methods by role/client concern (read vs write vs search vs export)
3. Split the interface into role-specific interfaces
4. Use interface composition for implementors that need multiple roles
5. Clients depend only on the interface for their specific role

## Related Skills

- Apply Low Coupling GRASP Pattern
- Apply High Cohesion GRASP Pattern
- Detect SRP Violations
