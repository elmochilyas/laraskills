# Skill: Implement the Registry Pattern

## Purpose

Provide a centralized, well-known object for accessing shared services or data across an application.

## When To Use

- Accessing application-wide services without passing them through every level
- Laravel's service container acts as a registry
- When dependency injection is not feasible (legacy code)

## When NOT To Use

- As a substitute for proper dependency injection
- When global mutable state causes testing difficulties

## Prerequisites

- Service container understanding
- Dependency injection vs service locator tradeoffs

## Workflow

1. Determine what needs global access (services, configuration, connections)
2. Create a registry class or use the service container
3. Register instances at application startup
4. Access instances through the registry when needed
5. Use the registry sparingly — prefer DI for most cases

## Related Skills

- Design Hexagonal Architecture
- Implement Service Layer Pattern
- Apply Singleton Pattern
