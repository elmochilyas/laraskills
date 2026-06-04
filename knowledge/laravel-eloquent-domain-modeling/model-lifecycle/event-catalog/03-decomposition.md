# Event Catalog — Decomposition

## Implementation Tasks

### 1. Document all 21+ model events in the codebase
- Create a model event reference doc listing all events (retrieving, retrieved, creating, created, updating, updated, saving, saved, deleting, deleted, trashing, trashed, restoring, restored, forceDeleting, forceDeleted, replicating, booting, booted, pivotAttaching, pivotAttached, pivotDetaching, pivotDetached, pivotUpdating, pivotUpdated)
- Note which events can halt operations (all `*ing` events)
- Note which events are conditional (trashing/trashed/pivot events)

### 2. Map events to source methods
- `saving`/`saved` → `Model::save()`
- `creating`/`created` → `Model::performInsert()`
- `updating`/`updated` → `Model::performUpdate()`
- `deleting`/`deleted` → `Model::delete()`
- `trashing`/`trashed` → `SoftDeletes::runSoftDelete()`
- `restoring`/`restored` → `SoftDeletes::restore()`
- `forceDeleting`/`forceDeleted` → `SoftDeletes::forceDelete()`
- `replicating` → `Model::replicate()`
- `retrieving`/`retrieved` → `Model::newFromBuilder()` / `Model::newInstance()`
- `booting`/`booted` → `Model::boot()`
- Pivot events → `BelongsToMany::attach()`, `detach()`, `sync()`, `updateExistingPivot()`

### 3. Create a quick-reference event table
- Columns: Event name, Phase, Halts operation?, Trigger method, Laravel version added
- Include real-world examples of when each event is used

### 4. Write unit tests verifying event dispatch
- Test that each CRUD operation fires the expected events
- Test that `*ing` (before) events can halt operations by returning false
- Test that `*ed` (after) events cannot halt operations
- Test pivot event dispatch during `attach()`/`detach()`/`sync()`

### 5. Document pivot event limitations
- Pivot events only fire when using Eloquent model instances, not raw IDs
- Pivot events fire per row — 1000 sync IDs = 1000 events
- Not all `BelongsToMany` operations fire pivot events (`syncWithoutDetaching()` is silent)

## Validation Criteria
- [ ] All 21+ events are documented with name, phase, and halting capability
- [ ] Unit tests confirm event count per CRUD operation
- [ ] Pivot event behavior is documented and tested
- [ ] Halting behavior is verified for `*ing` events only
- [ ] Reference table exists in project documentation
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization