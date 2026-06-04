# Factory Callbacks — Decomposition

## Implementation Tasks

### 1. Override `configure()` in factory class
- Add `public function configure(): void` to factory
- Register `$this->afterMaking()` and `$this->afterCreating()` callbacks
- Verify `configure()` is called once per factory instance lifecycle

### 2. Implement `afterCreating` callback for relationship setup
- Create related model via `$this->create()` or `factory()->raw()` in callback
- Attach belongs-to, has-many, or belongs-to-many relations
- Test that related models are created alongside parent

### 3. Implement `afterMaking` callback for in-memory setup
- Set non-persistent attributes, tokens, computed values
- Call model methods that don't require persistence
- Test that `make()` triggers callbacks but does not persist

### 4. Add conditional logic inside callbacks
- Branch based on model attributes (role, status, type)
- Apply different post-creation logic per scenario
- Test each branch produces the correct side effects

### 5. Test callback isolation
- Verify callbacks do not run when explicitly testing `definition()` or `raw()`
- Test that `make()` triggers `afterMaking` but not `afterCreating`
- Test that `create()` triggers both callback types

### 6. Test multiple callback ordering
- Register multiple callbacks and verify execution order
- Test that callbacks accumulate, not replace
- Document any ordering dependencies

### 7. Test failure handling
- Cause a callback to throw an exception and verify batch behaviour
- Test transactional rollback on callback failure
- Test graceful handling with try-catch

## Validation Criteria
- [ ] `afterMaking` callbacks execute on `make()` but model is not persisted
- [ ] `afterCreating` callbacks execute after `create()` persists the model
- [ ] Model has a non-null ID inside `afterCreating` callbacks
- [ ] `afterMaking` callbacks do not fire during `create()` — both chains run
- [ ] Multiple callbacks execute in registration order
- [ ] Callback exceptions fail the current creation (within transaction)
- [ ] Relationship data created in callbacks persists correctly
- [ ] `raw()` does not trigger any callbacks
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization