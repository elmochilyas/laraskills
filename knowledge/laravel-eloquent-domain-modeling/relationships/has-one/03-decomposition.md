# HasOne — Decomposition

## Implementation Tasks

### 1. Define migration for child table with foreign key
- Create migration adding `{parent}_id` column (e.g., `user_id`) with `UNIQUE` constraint
- Add foreign key `ON DELETE CASCADE` for referential integrity
- Index the foreign key column

### 2. Define model with `hasOne` method
- Add `hasOne(Child::class)` method to parent model
- Configure custom foreign key and local key if non-conventional
- Add `belongsTo(Parent::class)` to child model for inverse

### 3. Add database-level unique constraint
- Ensure migration enforces `UNIQUE` on foreign key column
- Add composite unique if multiple foreign keys scope the relationship

### 4. Configure eager loading defaults
- Set `protected $with = ['profile'];` if relationship is always needed
- Or use `load()` in relevant controllers/services

### 5. Write query scopes for existence checks
- `scopeHasProfile($query)` using `has('profile')`
- `scopeWhereProfile($query, $closure)` using `whereHas('profile')`
- `scopeWithoutProfile($query)` using `doesntHave('profile')`

### 6. Add service/repository methods for creation
- `createProfile(array $data)` using `$user->profile()->create($data)`
- `firstOrCreateProfile(array $data)` for idempotent creation
- `updateOrCreateProfile(array $data)` for upsert behavior

### 7. Set up cascade deletion logic
- Configure `ON DELETE CASCADE` in migration
- Or handle in parent model `deleting` event:
  ```php
  static::deleting(fn ($parent) => $parent->profile()->delete());
  ```

### 8. Write feature tests for CRUD operations
- Test parent can create child via relationship
- Test duplicate child creation is prevented (unique constraint)
- Test eager loading produces a single query
- Test lazy loading produces a query on access
- Test cascade deletion removes child

### 9. Handle serialization context
- Ensure `'profile'` is included in model `$appends` or loaded before response
- Test JSON:API resource response includes relationship data

### 10. Audit for duplicate children
- Add scheduled command or console check:
  ```sql
  SELECT user_id, COUNT(*) FROM profiles GROUP BY user_id HAVING COUNT(*) > 1
  ```

## Validation Criteria
- [ ] `User::with('profile')->get()` executes 2 queries total
- [ ] `$user->profile` returns `null` when no child exists
- [ ] Database rejects duplicate foreign key values
- [ ] Deleting parent cascades to child
- [ ] `$profile->user` returns parent via `belongsTo`
- [ ] `has('profile')` produces correct `WHERE EXISTS` SQL
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization