# Polymorphic (MorphOne / MorphMany) — Decomposition

## Implementation Tasks

### 1. Create polymorphic child migration
- Add `{morph}_id` (unsigned big integer) and `{morph}_type` (string) columns
- Example: `imageable_id`, `imageable_type` on `images` table
- Add composite index: `$table->index(['imageable_id', 'imageable_type'])`
- No foreign key constraint possible (type is a string)

### 2. Register morph map in AppServiceProvider
```php
use Illuminate\Database\Eloquent\Relations\Relation;

Relation::morphMap([
    'user' => User::class,
    'post' => Post::class,
    'product' => Product::class,
]);
```
- Use short, stable aliases
- Register in `AppServiceProvider::boot()` or a dedicated `MorphMapServiceProvider`

### 3. Define morphOne/morphMany on parent models
```php
// User model
public function image(): MorphOne
{
    return $this->morphOne(Image::class, 'imageable');
}

// Post model
public function images(): MorphMany
{
    return $this->morphMany(Image::class, 'imageable');
}
```

### 4. Define morphTo on child model
```php
public function imageable(): MorphTo
{
    return $this->morphTo();
}
```
- No model or key arguments needed
- Eloquent resolves parent from `*_type` column

### 5. Implement CRUD via polymorphic relationship
- `$user->image()->create($data)` for morphOne
- `$post->images()->createMany([...])` for morphMany
- Query: `Image::where('imageable_type', (new Post)->getMorphClass())->get()`

### 6. Add cascade cleanup for orphan prevention
- Add `deleting` event on each parent type:
  ```php
  static::deleting(fn ($post) => $post->images()->delete());
  ```
- Or scheduled cleanup:
  ```php
  Image::doesntHave('imageable')->delete();
  ```

### 7. Configure eager loading defaults
- `Image::with('imageable')->get()` fires N+1 queries (one per parent type)
- Test eager loading behavior with mixed-type collections
- Consider `->load('imageable')` vs `->with('imageable')`

### 8. Write query scopes
- `scopeByType($query, string $type)` where `imageable_type = $type`
- `scopeForModel($query, Model $model)` combining type + id
- `scopeWithParent($query)` using `with('imageable')`

### 9. Write feature tests
- Test morphOne: `$user->image` returns single model
- Test morphMany: `$post->images` returns collection
- Test morphTo: `$image->imageable` returns correct parent type
- Test morph map resolves short aliases correctly
- Test composite index is used (EXPLAIN)
- Test orphan detection query works
- Test cascade: deleting parent deletes children
- Test eager loading with mixed parent types
- Test invalid morph type raises appropriate error
- Test `morphMap` with different alias name

### 10. Add data integrity monitoring
- Add scheduled command: detect orphaned polymorphic children
- Add command: detect invalid morph type values
- Add command: validate parent existence for all polymorphic children

## Validation Criteria
- [ ] `$user->image` returns Image or null (morphOne)
- [ ] `$post->images` returns Collection of Images (morphMany)
- [ ] `$image->imageable` returns User, Post, or Product
- [ ] Morph map stores short alias in `*_type` column
- [ ] Composite index covers `(id, type)` queries
- [ ] Deleting parent cascades to children via event
- [ ] Eager loading with mixed types executes correct number of queries
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization