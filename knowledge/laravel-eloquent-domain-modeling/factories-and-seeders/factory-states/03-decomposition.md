# Factory States — Decomposition

## Implementation Tasks

### 1. Identify domain-relevant model states
- List all distinct scenarios the model can be in (e.g., `active`, `pending`, `cancelled`, `verified`, `admin`)
- Prioritize states that affect business logic or test coverage gaps

### 2. Implement simple `state()` overrides on factory
- Add `->state()` calls for straightforward attribute overrides
- Chain inline `state()` for one-off test scenarios

### 3. Extract reusable named state methods
- Create public methods returning `$this->state(...)` on the factory class
- Name after the domain condition: `admin()`, `pending()`, `verified()`
- Use closure-based states for attribute overrides
- Add docblocks for discoverability

### 4. Create dedicated state classes for complex states
- Generate class extending `Illuminate\Database\Eloquent\Factories\State`
- Implement `__invoke(array $attributes): array`
- Inject dependencies via constructor if needed
- Register class in factory's `$states` map or use directly: `->state(new ComplexState())`

### 5. Add `trashed()` on soft-delete models
- Verify `SoftDeletes` trait is present on model
- Call `factory()->trashed()->create()` in tests for soft-deleted data scenarios

### 6. Test individual states in isolation
- Assert state methods return `static` for fluent chaining
- Assert created model has correct attribute values
- Test nullable attributes are properly nullified (not omitted)

### 7. Test composed states
- Create models with multiple states applied
- Assert expected override precedence
- Verify no unexpected attribute leakage between states

### 8. Test state with `make()` and `raw()`
- Verify states work identically with `make()`, `create()`, and `raw()`
- Assert `raw()` returns overridden attributes before model hydration

### 9. Write documentation for factory states
- List available states and the attributes they affect
- Document any ordering dependencies between states
- Note which states compose well and which conflict

## Validation Criteria
- [ ] Each named state method returns `static` for fluent chaining
- [ ] `factory()->admin()->create()` produces an admin user
- [ ] `factory()->admin()->unverified()->create()` composes both states correctly
- [ ] `factory()->trashed()->create()` sets non-null `deleted_at`
- [ ] Inline `state(['attribute' => 'value'])` overrides base definition
- [ ] Nullifying a base attribute via state sets `null` in the database
- [ ] State classes resolve from container and apply overrides correctly
- [ ] No state mutates shared external state across multiple creations
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization