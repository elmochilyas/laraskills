# Skill: Apply Domain-Driven Design Tactical Patterns in Laravel

## Purpose
Model complex business domains using DDD tactical patterns — Aggregates, Entities, Value Objects, Domain Events, and Repositories — within Laravel's infrastructure capabilities.

## When To Use
- Business logic is complex with many interacting rules
- Domain experts are available for collaboration
- Codebase has long expected lifespan with evolving business rules
- Need to protect business invariants and enforce consistency boundaries

## When NOT To Use
- Simple CRUD with minimal business rules
- No domain expert collaboration available
- Team unfamiliar with DDD concepts and unable to invest in learning

## Prerequisites
- Understanding of Aggregates, Entities, Value Objects, Domain Events
- Clean Architecture or Hexagonal Architecture for layer separation
- PHP 8.1+ for readonly classes and typed properties
- Laravel event system (for Domain Event dispatching)

## Inputs
- Ubiquitous Language glossary (business terms)
- Identified Aggregates with their consistency boundaries
- Business invariants that must be enforced
- Current Eloquent models representing domain concepts

## Workflow
1. **Define the Ubiquitous Language glossary.** Document business terms with precise definitions. Use these terms in class names, method names, and variable names. Review with domain experts for accuracy.

2. **Implement Entities with identity.** Create Entity classes with `equals()` method comparing by identity. Use constructor for required properties. Entities have thread of identity throughout lifecycle.

3. **Implement Value Objects as immutable readonly classes.** Use PHP 8.1+ `readonly` classes. Include constructor validation to ensure the Value Object is always valid when instantiated. Implement `equals()` comparing by all properties.

4. **Design Aggregates.** Group Entities and Value Objects under an Aggregate Root. Enforce all business invariants through the Aggregate Root. Design consistency boundaries — modify Aggregate internals only through the Root. Keep Aggregates small.

5. **Implement Domain Events.** Create event classes for significant domain occurrences. Dispatch events inside Aggregate methods when state changes. Use past tense for event names (`InvoicePaid`, `OrderShipped`).

6. **Implement Repository ports for Aggregate persistence.** Create interfaces in the Domain layer for loading and persisting Aggregates. Repositories return Aggregate instances (not Eloquent models). One Repository per Aggregate Root.

7. **Create Infrastructure Repository implementations.** Implement Repository interfaces using Eloquent. Build explicit mappers between Eloquent models and Domain Aggregate/Entity/Value Objects.

## Validation Checklist
- [ ] Ubiquitous Language glossary is documented and shared
- [ ] Value Objects are readonly, immutable, and validate on construction
- [ ] Entities have identity comparison via `equals()` method
- [ ] Aggregates enforce invariants through Aggregate Root
- [ ] Aggregates are accessed only through Repository interface
- [ ] Domain Events are dispatched inside Aggregate methods
- [ ] Repositories return Domain objects, not Eloquent models
- [ ] No Laravel framework dependencies in Domain classes

## Common Failures
- **Anemic Domain Model.** Entities and Value Objects with getters/setters only, no behavior. Put business logic IN the domain objects, not in services.
- **Giant Aggregates.** Treating the entire database as one consistency boundary. Small Aggregates scale better and reduce contention.
- **Eloquent in Domain.** Using Eloquent models as domain objects. Eloquent models belong in Infrastructure; create separate Domain model classes.
- **Value Objects with identity.** Using Value Objects where identity tracking is needed (use Entity instead).
- **Commands disguised as events.** Domain Events should represent facts that happened, not commands to do something.

## Decision Points
- **Eloquent as Aggregate Root vs Separate Domain class?** Separate Domain Aggregate Root in Infrastructure projects; Eloquent AR only works for simple DDD where mapping overhead is justified.
- **Immediate vs Deferred event dispatch?** Immediate dispatch within transaction for intra-aggregate consistency; deferred dispatch for integration events.

## Performance Considerations
- Mapping between Domain and Eloquent adds overhead — profile for performance-critical paths.
- Aggregate size affects database transaction contention — smaller Aggregates reduce locking.
- Domain Events dispatched synchronously affect request latency — queue for non-critical listeners.

## Security Considerations
- Domain objects enforce authorization rules through Ubiquitous Language (e.g., `Invoice::cancel()` checks if user has permission).
- Never expose Domain internals through API responses — use DTOs/Transformers.

## Related Rules
- Rule: Define Ubiquitous Language Glossary (LAP-06/05-rules.md)
- Rule: Implement Entities with Identity (LAP-06/05-rules.md)
- Rule: Value Objects Are Readonly and Immutable (LAP-06/05-rules.md)
- Rule: Aggregate Root Enforces Invariants (LAP-06/05-rules.md)
- Rule: Domain Events Are Past Tense Facts (LAP-06/05-rules.md)
- Rule: One Repository Per Aggregate Root (LAP-06/05-rules.md)
- Rule: Keep Aggregates Small (LAP-06/05-rules.md)
- Rule: Domain Classes Have No Framework Dependencies (LAP-06/05-rules.md)
- Rule: Repository Returns Domain Objects (LAP-06/05-rules.md)

## Related Skills
- Implement Value Objects (LAP-07/06-skills.md)
- Define and Dispatch Domain Events (LAP-08/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)

## Success Criteria
- Domain classes contain business behavior, not just data — they enforce invariants and protect consistency boundaries.
- Ubiquitous Language is consistently used across codebase, tests, and documentation.
- Aggregates have clear boundaries with Repository per Aggregate Root.
- Domain Events capture significant domain occurrences and are dispatched at the right time.
