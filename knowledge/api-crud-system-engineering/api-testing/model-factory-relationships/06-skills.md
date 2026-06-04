# Skill: Build Model Factories with Relationships

## Purpose
Create and use model factories for related models with state modifiers, trait method composition, relationship callbacks, and sequence generators for realistic test data.

## When To Use
- Test data creation for integration tests
- Seeding test databases with related data
- Model factory definition

## When NOT To Use
- Unit tests that mock models — no real database needed
- Production seeders — use database seeders instead

## Prerequisites
- Laravel model factory system
- Eloquent relationships (belongsTo, hasMany, morphTo)

## Inputs
- Model class definitions
- Relationship structure
- Test data requirements

## Workflow
1. Define factory for each model with meaningful defaults, not random garbage
2. Use `has*()` and `for*()` relationship methods for related model creation
3. Apply state modifiers for specific scenarios: `$factory->state(fn () => ['status' => 'inactive'])`
4. Use sequence generators `Sequence::make(...)` for variation in collections
5. Leverage callback closures in relationship definitions: `afterCreating(fn ($user) => ...)`
6. Set up hask through states to build complete model trees: `User::factory()->hasPosts(3)->create()`
7. Prefer reusable trait `->asAdmin()` over inline state calls: `User::factory()->asAdmin()->create()`
8. Use `for($related)` syntax for belongsTo relationships
9. Keep factory definitions DRY — use states for variations, not separate factories
10. Use `Sequence` for ordered or cycling data in batch creation

## Validation Checklist
- [ ] Factory defaults produce a valid model
- [ ] Related models created via `has*()` and `for*()` methods
- [ ] State modifiers defined for common scenarios
- [ ] Sequence generators used for data variation
- [ ] Model trees (parent + child) set up via callbacks
- [ ] Factory stays DRY — states over separate factories
- [ ] Factories produce realistic data matching schema constraints (unique, nullable, enum)
- [ ] Factory definitions cover all nullable/optional relationships

## Common Failures
- Factories producing invalid models — random data violates unique constraints or enum limits
- `afterCreating` callbacks setting up unnecessary relationships — slows tests
- No state modifiers — test setup code is verbose, repeating inline overrides
- Factory data not matching validation rules — factories pass but real data fails
- Missing `for()` on required belongsTo — test crashes with missing parent error

## Decision Points
- States vs separate factory classes — states for small variations, separate for fundamentally different models
- `afterCreating` vs inline relationship creation — `afterCreating` for required relations, inline for optional
- `Sequence` vs random data — sequence for deterministic, random for stress testing

## Performance Considerations
- `afterCreating` callbacks add per-model overhead — batch relation creation where possible
- `has(3)` creates models sequentially — use `has(3, ['batch' => true])` with chunked creation
- Sequence generators load data eagerly — keep sequences small (under 100) for memory
- Model tree creation is the slowest test operation — reuse models across tests with `once()`

## Security Considerations
- Factory defaults must never create admin/elevated access users accidentally
- Use explicit states (`->asAdmin()`) for elevated access rather than defaults
- Factories should not expose or generate sensitive data in plaintext

## Related Rules
- Define Factory With Meaningful Defaults
- Use has and for Relationship Methods
- Create Type-level State Modifiers
- Use afterCreating For Required Related Models
- Keep Factory Definitions DRY
- Use Sequence For Data Variation
- Use trait methods for composable states

## Related Skills
- Factory Sequences and States — for advanced factory patterns
- Database Seeding Patterns — for production data seeding
- Test Data Generation — for test data strategies

## Success Criteria
- Every model has a factory producing valid data
- Related models are creatable in one fluent call
- States cover common test scenarios without inline overrides
- Factories respect database constraints (unique, enum, nullable)
- Model trees create efficiently with minimal overhead
- Sequence generators produce deterministic, varied data
