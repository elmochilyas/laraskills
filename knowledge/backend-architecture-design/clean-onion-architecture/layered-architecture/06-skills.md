# Skill: Implement a Layered Architecture

## Purpose

Organize code into horizontal layers with strict dependency direction to separate concerns and improve testability.

## When To Use

- Default architecture for most Laravel applications
- Teams new to architectural patterns (simplest starting point)
- Applications where framework conventions align with layering

## When NOT To Use

- When business logic complexity demands strict boundary enforcement (prefer Hexagonal/Clean)
- When features need independent deployability (prefer Vertical Slices)
- When team can't maintain layer discipline without automation

## Prerequisites

- Separation of concerns understanding
- Basic knowledge of Presentation, Application, Domain, Infrastructure layers

## Inputs

- Application requirements and domain model
- Framework conventions (Laravel directory structure)
- Layer violation detection tooling (PHPStan, Deptrac)

## Workflow

1. Define four layers: Presentation, Application, Domain, Infrastructure
2. Enforce dependency direction: Presentation -> Application -> Domain -> Infrastructure
3. Isolate the Domain layer: zero framework or infrastructure imports
4. Keep business logic out of controllers (delegate to Application layer)
5. Handle cross-cutting concerns (logging, caching, transactions) as decorators in Infrastructure
6. Never bypass layers with "temporary" shortcuts
7. Use PHPStan/Deptrac to enforce layer boundaries in CI

## Validation Checklist

- [ ] Domain layer has zero framework imports (Eloquent, Request, DB, Cache)
- [ ] Controllers contain no business logic (only HTTP handling)
- [ ] Layer dependencies point strictly inward
- [ ] Cross-cutting concerns use decorator pattern, not domain mixins
- [ ] No layer-skipping shortcuts in the codebase
- [ ] CI enforces layer boundaries automatically

## Common Failures

- Domain layer depending on Eloquent/ORM (loses testability)
- Controllers containing business logic (not reusable across transports)
- Layer skipping as "temporary" shortcuts becoming permanent
- No automated enforcement (discipline degrades over time)

## Decision Points

- What layer owns DTOs and request/response objects?
- How to handle shared cross-cutting concerns across layers?
- When to evolve from Layered to Hexagonal or Clean Architecture?

## Performance Considerations

- Each layer crossing adds minor overhead; minimize in hot paths
- Fat controllers are slower to load; keep them thin
- Lazy-load domain services to reduce initialization cost

## Security Considerations

- Validation at Presentation layer boundaries
- Authorization checks at Application layer entry points
- Domain layer must not handle raw user input directly

## Related Rules (from 05-rules.md)

- Rule 1: Enforce strict layer dependency direction
- Rule 2: Isolate the Domain layer — zero framework or infrastructure imports
- Rule 3: Never put business logic in the Presentation layer
- Rule 4: Layer boundaries must be stable — no temporary shortcuts
- Rule 5: Handle cross-cutting concerns via infrastructure-layer decorators

## Related Skills

- Design a Hexagonal Architecture
- Implement Vertical Slice Architecture
- Apply the Dependency Inversion Principle

## Success Criteria

- Domain layer can be unit-tested without Laravel bootstrapping
- Changing framework or database does not affect domain logic
- Controllers can be replaced (API -> CLI) without changing business logic
