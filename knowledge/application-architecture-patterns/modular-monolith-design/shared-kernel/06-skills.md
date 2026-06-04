# Skill: Implement a Minimal Shared Kernel

## Purpose
Create a minimal shared kernel containing only stable, cross-cutting code (base value objects, foundation types, utility interfaces) that three or more modules genuinely need, while keeping business logic in modules.

## When To Use
- Three or more independent modules use the same concept
- The concept is stable (unlikely to diverge per module)
- Cross-cutting infrastructure types (logger, event bus interfaces)

## When NOT To Use
- Only two modules need it (duplication is cheaper than wrong abstraction)
- The concept is still evolving (may diverge per module)
- Business logic or validation rules (belong in modules)
- Framework imports would be needed

## Prerequisites
- Modules established with clear boundaries
- Identified duplication across modules
- Understanding of the stability principle

## Inputs
- List of concepts duplicated across 3+ modules
- Current usage patterns of shared types
- Module dependency graph

## Workflow
1. **Identify candidates using the rule of three.** Wait until the third module needs the same concept before extracting to shared. Premature extraction creates wrong abstractions.

2. **Place only stable, cross-cutting types in Shared/.** Examples: base value objects (Money, Email), foundation types (AggregateRoot, Entity, ValueObject), enums (Currency, Status), cross-cutting interfaces (EventBus, Logger). Never business logic.

3. **Keep the shared kernel free of Laravel facades and helpers.** Use pure PHP. No `\DB`, `\Cache`, `\Event`, `collect()`, `optional()`. Framework contracts (interfaces only) are acceptable as type hints.

4. **Never place Eloquent models in the shared kernel.** A shared Eloquent model creates implicit coupling between all modules. Each module should own its model representation or access data through contracts.

5. **Assign clear ownership for the shared kernel.** Designate an owner (architecture team, senior devs) who reviews all shared kernel changes. Shared changes affect all modules — they need broader review.

6. **Keep the shared kernel as small as possible.** When in doubt, prefer duplication over adding to shared. Every addition creates coupling between all modules.

## Validation Checklist
- [ ] Shared kernel follows the rule of three (3+ modules use it)
- [ ] No business logic in shared kernel
- [ ] No Laravel facades or helpers imported in shared kernel
- [ ] No Eloquent models in shared kernel
- [ ] Shared kernel has designated owner(s)
- [ ] Shared kernel is kept minimal (< 10 files for most projects)
- [ ] Shared kernel has comprehensive tests
- [ ] Shared/ is treated as a special module with no dependencies

## Common Failures
- **Shared kernel as dumping ground.** Everything "common" goes into shared. Modules couple via huge shared namespaces.
- **Business logic in shared kernel.** Cross-cutting business rules prevent independent module evolution.
- **Framework imports in shared.** Laravel facades or helpers coupled to framework through shared kernel.
- **Shared Eloquent model.** Placing User in shared kernel creates implicit coupling between all modules.

## Decision Points
- **Duplicate vs extract?** Duplicate when only 2 modules need it. Extract when third emerges. Duplication is cheaper than wrong abstraction.
- **Framework interfaces yes/no?** Laravel contracts (interfaces only, e.g., `Illuminate\Contracts\Cache\Repository`) as type hints are acceptable. Never concrete implementations or facades.

## Performance Considerations
- No direct performance impact from shared kernel.
- Badly designed shared value objects instantiated in hot paths may create GC pressure — profile if concerned.

## Security Considerations
- Shared kernel has full application access through imports. Keep it minimal and audited.
- No business authorization logic in shared kernel.

## Related Rules
- Rule: Extract at Rule of Three (MMD-08/05-rules.md)
- Rule: No Business Logic in Shared Kernel (MMD-08/05-rules.md)
- Rule: No Laravel Facades in Shared Kernel (MMD-08/05-rules.md)
- Rule: No Eloquent Models in Shared Kernel (MMD-08/05-rules.md)
- Rule: Assign Shared Kernel Ownership (MMD-08/05-rules.md)
- Rule: Keep Shared Kernel Small (MMD-08/05-rules.md)

## Related Skills
- Implement Value Objects (LAP-07/06-skills.md)
- Apply Domain-Driven Design Tactical Patterns (LAP-06/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
- Design Shared Kernel for Bounded Contexts (DBC-03/06-skills.md)

## Success Criteria
- Shared kernel contains only stable, cross-cutting code used by 3+ modules.
- No business logic, Eloquent models, or Laravel facades exist in shared kernel.
- Shared kernel is minimal (< 10 files for most projects).
- Shared kernel has designated owners and comprehensive tests.
