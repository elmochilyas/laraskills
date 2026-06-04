# HasManyThrough — Decomposition

## Implementation Tasks

### 1. Create intermediate and target migrations
- Create intermediate migration with `{parent}_id` FK (e.g., `country_id` on `users`)
- Create target migration with `{intermediate}_id` FK (e.g., `user_id` on `posts`)
- Index both foreign key columns
- Add `ON DELETE CASCADE` on both FKs

### 2. Define HasMany chains on intermediate model
- Intermediate model has `hasMany(Target::class)` 
- Intermediate model has `belongsTo(Parent::class)`
- Parent model has `hasMany(Intermediate::class)` (but not needed for HasManyThrough itself)

### 3. Define `hasManyThrough` on parent model
- Add `hasManyThrough(Target::class, Intermediate::class)` definition
- Verify argument order: target first, intermediate second
- Configure custom keys for non-conventional FK names

### 4. Implement read-only access
- Access via `$parent->targets`
- Document that relationship is read-only
- Add helper method if chained create is needed:
  ```php
  public function createPostForUser(User $user, array $data): Post
  {
      return $user->posts()->create($data);
  }
  ```

### 5. Add eager loading configuration
- `protected $with = ['posts'];` if always needed
- Verify single-join query on eager load

### 6. Add existence and aggregate scopes
- `scopeHasPosts($query)` using `has('posts')`
- `scopeWithPostCount($query)` using `withCount('posts')`
- `scopeWherePostsPublished($query)` using `whereHas('posts', fn($q) => $q->where('published', true))`

### 7. Implement pagination on through relationship
- `$country->posts()->paginate(20)` for web routes
- Note: count queries include the join, adding overhead

### 8. Set up cascade cleanup and integrity
- Add `ON DELETE CASCADE` on target's FK to intermediate (migration)
- Add `ON DELETE CASCADE` on intermediate's FK to parent
- Add orphan detection: `Post::doesntHave('user')->get()`

### 9. Write feature tests
- Test `$country->posts` returns `Collection`
- Test eager loading executes single join query
- Test `has('posts')` produces correct SQL
- Test `withCount('posts')` returns correct count
- Test pagination works correctly
- Test empty collection when no intermediates exist
- Test error on `$country->posts()->create()` (should throw)
- Test cascade: deleting intermediate deletes targets
- Test cascade: deleting parent cascades through intermediate

### 10. Add indexing and performance notes
- Add migration index on `intermediate.parent_id`
- Add migration index on `target.intermediate_id`
- Document `EXPLAIN` query plan expectations
- Add performance test for large datasets

## Validation Criteria
- [ ] `$country->posts` returns `Collection` of target models
- [ ] `Country::with('posts')->get()` executes 2 queries (or 1 join)
- [ ] `has('posts')` correctly filters parents with targets
- [ ] `withCount('posts')` returns correct aggregate
- [ ] Direct `create()` on through throws exception
- [ ] Deleting intermediate cascades to targets
- [ ] Empty intermediate set returns empty collection
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization