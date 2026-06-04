# Polymorphic MorphToMany — Decomposition

## Implementation Tasks

### 1. Create polymorphic pivot migration
- Create pivot table (e.g., `taggables`, `likables`)
- Add `{morph}_id` (unsigned big integer), `{morph}_type` (string), and `{related}_id` (e.g., `tag_id`)
- Add composite index: `$table->index(['taggable_type', 'taggable_id', 'tag_id'])`
- Add timestamps if using `->withTimestamps()`
- No foreign key on polymorphic columns; add FK on `{related}_id`

### 2. Register morph map
```php
Relation::morphMap([
    'post' => Post::class,
    'video' => Video::class,
    'product' => Product::class,
]);
```
- Register in service provider before any model boot()

### 3. Define `morphToMany` on parent models
```php
// Post model
public function tags(): MorphToMany
{
    return $this->morphToMany(Tag::class, 'taggable');
}

// Video model
public function tags(): MorphToMany
{
    return $this->morphToMany(Tag::class, 'taggable');
}
```

### 4. Define `morphedByMany` on shared model
```php
// Tag model
public function posts(): MorphToMany
{
    return $this->morphedByMany(Post::class, 'taggable');
}

public function videos(): MorphToMany
{
    return $this->morphedByMany(Video::class, 'taggable');
}
```
- Each parent type gets a separate method on the shared model

### 5. Implement CRUD operations
- `$post->tags()->attach($tagId)` (type inferred from parent)
- `$post->tags()->sync([1, 2, 3])`
- `$post->tags()->toggle([3])`
- `$tag->posts()->detach($postId)`
- With extra pivot: `$post->tags()->attach($tagId, ['created_at' => now()])`
- Custom pivot: `->using(TaggablePivot::class)`

### 6. Add cascade cleanup for orphan prevention
- `deleting` event on parent: `$post->tags()->detach()`
- `deleting` event on shared model: `$tag->posts()->detach()`
- Scheduled cleanup: delete pivot rows with missing parent or missing tag
- No FK cascade possible on polymorphic columns

### 7. Configure eager loading
- `Post::with('tags')->get()` for eager loading
- `Tag::with('posts', 'videos')->get()` for shared model
- Verify queries include type constraint

### 8. Add pivot query helpers
- `->wherePivot('created_at', '>=', now()->subDay())` (Laravel 10+)
- `->wherePivotIn('status', ['active', 'pending'])`
- `->orderByPivot('created_at', 'desc')`

### 9. Write query scopes
- `scopeWithTag($query, $tagId)` using `whereHas('tags', fn($q) => $q->where('id', $tagId))`
- `scopeTagged($query)` using `has('tags')`
- `scopeByType($query, $type)` on pivot query

### 10. Write feature tests
- Test `morphToMany` returns collection of related models
- Test `morphedByMany` returns collection of parent models
- Test pivot contains `*_type` column with correct morph alias
- Test `attach`, `detach`, `sync`, `toggle` work correctly
- Test morph map stores short alias in type column
- Test composite index coverage (EXPLAIN)
- Test eager loading with mixed parent types
- Test cascade on delete removes pivot rows
- Test orphaned pivot detection
- Test `wherePivot` filters on pivot columns
- Test custom pivot model works with polymorphic pivot

## Validation Criteria
- [ ] `$post->tags` returns Tag collection with pivot data
- [ ] `$tag->posts` returns Post collection via morphedByMany
- [ ] Pivot table stores correct `*_type` (morph alias)
- [ ] `sync()` correctly diff-based inserts/deletes
- [ ] Deleting parent removes associated pivot rows
- [ ] Eager loading produces correct type-constrained queries
- [ ] Composite index covers `(type, id)` filter pattern
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization