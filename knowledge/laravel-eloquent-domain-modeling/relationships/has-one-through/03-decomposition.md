# HasOneThrough — Decomposition

## Implementation Tasks

### 1. Create intermediate model and migration
- Create intermediate migration with `{parent}_id` FK column
- Create intermediate model with `hasOne(Target::class)` defined
- Add `belongsTo(Parent::class)` for inverse
- Add `UNIQUE` constraint on parent FK (one-to-one guarantee)

### 2. Create target model and migration
- Create target migration with `{intermediate}_id` FK column
- Add `UNIQUE` constraint and `ON DELETE CASCADE`
- Add `belongsTo(Intermediate::class)` for inverse

### 3. Define `hasOneThrough` on parent model
- Add `hasOneThrough(Target::class, Intermediate::class)` definition
- Verify argument order: Target class first, Intermediate second
- Configure custom keys if non-conventional:
  ```php
  hasOneThrough(Target::class, Intermediate::class, 'user_id', 'profile_id', 'id', 'id')
  ```

### 4. Implement read-only access and fallback
- Add accessor or helper for fallback:
  ```php
  public function getAvatarUrlAttribute(): ?string
  {
      return $this->avatar?->url;
  }
  ```
- Document that the relationship is read-only

### 5. Implement write operations through intermediate
- Create via intermediate: `$user->profile->avatar()->create($data)`
- Update: `$user->profile->avatar()->update($data)`
- Delete: `$user->profile->avatar()->delete()`

### 6. Add eager loading configuration
- `protected $with = ['avatar'];` if always needed
- Verify eager loading executes single join query

### 7. Add existence scopes
- `scopeHasAvatar($query)` using `has('avatar')`
- `scopeWhereAvatar($query, $closure)` using `whereHas('avatar')`

### 8. Handle intermediate/target chain integrity
- Validate intermediate exists before accessing target
- Add database-level cascade: delete target when intermediate deleted
- Add scheduled check for orphaned targets: `Target::doesntHave('intermediate')`

### 9. Write feature tests
- Test `$user->avatar` returns target model
- Test `$user->avatar` returns null when intermediate missing
- Test `$user->avatar` returns null when target missing
- Test eager loading executes single join query
- Test `has('avatar')` produces correct EXISTS SQL
- Test creating target through intermediate works
- Test error on `$user->avatar()->create()` (should throw)
- Test cascade: deleting intermediate deletes target

### 10. Document the through relationship
- Add DocBlock on relationship method clarifying the chain
- Document the key argument ordering for future maintainers
- Add inline comment for custom key mapping

## Validation Criteria
- [ ] `$user->avatar` returns single model or null
- [ ] `User::with('avatar')->get()` executes single query with JOIN
- [ ] `has('avatar')` produces correct WHERE EXISTS with join
- [ ] Deleting intermediate cascades to target
- [ ] Creating target through intermediate works
- [ ] Direct `create()` on through relationship throws exception
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization