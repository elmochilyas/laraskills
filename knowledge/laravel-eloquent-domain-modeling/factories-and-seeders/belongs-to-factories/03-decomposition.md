# BelongsTo Factories — Decomposition

## Implementation Tasks

### 1. Define `BelongsTo` relationship on child model
- Add `public function user(): BelongsTo` returning `$this->belongsTo(User::class)`
- Verify foreign key column name matches convention or is explicitly set

### 2. Use `for()` with factory to create parent simultaneously
- Chain `Post::factory()->for(User::factory())->create()`
- Assert post's `user_id` matches created user's ID

### 3. Use `for()` with existing model
- Create user via `User::factory()->create()`
- Create posts via `Post::factory()->count(3)->for($user)->create()`
- Assert all posts have the same `user_id`

### 4. Use magic `for{Relation}` method
- Replace explicit with `Post::factory()->forUser()->create()`
- Test with attribute overrides: `forUser(['name' => 'Admin'])`

### 5. Handle multiple BelongsTo relations on same model
- Define `author()` and `editor()` BelongsTo relationships on Post
- Use `for(User::factory(), 'author')` and `for(User::factory(), 'editor')` explicitly
- Assert both foreign keys are populated with potentially different users

### 6. Chain deeply nested BelongsTo
- Create `Comment::factory()->for(Post::factory()->for(User::factory()))->create()`
- Assert all three models created and foreign keys correct

### 7. Mix `has()` and `for()` in same expression
- `User::factory()->has(Post::factory()->for(User::factory(), 'editor'))->create()`
- Assert foreign keys for both author (from has) and editor (from for) are set

## Validation Criteria
- [ ] `Post::factory()->for(User::factory())->create()` creates user and post with correct `user_id`
- [ ] `Post::factory()->for($user)->create()` reuses existing user (no new INSERT)
- [ ] Magic `forUser()` resolves the correct belongs-to relationship
- [ ] Custom foreign keys are respected by `for()` with explicit relationship name
- [ ] Multiple belongs-to on same model are disambiguated correctly
- [ ] Deep nesting creates full object graph with correct foreign keys
- [ ] Existing parent passed to `for()` is not modified
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization