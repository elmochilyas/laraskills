# whereBelongsTo — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** where-belongs-to
- **ECC Version:** 1.0

## Overview
`whereBelongsTo()` is a convenience query builder method that simplifies filtering a parent query by a related model instance. Instead of writing `$post->where('user_id', $user->id)`, you write `$post->whereBelongsTo($user)`. It introspects the `BelongsTo` relationship, extracts the foreign key, and applies the value automatically.

## Core Concepts
- `whereBelongsTo($related, $relationshipName)` accepts a model instance and optional relationship name
- Introspects the `BelongsTo` relationship to extract the foreign key and owner key
- Supports both single model and collection (generates `WHERE IN` for collections)
- If relationship name is omitted, Eloquent infers it from the related model's table name or class basename
- Defined in `Illuminate\Database\Eloquent\Concerns\QueriesRelationships`

## When To Use
- Filtering queries by a related model instance: "find all posts by this user"
- Replacing hard-coded foreign key names with relationship-based references
- Multi-tenant scoping: scoping queries to a tenant/team model
- API controllers: decoupling request parameters from database schema

## When NOT To Use
- Do NOT use with non-`BelongsTo` relationships (throws `BadMethodCallException`)
- Do NOT use when you need to filter by related model attributes (use `whereHas()`)
- Do NOT use with an unpersisted model (no `id` — generates `WHERE FK IS NULL`)
- Do NOT use when performance of the relationship resolution is a concern (negligible, but direct FK is faster)

## Best Practices (WHY)
- Pass the explicit relationship name when the model has multiple `BelongsTo` relations to the same related model
- Use with collections: `Post::whereBelongsTo($users)` generates a single `WHERE IN` clause
- Combine with other query methods: `Post::whereBelongsTo($user)->where('published', true)`
- Use in controller index methods where the user scopes the query
- Prefer `whereBelongsTo()` over hard-coded foreign keys for maintainability

## Architecture Guidelines
- Use `whereBelongsTo()` to centralize foreign key knowledge in relationship definitions
- Combine with `whereHas()` when you need to filter by related model attributes
- For authorization gates, continue using direct key access (`$post->user_id`) for zero-query checks
- The method is pure convenience — generates identical SQL to manual `where()` clauses

## Performance
- Relationship resolution overhead is microseconds — negligible vs the database query
- Resulting SQL is identical to a hand-written `where('user_id', $id)` — same query plan
- Collection support generates a single `WHERE IN` clause — no N+1
- No additional queries are generated

## Security
- The method introspects relationship definitions — no SQL injection risk
- Validate that the passed model is persisted before filtering
- Ensure the relationship name is not user-controllable

## Common Mistakes
- Using `whereBelongsTo()` with a relation that is not `BelongsTo` — throws an error
- Omitting the relationship name when the model has multiple `BelongsTo` relations to the same model
- Passing a model that hasn't been persisted (id is `null`) — generates `WHERE FK IS NULL`
- Expecting it to work with `hasMany` or `belongsToMany` — only works with `BelongsTo`

## Anti-Patterns
- **whereBelongsTo for non-BelongsTo**: using the method on HasMany or BelongsToMany relationships
- **Unpersisted model filtering**: passing `new User()` with no id — generates unexpected NULL clause
- **Hidden relationship resolution**: the inferred relationship name may not match the actual relationship
- **Over-abstraction**: using `whereBelongsTo` for simple FK filters where the column name is stable and well-known

## Examples
```php
// Single model filter
$posts = Post::whereBelongsTo($user)->get();
// SQL: SELECT * FROM posts WHERE user_id = ?

// Multiple model filter (collection)
$posts = Post::whereBelongsTo($users)->get();
// SQL: SELECT * FROM posts WHERE user_id IN (?, ?, ?)

// Explicit relationship name
class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
$posts = Post::whereBelongsTo($author, 'author')->get();
// SQL: SELECT * FROM posts WHERE author_id = ?

// Chained with other conditions
$posts = Post::whereBelongsTo($user)
    ->where('published', true)
    ->orderBy('created_at', 'desc')
    ->get();

// Combined with scopes
$posts = Post::published()->whereBelongsTo($user)->get();

// In controller
class PostController
{
    public function index(Request $request, User $user)
    {
        return Post::whereBelongsTo($user)->paginate();
    }
}
```

## Related Topics
- BelongsTo — relationship type
- whereHas / orWhereHas — filtering by related model attributes
- Relationship Conventions — foreign key naming

## AI Agent Notes
- `whereBelongsTo()` is a convenience wrapper — generates exactly the same SQL as a manual `where()` clause
- Always pass the explicit relationship name when there's ambiguity
- Works with both single models and collections (IN clause)
- Only works with `BelongsTo` relationships — not `HasMany` or `BelongsToMany`
- The inferred relationship name comes from the model's table name, not the class name

## Verification
- [ ] `whereBelongsTo($model)` generates correct `WHERE FK = ?` SQL
- [ ] `whereBelongsTo($collection)` generates correct `WHERE FK IN (...)` SQL
- [ ] Explicit relationship name works correctly with custom FK names
- [ ] Chained with other query conditions works as expected
- [ ] Unpersisted model produces `WHERE FK IS NULL` (known behavior)
- [ ] Non-BelongsTo relationship throws appropriate exception
