# Skill: Use Factory States and Sequences

## Purpose
Define and use Laravel model factory states and sequences to create models with specific attributes and ordered variations, reducing test verbosity and improving readability.

## When To Use
- Creating models with common lifecycle states (draft, published, archived)
- Setting up user roles with different permissions (admin, editor, member)
- Generating ordered model variations (first item different from rest)
- Combining states to create complex model configurations
- Creating relationships automatically via `->has()`

## When NOT To Use
- For one-off attribute overrides (use `->create(['key' => 'value'])` directly)
- Creating a single model with unique attributes (factory + create is simpler)
- When states hide important setup details from test readers
- Over-engineering simple creation with unnecessary states
- When states would use non-deterministic values (now(), rand())

## Prerequisites
- Model factory definition (base attributes)
- Understanding of `$this->state()` method
- Knowledge of `->sequence()` and sequence callbacks
- Familiarity with `->has()` for relationship creation

## Inputs
- Model factory class
- Common attribute sets to encapsulate as states
- Ordered variations for sequence creation
- Relationship definitions for `->has()`
- Deterministic values for state methods

## Workflow
1. Identify commonly reused attribute combinations in the model factory
2. Create state methods with descriptive names: `published()`, `draft()`, `admin()`, `subscribed()`
3. Use deterministic values in states: `Carbon::yesterday()` instead of `now()`
4. Document states in the factory docblock with `@method` annotations
5. For ordered variations, use `->sequence()` with explicit arrays or callbacks
6. Use `->has()` for scenario-specific relationships (not `afterCreating`)
7. Understand attribute precedence: `create()` > last state > first state > base definition
8. Use sequence callbacks with `$seq->index` for index-based dynamic attributes
9. For large batches (>10 models with complex logic), use explicit loops instead of sequences

## Validation Checklist
- [ ] State methods use deterministic values (not `now()`, `rand()`, `Str::random()`)
- [ ] Factory states are documented in factory docblocks
- [ ] `afterCreating` hooks are documented and minimal
- [ ] Sequence usage is clear and tested
- [ ] Attribute precedence is documented (`create()` > `state()` > base)
- [ ] States are compatible with each other (no conflicting attributes)
- [ ] `afterCreating` hooks don't trigger real service calls
- [ ] Factory definitions are reviewed during schema migrations

## Common Failures
- State methods with non-deterministic data — `now()` in `published_at` varies per run
- Overusing `afterCreating` — implicit relationships created on every model
- Unclear attribute precedence — `create()` vs `state()` override order confusion
- Sequence overflow assumptions — creating more models than sequence items without understanding wrapping
- Hidden `afterCreating` complexity — tests rely on side effects without knowing
- Incompatible state combinations — using `draft` and `published` together with conflicting attributes

## Decision Points
- State method vs inline attributes — state for reusable patterns, inline for one-off values
- `->has()` vs `afterCreating` — `->has()` for test-specific relationships, `afterCreating` for always-required
- Sequence explicit array vs callback — explicit for static variations, callback for dynamic index-based values

## Performance Considerations
- State evaluation: negligible overhead (attribute array merge)
- Sequence iteration: linear O(n) over sequence items — negligible for typical sizes (<100)
- `afterCreating` hooks: add model creation time — significant for large batches
- Relationship factories: `->has()` creates related models in separate queries — consider chunking for 100+

## Security Considerations
- `afterCreating` side effects: ensure hooks don't accidentally trigger real service calls
- State data exposure: factory states should not contain sensitive or real user data
- Use `->withoutEvents()` for sensitive operations in `afterCreating` hooks
- Ensure deterministic state values don't inadvertently match production data patterns

## Related Rules
- [Rule: Use Deterministic Values in State Definitions](./05-rules.md)
- [Rule: Prefer `->has()` Over `afterCreating`](./05-rules.md)
- [Rule: Document Available States in Factory Docblocks](./05-rules.md)

## Related Skills
- Declarative Factory Methods
- Minimal Data Principle
- Database Testing Lifecycle

## Success Criteria
- [ ] Common domain states are defined as factory state methods
- [ ] States use deterministic values and produce consistent test data
- [ ] Sequences create ordered variations correctly
- [ ] `->has()` is preferred over `afterCreating` for relationships
- [ ] Factory documentation lists all available states
