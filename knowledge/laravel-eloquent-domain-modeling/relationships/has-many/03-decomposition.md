# HasMany — Decomposition

## Implementation Tasks

### 1. Create child migration with foreign key
- Create migration adding `{parent}_id` column (e.g., `user_id` on `posts`)
- Add database index and `ON DELETE CASCADE` foreign key

### 2. Define `hasMany` on parent model
- Add `hasMany(Child::class)` definition
- Configure custom foreign/local key if needed
- Add optional default ordering: `->latest('created_at')`
- Add `belongsTo(Parent::class)` on child model

### 3. Implement pagination strategy
- Use `$user->posts()->paginate(20)` for web routes
- Use `$user->posts()->cursorPaginate(20)` for infinite scroll
- Configure default per-page in parent model or controller

### 4. Configure eager loading and lazy prevention
- Add `protected $with = ['posts'];` if always needed
- Enable `Model::preventLazyLoading()` in `AppServiceProvider` for dev
- Use `load()` / `loadMissing()` in controllers

### 5. Write existence and count scopes
- `scopeHasPosts($query)` using `has('posts')`
- `scopeWithPostCount($query)` using `withCount('posts')`
- `scopeWherePostsRecentlyPublished($query)` using `whereHas('posts', fn($q) => $q->where('created_at', '>=', now()->subDays(7)))`

### 6. Implement chunked processing for large datasets
- `User::chunkById(100, fn($users) => $users->each->...)` for batch jobs
- Use `lazy()` (cursor-based) for memory-efficient iteration

### 7. Create child records with relationship
- `$user->posts()->create($data)` for single
- `$user->posts()->createMany([...])` for batch
- `$user->posts()->save($post)` with an existing model instance

### 8. Set up cascade delete or cleanup
- Add `ON DELETE CASCADE` in migration
- Or use `deleting` event: `$user->posts()->delete()`

### 9. Write feature tests
- Test `hasMany` returns `Collection`
- Test `create()` associates foreign key
- Test N+1 detection triggers in dev
- Test `withCount` returns correct aggregate
- Test pagination limits query rows
- Test `createMany` associates all items
- Test cascade behavior on parent delete

### 10. Add N+1 detection tooling
- Enable `Model::preventLazyLoading()` conditionally by environment
- Add early return in `boot()` if `!$this->app->isProduction()`
- Consider package: `beyondcode/laravel-query-detector`

## Validation Criteria
- [ ] `$user->posts` returns `Collection` (empty when no children)
- [ ] `$user->posts()` returns `HasMany` builder
- [ ] `User::with('posts')->get()` executes 2 queries
- [ ] `User::has('posts', '>=', 5)->get()` filters correctly
- [ ] Chunked iteration keeps memory below 50 MB for 100k records
- [ ] Pagination returns correct counts and links
- [ ] Deleting parent cascades or cleans up children
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization