# Skill: Detect and Fix Dependency Inversion Principle Violations

## Purpose

Ensure high-level modules depend on abstractions owned by the high-level module, not on low-level concrete implementations.

## When To Use

- When domain services directly use Eloquent models or facades
- When business logic calls static methods on infrastructure classes
- When testing requires swapping implementations but code is hard-wired to concretions

## When NOT To Use

- Simple CRUD with no domain logic (DIP adds unnecessary abstraction)
- When the abstraction varies less than the concrete class itself

## Prerequisites

- Dependency injection concepts
- Interface design

## Workflow

1. Identify DIP violations: Eloquent model usage in domain services, `Facade::` calls in business logic, direct third-party SDK usage
2. Define an interface in the domain/application layer (owned by the high-level module)
3. Create a concrete implementation in the infrastructure layer
4. Register the binding in the service container
5. Inject the interface — not the concrete class — into the consumer

## Related Skills

- Apply Pure Fabrication GRASP Pattern
- Apply Indirection GRASP Pattern
- Design Hexagonal Architecture
