# Event Dispatch Order — Decomposition

## Implementation Tasks

### 1. Map exact event sequences for each operation
- Insert: saving → creating → INSERT → created → saved
- Update: saving → updating → UPDATE → updated → saved
- Delete: deleting → DELETE → deleted
- Soft delete: deleting → trashing → UPDATE deleted_at → trashed → deleted
- Restore: restoring → UPDATE deleted_at = NULL → restored
- Force delete (soft): forceDeleting → DELETE → forceDeleted
- Replicate: replicating → attribute copy
- Fresh retrieval from DB: retrieving → retrieved (on existing models only)

### 2. Verify `saving`/`saved` wrapping behavior
- Confirm `saving` fires once per `save()` call regardless of insert/update
- Confirm `saving` fires before inner events (creating or updating)
- Confirm returning false from `saving` prevents all inner events

### 3. Document conditional branching points
- `save()` branches on `$this->exists` to determine insert vs. update
- `delete()` branches on `$this->exists` and `SoftDeletes::isSoftDeletable()`
- `touch()` does NOT fire saving/saved — only updated

### 4. Write tests for ordering guarantees
- Test that `saving` fires before `creating` on insert
- Test that `saving` fires before `updating` on update
- Test that `saved` fires after both `created`/`updated`
- Test that `deleting` fires before `trashing` on soft delete
- Test that `touch()` fires only `updated`, not `saving`/`saved`

### 5. Document restore event exclusion
- Verify `restore()` does NOT fire `saving` or `saved`
- Document impact: `saving` listeners that cache-invalidate will not run on restore
- Mitigation: register restore-specific logic on `restored` event

### 6. Model `save()` event sequence as a state machine
- Create a diagram/table showing the decision tree from `save()` through to `saved`
- Include the halting paths (any `*ing` returning false aborts)

## Validation Criteria
- [ ] Event sequence documented for all 7 operation types
- [ ] Tests confirm `saving` fires before inner events
- [ ] Tests confirm `restore()` bypasses `saving`/`saved`
- [ ] Tests confirm `touch()` fires only `updated`
- [ ] Tests confirm halting at each `*ing` event
- [ ] Decision tree diagram exists for reference
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization