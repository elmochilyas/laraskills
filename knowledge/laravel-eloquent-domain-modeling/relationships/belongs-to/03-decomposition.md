# BelongsTo — Decomposition

## Implementation Tasks

### 1. Add foreign key column to child migration
- Create migration adding `{parent}_id` (e.g., `user_id` on `posts`)
- Add index and `ON DELETE CASCADE`
- Set nullable if relationship is optional (e.g., guest posts)

### 2. Define `belongsTo` on child model
- Add `belongsTo(Parent::class)` definition
- Configure custom foreign key: `belongsTo(User::class, 'author_id')`
- Add `hasMany` or `hasOne` on parent model for inverse

### 3. Define `$touches` for timestamp sync
- Add `protected $touches = ['user']` on child model
- Test that child saves update parent's `updated_at`

### 4. Implement associate/dissociate helpers
- `$post->user()->associate($user)` to set FK in memory
- `$post->user()->dissociate()` to set FK to null
- Remember to call `$post->save()` after associate

### 5. Create records with auto-association
- Use `$user->posts()->create($data)` to auto-set `user_id`
- Or set `$post->user_id = $request->user_id` and `$post->save()`

### 6. Add authorization helper using direct key
- `$post->user_id === auth()->id()` for gate checks (no query)
- Add policy method: `view(User $user, Post $post)` check

### 7. Write existence scopes
- `scopeWhereUser($query, $userId)` using `where('user_id', $userId)`
- `scopeByUser($query, $user)` using `belongsTo` relationship
- Prefer direct `where` on foreign key for performance

### 8. Handle nullable belongsTo
- Validate nullable: `'user_id' => 'nullable|exists:users,id'`
- Guard with nullsafe: `$post->user?->name`
- Add `doesntHave('user')` scope for null FK records

### 9. Write feature tests
- Test `belongsTo` returns correct parent model
- Test `associate` and `dissociate` set/clear FK
- Test create via relationship auto-associates
- Test nullable relationship returns null
- Test `$touches` updates parent timestamp
- Test eager loading produces 2 queries
- Test orphan detection via missing parent

### 10. Implement orphan detection
- Scheduled query: `Post::doesntHave('user')->get()`
- Alert on nullable FKs that should be non-null
- Cleanup command for fixing or removing orphans

## Validation Criteria
- [ ] `$post->user` returns model instance (or null)
- [ ] `$post->user()->associate($user) + save()` persists FK
- [ ] `Post::with('user')->get()` executes 2 queries
- [ ] `$post->user_id` directly matches parent `id`
- [ ] Deleting parent with CASCADE removes child
- [ ] `$post->touch()` propagates to parent via `$touches`
- [ ] Nullable FK does not cause error on access
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization