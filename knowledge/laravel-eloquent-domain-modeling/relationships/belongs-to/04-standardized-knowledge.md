# BelongsTo — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** BelongsTo
- **ECC Version:** 1.0

## Overview
`BelongsTo` is the inverse side of `HasOne` or `HasMany`. The model that defines `BelongsTo` holds the foreign key column pointing to the parent's local key. It is the only relationship type where the defining model's table carries the foreign key. This makes it the fundamental "child-to-parent" navigation in Eloquent.

## Core Concepts
- Foreign key convention: defining model's table contains `{related}_id`; related model provides the local key (defaults to `id`)
- Definition: `return $this->belongsTo(User::class);` on `Post`; custom keys: `belongsTo(User::class, 'foreign_key', 'owner_key')`
- Dynamic property returns single model or `null`; method call returns a `BelongsTo` builder
- Default foreign key name: `snake_case` of class basename + `_id` (e.g., `User::class` → `user_id`)
- `BelongsTo` does NOT extend `HasOneOrMany` — it extends `Relation` directly because the FK is on the defining model
- `associate()` and `dissociate()` are unique to `BelongsTo` — they set/clear the foreign key in memory

## When To Use
- Any "child" model that references a parent via a foreign key column on its own table
- Posts belong to User, Comments belong to Post, Products belong to Category
- Nullable BelongsTo for optional parent references (guest posts, orphaned records)
- Self-referential hierarchies via aliased foreign keys (Comment belongsTo Comment via `parent_id`)

## When NOT To Use
- Do NOT use when the foreign key is on the related model's table (use `HasOne` or `HasMany` from the parent side)
- Do NOT use for many-to-many relationships (use `BelongsToMany`)
- Do NOT use when the parent type varies (use polymorphic `MorphTo`)
- Do NOT use on a model that does not have the foreign key column in its table

## Best Practices (WHY)
- Define `$touches = ['user']` on the child model to automatically update parent's `updated_at` on child changes
- Use `$user->posts()->create($data)` instead of `Post::create($data)` to auto-associate the foreign key
- Check `$post->user_id` directly in authorization gates instead of loading the relationship — avoids an extra query
- Validate parent existence in form requests: `'user_id' => 'required|exists:users,id'`
- Use nullsafe `$post->user?->name` (PHP 8+) when the foreign key is nullable

## Architecture Guidelines
- Add `ON DELETE CASCADE` on the foreign key to prevent orphaned children
- Index the foreign key column for join and WHERE clause performance
- Keep the inverse `HasOne` or `HasMany` defined on the parent for bidirectional access
- Use `associate()`/`dissociate()` for in-memory FK changes, then call `save()` on the child

## Performance
- Eager loading queries the parent table with `WHERE id IN (...child_foreign_keys)` — very efficient with primary key index
- N+1 risk: accessing `$post->user` in a loop without eager loading
- Index the foreign key column on the child table for joins and WHERE clauses
- Direct key access (`$post->user_id`) is zero-query — prefer in authorization and simple checks

## Security
- Validate parent existence before associating with validation rules
- Ensure the foreign key column is `$fillable` if setting it directly via mass assignment
- `associate()` does not persist — must call `save()` on the child model
- Nullable foreign keys can produce null pointer access — always guard with nullsafe operator

## Common Mistakes
- Reversing the direction: the model with the foreign key column defines `BelongsTo`
- Missing foreign key in `create()` — use `$user->posts()->create($data)` to auto-associate
- Confusing `BelongsTo` with `HasOne`: `BelongsTo` = FK on this table; `HasOne` = FK on the other table
- Forgetting to call `save()` after `associate()` — FK change only happens in memory

## Anti-Patterns
- **Loading the parent for a simple FK check**: `$post->user->id === $user->id` instead of `$post->user_id === $user->id`
- **Missing inverse**: defining BelongsTo without the corresponding HasOne/HasMany on the parent
- **BelongsTo for non-FK columns**: using BelongsTo when the model doesn't actually have the FK column
- **Unvalidated nullable belongsTo**: allowing null FK without handling null in the codebase

## Examples
```php
// Definition
class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}

// Associate
$post->user()->associate($user);
$post->save();

// Dissociate
$post->user()->dissociate();
$post->save();

// Create via relationship
$user->posts()->create(['title' => 'New Post']);

// Authorization (zero-query)
if ($post->user_id === auth()->id()) {
    // allowed
}

// Touch parent on child change
class Post extends Model
{
    protected $touches = ['user'];
}

// Eager loading
$posts = Post::with('user')->get();
```

## Related Topics
- HasOne / HasMany — inverse relationships
- BelongsToMany — many-to-many variant
- Relationship Touch — automatic parent timestamp updates
- whereBelongsTo — convenience method for FK-based filtering

## AI Agent Notes
- Always check which model has the foreign key column when deciding between BelongsTo and HasOne
- Use `$child->parent()->associate($parent)` for in-memory FK assignment, then `$child->save()`
- Prefer direct FK checks over relationship loading for simple authorization
- Remember that BelongsTo does NOT share the HasOneOrMany parent class — it extends Relation directly
- The `$touches` property is defined on the child (BelongsTo-side) model

## Verification
- [ ] `$child->parent` returns a single model instance or null
- [ ] `$child->parent()->associate($parent) + save()` persists the foreign key
- [ ] `Child::with('parent')->get()` executes exactly 2 queries
- [ ] `$child->parent_id` directly matches parent's `id`
- [ ] Deleting parent with CASCADE removes child
- [ ] `$child->touch()` propagates to parent via `$touches`
- [ ] Nullable FK does not cause error on access
