# Skill: Create Named Factory State Methods

## Purpose

Define named factory state methods that encapsulate domain-specific model variations (e.g., `admin()`, `verified()`), replacing inline attribute overrides with reusable, intent-revealing methods.

## When To Use

- A model has distinct domain variations (admin vs regular user, paid vs pending)
- The same attribute override pattern appears in 3+ tests
- You want to express test intent with named methods

## When NOT To Use

- The override is test-specific and used once (pass attributes directly to `create()`)
- The variation requires fundamentally different relationships (use callbacks or separate factories)

## Prerequisites

- Factory class with `definition()` method exists
- The attribute being varied is not already a required default in `definition()`

## Inputs

- Domain condition name (e.g., `admin`, `verified`, `pending`)
- Attribute overrides (array or closure) for that condition

## Workflow

1. Identify a repeated attribute override pattern across the codebase:
   ```
   // Repeated in 3 tests:
   User::factory()->create(['is_admin' => true, 'role' => 'superuser'])
   ```
2. Add a state method to the factory with a domain-meaningful name:
   ```
   public function admin(): static
   {
       return $this->state(['is_admin' => true, 'role' => 'superuser'])
   }
   ```
3. Return `$this` from every state method to enable chaining:
   - Must use `: static` return type
4. For computed attributes, use a closure that receives current attributes:
   ```
   public function fullAccess(): static
   {
       return $this->state(fn (array $attrs) => [
           'role' => 'admin',
           'permissions' => $attrs['role'] === 'admin' ? '*' : 'read',
       ])
   }
   ```
5. Compose multiple states by chaining:
   ```
   User::factory()->admin()->verified()->create()
   ```
6. Document which states conflict and the expected composition order

## Validation Checklist

- [ ] State method name reflects the domain condition, not the attribute name
- [ ] State method returns `$this` with `: static` return type
- [ ] State composition order is documented (which states conflict, which wins)
- [ ] Repeated overrides (3+ occurrences) are extracted into state methods
- [ ] Closures used for computed attributes that depend on other attributes
- [ ] Built-in `trashed()` used for soft-deletable models instead of manual `deleted_at`

## Common Failures

- **Implementation-named states**: `->isAdmin(true)` instead of `->admin()`. Name after the business condition, not the column.
- **Missing $this return**: State method returns `void` instead of `: static`, breaking fluent chaining.
- **Destructive side effects**: Calling `Model::truncate()` inside a state method. Destructive operations belong in the test or seeder, not the factory.

## Decision Points

- **Inline vs state method**: Use inline attributes for one-off test variations. Use state methods for patterns repeated across 3+ tests.
- **Array vs closure**: Use a plain array for static overrides. Use a closure when the override value depends on other attributes already set in the chain.

## Performance Considerations

- State methods add no runtime overhead — they are convenience wrappers around attribute arrays
- Multiple composed states merge attribute arrays; later states override earlier ones

## Security Considerations

- No direct security impact; affects test data generation only

## Related Rules

- Rule 1: Name States After Domain Conditions, Not Implementation
- Rule 2: Always Return $this from State Methods for Chaining
- Rule 3: Compose States Explicitly; Document Conflicts
- Rule 4: Extract Repeated Overrides into Named State Methods
- Rule 5: Use State Closures for Computed Attributes

## Related Skills

- Factory Definition for Attribute Arrays
- Factory Sequences for Deterministic Data
- Factory Callbacks for Post-Creation Logic

## Success Criteria

- Tests use `->admin()->create()` instead of `->create(['is_admin' => true])`
- State methods are self-documenting — the method name conveys the business scenario
- States compose predictably and conflicts are documented
