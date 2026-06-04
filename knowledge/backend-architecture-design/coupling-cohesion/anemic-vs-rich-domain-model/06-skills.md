# Skill: Design a Rich Domain Model

## Purpose

Create domain entities that encapsulate business behavior and invariants, avoiding anemic property-bag objects with logic scattered in services.

## When To Use

- Complex business logic with state transitions and invariants
- Domain-Driven Design projects
- Systems where business rules change frequently
- Codebases where service classes have grown too large

## When NOT To Use

- Simple CRUD operations (anemic models are acceptable here)
- CQRS read models (intentionally anemic for performance)
- Data transfer objects and query results

## Prerequisites

- Domain model pattern understanding
- Encapsulation and information expert principles
- Value object vs entity distinction

## Inputs

- Domain requirements and business rules
- Entity definitions with state and behavior
- Aggregate boundaries

## Workflow

1. Identify domain entities and their stateful properties
2. Define value objects for primitive types (Email, Money, OrderStatus)
3. Add intent-revealing methods to entities (approve(), cancel(), canBeCancelled())
4. Enforce invariants inside entity methods (not in services)
5. Keep persistence logic outside entities (repository saves, not entity saves)
6. Use domain services only for cross-aggregate coordination
7. Write unit tests against domain behavior (state transitions, invariants), not getter values
8. Start simple and enrich deliberately — avoid upfront over-engineering

## Validation Checklist

- [ ] Every entity has at least one meaningful business method
- [ ] Getters are read-only; setters are replaced by behavior methods
- [ ] Business rules involving single aggregate data live on that aggregate
- [ ] Persistence logic is not inside domain entities
- [ ] Tests verify state transitions and invariant enforcement, not property values
- [ ] Intent-revealing interfaces (canBeCancelled(), markAsShipped()) replace raw property checks

## Common Failures

- Anemic models with all logic in services (procedural code in OOP)
- Rich models with persistence concerns (Active Record coupling)
- Overcorrecting: forcing behaviors that don't belong on models
- All-or-nothing thinking (some areas benefit from anemic models)
- Eloquent dual role confusion (domain object vs persistence object)

## Decision Points

- Which behavior belongs on the entity vs a domain service?
- When to introduce value objects vs using primitives?
- How to handle Eloquent's Active Record nature in rich models?

## Performance Considerations

- Rich models may use more memory due to embedded value objects
- Lazy-load expensive computations inside domain methods
- Keep domain methods focused on invariants, not performance optimization

## Security Considerations

- Domain invariants prevent invalid state transitions (security by design)
- Never expose mutable properties; always use behavior methods

## Related Rules (from 05-rules.md)

- Rule 1: Never allow domain entities to be property bags with zero behavior
- Rule 2: Keep domain logic inside the model, not in application services
- Rule 3: Expose intent-revealing interfaces, not property getters
- Rule 4: A rich model does not mean every object must be complex
- Rule 5: Write unit tests against domain behavior, not against getter values

## Related Skills

- Detect and Refactor God Classes
- Measure Cohesion Types
- Apply Information Expert GRASP Pattern

## Success Criteria

- All business rules involving a single aggregate are tested via entity methods
- Services orchestrate; entities decide
- Changing business rules changes entity methods, not service logic
