# Skill: Resolve Circular Factory Dependency with recycle()

## Purpose

Break a circular factory dependency (e.g., User ↔ Post) by pre-creating one side of the cycle and reusing those instances via `recycle()`, eliminating infinite recursion.

## When To Use

- Two or more factories create each other through relationships or callbacks
- Factory execution causes stack overflow or maximum nesting level error
- Models have bidirectional relationships

## When NOT To Use

- The relationship is genuinely single-direction (the circular appearance is a bug)
- The dependency can be eliminated by redesigning the relationship to be unidirectional
- The cycle involves three or more models where none can be pre-created independently (use `afterCreating`)

## Prerequisites

- Circular dependency has been identified by tracing factory call chains
- At least one model in the cycle can exist independently (has nullable FK or no required reciprocal)

## Inputs

- List of models involved in the circular dependency
- Factory classes for each model
- The model that can exist independently (the "primary" side)

## Workflow

1. Identify the cycle by tracing each factory's `definition()`, `configure()`, and callbacks to see which models create each other
2. Determine which model can exist without the reciprocal relationship (the independent side)
3. Pre-create instances of the independent model:
   ```
   $independent = IndependentModel::factory()->count(10)->create()
   ```
4. Use `recycle()` when creating the dependent model to reference the pre-created instances:
   ```
   DependentModel::factory()->count(50)->recycle($independent)->create()
   ```
5. Place `recycle()` at the top of the factory chain so it applies to all nested factories
6. Document the circular dependency and resolution strategy in the factory class docblock

## Validation Checklist

- [ ] Circular dependency is identified and the primary/independent model is chosen
- [ ] `recycle()` placed before any `has()`, `for()`, or `hasAttached()` calls
- [ ] Pre-created model instances cover all dependent model references
- [ ] No infinite recursion or stack overflow occurs during factory execution
- [ ] Resolution strategy documented on the factory class

## Common Failures

- **Missing cycle identification**: Both factories create each other via `afterCreating()` callbacks. Trace callbacks recursively to find the cycle.
- **Wrong primary model**: Choosing a dependent model that itself cannot be created independently. The primary must have nullable reciprocal FKs or no required reciprocal relationships.
- **recycle() placement**: Placing `recycle()` after relationship methods prevents propagation to nested factories. Always place it first.

## Decision Points

- **recycle() vs afterCreating()**: Use `recycle()` for 2-model cycles where one side is independent. Use `afterCreating()` for 3+ model cycles where no single model can be pre-created.
- **Nullable FK vs recycle()**: Prefer nullable FK design when the domain allows it (cleaner architecture). Use `recycle()` when the FK must be non-nullable.

## Performance Considerations

- Pre-creating the independent model adds a fixed cost (N writes) but prevents exponential creation from recursion
- `recycle()` with a collection distributes references round-robin without extra writes

## Security Considerations

- No direct security impact; affects test and seeding data only

## Related Rules

- Rule 1: Break Every Circular Factory Dependency Before Seeding
- Rule 2: Use recycle() to Break Circular Dependencies
- Rule 3: Defer the Dependent Side of a Cycle to afterCreating
- Rule 5: Do Not Call Model::factory() Inside Another Model's definition()
- Rule 6: Document Circular Dependency Resolutions in Factory DocBlocks

## Related Skills

- Recycle Pattern for Shared Parents
- HasMany Factory Relationships with has()
- BelongsTo Factory Relationships with for()

## Success Criteria

- Factory executes without infinite recursion or stack overflow
- All models in the cycle are created with correct reciprocal references
- Resolution is documented so future maintainers do not reintroduce the cycle
