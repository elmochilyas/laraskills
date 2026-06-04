# Event Control — Quiet Operations — Decomposition

## Implementation Tasks

### 1. Create helper methods for common quiet operations
- Wrap `saveQuietly()`, `deleteQuietly()`, `forceDeleteQuietly()`, `restoreQuietly()` in a dedicated service or trait
- Add a `withoutEventsFor()` helper that accepts a model instance and a callable, executes quietly
- Example: `withoutEventsFor($user, fn () => $user->update(['last_login' => now()]))`

### 2. Add quiet operation logging
- Create middleware/service that logs all quiet operations in production
- Log the reason for quiet operation, the model, and the caller context

### 3. Write tests for quiet operations
- Test `saveQuietly()` suppresses all 4 events (saving, creating/updating, created/updated, saved)
- Test `deleteQuietly()` suppresses deleting and deleted
- Test `forceDeleteQuietly()` suppresses forceDeleting, forceDeleted, deleting, deleted
- Test `restoreQuietly()` suppresses restoring and restored
- Test `withoutEvents()` scoping and nesting behavior

### 4. Implement a quiet operation policy
- Document when quiet operations are acceptable: seeding, migrations, bulk backfills, self-saving from observers
- Document when quiet operations are unacceptable: user-initiated saves, audit-critical operations, notification-dependent flows

### 5. Create an audit safeguard for quiet operations
- Add a static counter on the base model that tracks quiet save counts
- Alert if quiet saves exceed a threshold in production (indicates overuse)

## Validation Criteria
- [ ] All quiet operation methods tested for event suppression
- [ ] `withoutEvents()` nesting works correctly
- [ ] Quiet operation logging captures all suppressed events
- [ ] Policy document is created and distributed to the team
- [ ] Audit safeguard alerts on excessive quiet operation usage
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization