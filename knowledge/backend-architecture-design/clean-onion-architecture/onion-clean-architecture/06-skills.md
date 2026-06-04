# Skill: Design a Clean Architecture Application

## Purpose

Organize concentric rings with inward-pointing dependencies so business logic is framework-independent and testable.

## When To Use

- Complex business logic requiring framework independence
- Applications that may need to swap infrastructure (database, UI, external services)
- Long-lived enterprise applications with evolving technology stacks
- Domain-Driven Design projects needing strict layer separation

## When NOT To Use

- Simple CRUD applications (added ceremony without benefit)
- Teams unfamiliar with DIP and dependency injection patterns
- Rapid prototyping where architecture is exploratory

## Prerequisites

- Dependency Inversion Principle
- Interface-based design
- Dependency injection container

## Inputs

- Domain model (entities, value objects)
- Use case specifications
- Infrastructure requirements (database, cache, mail)

## Workflow

1. Define concentric rings: Domain (innermost), Application, Infrastructure, Presentation (outermost)
2. Enforce dependency rule: inner rings never reference outer rings
3. Define repository interfaces (ports) in Domain; implement in Infrastructure
4. Inject dependencies through interfaces at boundaries, never direct instantiation
5. Keep domain entities pure (behavior + invariants only)
6. Use Application services for use-case orchestration
7. Wire ports to adapters in a single composition root (ServiceProvider)
8. Test Domain and Application layers with zero infrastructure dependencies

## Validation Checklist

- [ ] Domain core has zero imports from Laravel or any framework
- [ ] Repository interfaces defined in Domain, implementations in Infrastructure
- [ ] Application services depend only on ports, not concrete adapters
- [ ] All wiring happens in composition root (ServiceProvider)
- [ ] Domain tests run without database or HTTP
- [ ] No `new` or `resolve` for adapters outside composition root
- [ ] Use case classes don't call Eloquent directly

## Common Failures

- Inner ring depending on framework (violates dependency rule)
- Use cases calling Eloquent directly
- Entities with persistence annotations (know about database)
- Interfaces defined in Infrastructure (reversed direction)
- Over-compartmentalizing with empty use cases for simple CRUD

## Decision Points

- How many rings? (3-4 typical; more adds complexity)
- Where do DTOs live? (Application ring, not Domain)
- When is Clean Architecture worth the ceremony vs simpler layering?

## Performance Considerations

- Each ring crossing adds indirection; batch operations across rings
- Use lazy resolution for heavy adapters
- Profile hot paths before optimizing ring boundaries

## Security Considerations

- Input validation at the outermost ring (controllers)
- Authorization at the Application ring entry points
- Domain enforces invariants, not security concerns

## Related Rules (from 05-rules.md)

- Rule 1: Dependencies point inward — domain core must never reference outer layers
- Rule 2: Define repository interfaces in the domain, implement in infrastructure
- Rule 3: Outer circles must communicate via ports and adapters, not direct instantiation
- Rule 4: Keep domain entities pure and use application services for use-case orchestration
- Rule 5: Place all DI container configuration in a single composition root

## Related Skills

- Implement a Layered Architecture
- Design a Hexagonal Architecture
- Apply the Dependency Inversion Principle

## Success Criteria

- Domain logic can be tested without any framework bootstrapping
- Swapping database (Eloquent -> Doctrine) requires zero domain changes
- New delivery mechanism (CLI, API, queue consumer) adds only adapter code
