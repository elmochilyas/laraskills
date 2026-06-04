# Skill: Implement Vertical Slice Architecture

## Purpose

Organize code by feature rather than by technical layer, creating autonomous vertical stacks through the entire system.

## When To Use

- Feature teams owning end-to-end functionality
- Systems where features evolve at different rates
- Monoliths preparing for future service extraction
- Complex domains where feature isolation simplifies reasoning

## When NOT To Use

- Simple CRUD applications (overhead without benefit)
- Teams that enforce strict DRY across all features
- Systems where features share extensive logic (prefer layered)
- When team cannot tolerate controlled duplication

## Prerequisites

- Feature-based thinking (not technical-layer thinking)
- Command/Query pattern familiarity
- Modular monolith understanding

## Inputs

- Feature list organized by business capability
- Shared kernel definitions (value objects, base classes)
- Inter-slice communication contracts (events)

## Workflow

1. Identify features by business capability (e.g., Checkout, Returns, Inventory)
2. Create a directory per feature containing its complete pipeline
3. Define explicit Command/Query classes per slice action
4. Keep slices autonomous: no cross-slice sharing of models or services
5. Extract shared patterns to Shared Kernel (value objects, base classes)
6. Each slice owns its own database tables or schema namespace
7. Use events for inter-slice communication
8. Accept duplication within slices; extract infrastructure when patterns repeat across slices

## Validation Checklist

- [ ] Directories organized by feature, not by technical layer
- [ ] No slice imports models or services from another slice
- [ ] Each slice has its own tables or schema namespace
- [ ] Commands/queries used as explicit slice boundaries
- [ ] Inter-slice communication via events, not shared models
- [ ] Shared Kernel is minimal and changes rarely
- [ ] Each slice is independently understandable

## Common Failures

- Premature abstraction across slices (recreating layered architecture)
- No shared kernel at all (inconsistent value objects)
- Slices too granular (one per HTTP method instead of per feature)
- Slices too coarse (entire module in one slice)
- Cross-slice communication via shared database

## Decision Points

- What goes in Shared Kernel vs duplicated per slice?
- How to detect when two slices need the same infrastructure?
- When is a slice too large (should be split) or too small (should merge)?

## Performance Considerations

- Controlled duplication increases code volume but improves autonomy
- Cache shared reference data rather than sharing models
- Monitor inter-slice event throughput

## Security Considerations

- Each slice should authenticate and authorize independently
- Shared Kernel types should not carry security-sensitive data
- Event contracts between slices should not leak internal state

## Related Rules (from 05-rules.md)

- Rule 1: Each vertical slice is autonomous — no cross-slice sharing of models or services
- Rule 2: Slice by business capability, not by technical layer
- Rule 3: Use lightweight in-process messages (commands/queries) as slice boundaries
- Rule 4: Duplication within a slice is acceptable; duplication across slices requires shared infrastructure
- Rule 5: Each slice must have its own database tables or schema namespace

## Related Skills

- Decompose by Business Capability
- Implement a Modular Monolith
- Design Hexagonal Architecture Ports and Adapters

## Success Criteria

- A single feature can be understood by reading one directory
- Slices can be extracted into independent services one at a time
- Changes to one feature never break another slice
