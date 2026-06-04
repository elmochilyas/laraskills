# Has-Many Factories — Decomposition

## Implementation Tasks

### 1. Define `HasMany` relationship on parent model
- Add `public function posts(): HasMany` returning `$this->hasMany(Post::class)`
- Verify custom foreign key and local key if non-conventional

### 2. Use `has()` to create parent with children
- Chain `User::factory()->has(Post::factory()->count(3))->create()`
- Assert parent and children are created with correct foreign keys

### 3. Use magic `has{Relation}` method
- Replace explicit `has()` with `User::factory()->hasPosts(3)->create()`
- Test with count parameter and attribute overrides

### 4. Add attribute overrides on child factory
- Pass attribute array to `has()`: `has(Post::factory()->count(3), ['published' => true])`
- Verify overrides apply to all children

### 5. Implement nested relationships
- Chain `has()` inside child factory: `Post::factory()->has(Comment::factory()->count(5))`
- Create parent with nested children via single fluent call

### 6. Test children with states via `has()`
- Call `Post::factory()->draft()->count(2)` inside `has()`
- Verify child states apply correctly

### 7. Test query count for parent + children creation
- Assert N+1 queries where N = number of child types
- Verify no unexpected extra queries

## Validation Criteria
- [ ] `User::factory()->hasPosts(3)->create()` creates 1 user + 3 posts
- [ ] Child posts have correct `user_id` foreign key matching parent
- [ ] `has(Post::factory(), ['published' => false])` overrides child attributes
- [ ] Magic `has{Relation}` resolves the correct factory class
- [ ] Nested `has()` creates the full object graph
- [ ] Children created via `make()` are not persisted
- [ ] Custom foreign keys on relationship are respected by factory
- [ ] Total INSERT queries = parent + children (no extra)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization