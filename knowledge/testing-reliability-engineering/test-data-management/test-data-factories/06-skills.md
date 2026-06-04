# Skill: Create Models with Factory States and Sequences

## Purpose
Use Laravel factory states (`->state()`) and sequences (`->sequence()`) to create models with specific attributes and ordered variations for deterministic, readable test setup.

## When To Use
- Creating models with common domain states (published, draft, archived)
- Setting up user roles with different permissions
- Generating ordered model variations (admin first, members rest)
- Combining states and relationships for complex scenarios
- Reusable test data presets shared across multiple test files

## When NOT To Use
- For one-off scenarios where inline attributes are clearer
- When state definitions duplicate model defaults (state adds no value)
- As a replacement for explicit setup in complex integration scenarios
- When states create hidden side effects (use `->has()` instead of `afterCreating`)
- When the model has very few attributes (factory overhead not justified)

## Prerequisites
- Model factory class with base definition
- Understanding of `$this->state()` in factory methods
- Knowledge of `->sequence()` and `$sequence->index`
- Familiarity with `->has()` for relationships

## Inputs
- Factory class for the model
- Common domain states (published, draft, admin, member, etc.)
- Ordered variations for sequential creation
- Relationship factories for related models
- Deterministic values for state defaults

## Workflow
1. Define state methods in the factory using `$this->state()` with deterministic values
2. Name states as domain actions: `published()`, `draft()`, `admin()`, `subscribed()`
3. Document available states in the factory class docblock
4. Use `->sequence()` with explicit arrays for static variations
5. Use `->sequence(fn ($seq) => [...])` with `$seq->index` for dynamic index-based values
6. Combine states with `->has()` for relationship creation
7. Understand attribute precedence: `create()` > last state > first state > base
8. Use `->truncated()` for states that replace all attributes (instead of merging)

## Validation Checklist
- [ ] State methods use deterministic values (no `now()`, `rand()`, `Str::random()`)
- [ ] States are named as domain actions, not getter methods
- [ ] Factory states are documented in the factory class docblock
- [ ] `->has()` is preferred over `afterCreating` for relationships
- [ ] State definitions are in sync with current schema
- [ ] Attribute precedence is understood and documented
- [ ] Sequences use appropriate format (explicit array vs callback)
- [ ] States are compatible (no conflicting attribute overrides)

## Common Failures
- Non-deterministic state data — `published_at => now()` varies per run, flaky tests
- Overusing `afterCreating` — hidden side effects confuse test readers
- State name collisions — two states define the same attribute with different values
- Sequence wrapping assumption — creating more models than sequence items wraps without warning
- Not updating states after schema changes — referencing removed columns
- Conflicting states applied together — unexpected attribute values

## Decision Points
- State method vs inline attributes — state for reusable patterns across tests, inline for test-specific values
- Sequence explicit array vs callback — explicit for specific static values, callback for index-based dynamic values
- `->has()` vs `afterCreating` — `->has()` for test-specific relationships, `afterCreating` only for always-required

## Performance Considerations
- State evaluation: negligible (attribute array merge)
- Sequence iteration: linear O(n) over items — negligible for <100 items
- `afterCreating` hooks: add model creation time — significant for large batches
- Relationship factories: `->has()` creates related models in separate queries

## Security Considerations
- State data should not contain sensitive or real user data
- `afterCreating` hooks may trigger notifications or external calls — use `->withoutEvents()` when needed
- Ensure factory-created models don't bypass authorization (e.g., creating admin users)
- Use deterministic data — avoid Faker-generated values in state definitions

## Related Rules
- [Rule: Use Deterministic Values in State Definitions](./05-rules.md)
- [Rule: Prefer `->has()` Over `afterCreating`](./05-rules.md)
- [Rule: Name States as Domain Actions](./05-rules.md)

## Related Skills
- Declarative Factory Methods
- Minimal Data Principle
- Database Testing Lifecycle

## Success Criteria
- [ ] Factory states are defined for all common domain states
- [ ] States use only deterministic values
- [ ] Sequences correctly create ordered model variations
- [ ] States are documented in factory class docblocks
- [ ] Tests can create complex model configurations with chained states and relationships
