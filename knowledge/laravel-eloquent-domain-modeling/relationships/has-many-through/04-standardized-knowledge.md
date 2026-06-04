# HasManyThrough — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasManyThrough
- **ECC Version:** 1.0

## Overview
`HasManyThrough` defines a one-to-many relationship that traverses an intermediate model. The parent accesses a collection of distant children via an intermediate model. Like `HasOneThrough`, this relationship is read-only — writes must go through the intermediate chain manually.

## Core Concepts
- Three-table chain: Parent → Intermediate (HasMany) → Target (HasMany)
- Definition: `return $this->hasManyThrough(Post::class, User::class);` on `Country` — target first, intermediate second
- Join query: `SELECT posts.* FROM posts INNER JOIN users ON users.id = posts.user_id WHERE users.country_id = ?`
- Returns a Collection of target models; does not support `create()` or `save()` directly
- Eager loading uses a single join query, flattening the nested hierarchy into one collection

## When To Use
- Aggregating data across a two-level hierarchy: Country → User → Post
- Team → Member → Achievement: aggregate all team members' achievements
- Organization → Project → Invoice: get all invoices across all projects
- Hiding the intermediate model when it exists purely to scope the target collection

## When NOT To Use
- Do NOT use when you need to write/create through the relationship (it's read-only)
- Do NOT use when the intermediate models themselves are needed in the result
- Do NOT use when the intermediate-to-target relationship is `HasOne` (use `HasOneThrough`)
- Do NOT use for relationships that don't traverse a full intermediate table (use `HasMany`)

## Best Practices (WHY)
- Verify argument order: `hasManyThrough(Target::class, Intermediate::class)` — target first
- Index both `intermediate.parent_id` and `target.intermediate_id` for join performance
- Add `ON DELETE CASCADE` on both foreign keys to prevent orphaned records
- Create targets through the specific intermediate instance: `$user->posts()->create($data)`
- Use null-safe patterns: empty collection when no intermediates exist is valid, not an error

## Architecture Guidelines
- Use `HasManyThrough` when the intermediate exists purely to scope the target collection
- Use nested `load('users.posts')` when the intermediate models are needed in the result
- Document that the relationship is read-only in the method DocBlock
- Add scheduled orphan detection for targets pointing to deleted intermediates

## Performance
- Single join query — more efficient than nested eager loading for the same data
- `withCount('posts')` generates a nested subquery, which is more expensive than a simple `hasMany` count
- Pagination works but count queries include the join, adding overhead
- Index both `intermediate.parent_id` and `target.intermediate_id` for query performance

## Security
- The intermediate model scopes the target — authorization at the intermediate level applies transitively
- Ensure cascade delete policies are correct: deleting a parent should cascade through intermediate to targets
- Orphaned target records can leak data if not cleaned up

## Common Mistakes
- Wrong argument order: `hasManyThrough(Target::class, Intermediate::class)` — target first, intermediate second
- Assuming the target table has a FK to the parent — it has a FK to the intermediate table
- No write support surprise: `$country->posts()->create(...)` throws an exception
- Missing intermediate yields empty collection, which may be surprising if an error was expected

## Anti-Patterns
- **HasManyThrough for mutable data**: using a read-only relationship when writes are needed
- **Over-nesting**: 3+ hop chains produce complex SQL that's hard to optimize
- **Missing cascade**: deleting an intermediate without cascading to targets creates orphans
- **HasManyThrough when direct HasMany suffices**: adding an unnecessary intermediate to the chain

## Examples
```php
// Definition
class Country extends Model
{
    public function posts(): HasManyThrough
    {
        return $this->hasManyThrough(
            Post::class,
            User::class,
            'country_id', // FK on users table
            'user_id',    // FK on posts table
            'id',         // local key on countries table
            'id'          // local key on users table
        );
    }
}

class User extends Model
{
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}

class Post extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

// Read access
$countryPosts = $country->posts;

// Create through intermediate
$user = $country->users->first();
$user->posts()->create(['title' => 'New Post']);

// Eager loading
$countries = Country::with('posts')->get();

// Existence and aggregates
$countriesWithPosts = Country::has('posts')->get();
$countries = Country::withCount('posts')->get();

// Pagination
$posts = $country->posts()->paginate(20);
```

## Related Topics
- HasOneThrough — singular variant
- HasMany — direct one-to-many (no intermediate)
- Fluent Through Relationships — chainable syntax for complex through chains

## AI Agent Notes
- Always verify argument order: `hasManyThrough(Target, Intermediate, ...)` — target first
- The target table has a FK to the intermediate table, not to the parent table
- Document read-only constraint — developers unfamiliar with through relationships expect write support
- For eager loading, the join query is `INNER JOIN intermediate ON intermediate.id = target.intermediate_id WHERE intermediate.parent_id IN (...)`

## Verification
- [ ] `$parent->targets` returns Collection of target models
- [ ] `Parent::with('targets')->get()` executes 2 queries (or 1 join)
- [ ] `has('targets')` correctly filters parents with targets
- [ ] `withCount('targets')` returns correct aggregate
- [ ] Direct `create()` on through throws exception
- [ ] Deleting intermediate cascades to targets
- [ ] Empty intermediate set returns empty collection
