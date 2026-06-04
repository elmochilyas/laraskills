# Scoped Relationships — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** scoped-relationships
- **ECC Version:** 1.0

## Overview
Scoped relationships define relationships with pre-applied constraints — default ordering, limits, where conditions — directly in the relationship method. Any query builder method chained on a relationship definition creates a scoped relationship. The constraints become part of every access to that relationship for both eager and lazy loading.

## Core Concepts
- Chain query builder methods on the relationship return value: `$this->hasMany(Comment::class)->where('approved', true)`
- Constraints are stored in the Builder's constraint arrays and applied on every relation load
- `->ofMany()` / `->latestOfMany()` / `->oldestOfMany()` for "one of many" singular relationships
- Scoped constraints cannot be overridden at query time — they are definition-time, not runtime
- Different from runtime constraint closures in `with(['rel' => fn($q) => ...])`

## When To Use
- Domain-specific relationship variants: `approvedComments()`, `recentPosts()`, `latestLogin()`
- Default ordering on relationships: `$this->hasMany(Post::class)->latest('published_at')`
- Filtering relationships to always exclude certain records: `$this->hasMany(Comment::class)->where('spam', false)`
- "Best of" relationships using `latestOfMany()` or `ofMany()` for latest/highest value records
- When the relationship always needs the same constraints — encoding them at definition time avoids repetition

## When NOT To Use
- Do NOT use when the constraints need to vary by query context (use runtime `with()` closures)
- Do NOT use when you need the unconstrained relationship regularly — define a separate base relationship
- Do NOT use overly complex scoped relationships that would be better as query scopes
- Do NOT use `ofMany()` on `BelongsTo` relationships (only works with `HasOne`/`MorphOne`)

## Best Practices (WHY)
- Name scoped relationships descriptively: `latestPost` vs `posts`, `approvedComments` vs `comments`
- Keep the base relationship for unfiltered access: `comments()` (all) and `approvedComments()` (filtered)
- Use `latestOfMany()` / `oldestOfMany()` for deterministic "latest" singular relationships
- Always pair `limit()` with `orderBy()` for deterministic results
- Index columns used in scoped relationship constraints for query performance

## Architecture Guidelines
- Scoped relationships multiply relationship methods on the model — balance expressiveness against model bloat
- Extract scoped relationships that are reused across multiple models into a trait
- Document scoped relationships clearly — another developer may not expect hidden constraints
- Use scoped relationships for domain concepts, not for ad-hoc filtering
- Prefer runtime constraints via `with()` for request-specific filtering

## Performance
- Scoped relationships generate identical SQL to hand-written constraints — no performance penalty
- `->ofMany()` uses a correlated subquery with aggregation — index the ordering column
- Multiple scoped relationships on the same base table each generate independent subqueries
- Consider database views for complex, frequently-used scoped relationships

## Security
- Scoped relationships filter data at the definition level — applied to all queries automatically
- Ensure scoped constraints don't inadvertently hide data that should be accessible
- Overly restrictive scoped relationships may hide data that authorization should control

## Common Mistakes
- Defining a scoped relationship and expecting it to be mutable — constraints are fixed at definition time
- Using `latestOfMany()` on a table without a proper timestamp column
- Forgetting that scoped relationships apply during lazy loading too — `$user->comments` always filtered
- Creating deeply nested scoped relationships that generate complex, slow subqueries
- Expecting `ofMany()` to work on `BelongsTo` — only works on `HasOne`/`MorphOne`

## Anti-Patterns
- **Only scoped, no base**: defining only scoped relationships without an unscoped version for full access
- **Runtime filtering in definition**: using scoped relationships when the constraints should vary per request
- **Hidden constraints**: scoped relationships that silently filter in unexpected ways
- **ofMany without index**: correlated subquery on unindexed column causes slow queries

## Examples
```php
class User extends Model
{
    // Base (unscoped) relationship
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // Scoped relationship — only approved
    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)->where('approved', true);
    }

    // Scoped with ordering
    public function recentPosts(): HasMany
    {
        return $this->hasMany(Post::class)->latest('published_at');
    }

    // ofMany — latest login
    public function latestLogin(): HasOne
    {
        return $this->hasOne(Login::class)->latestOfMany();
    }

    // ofMany — highest score
    public function bestScore(): HasOne
    {
        return $this->hasOne(Score::class)->ofMany('score', 'max');
    }

    // Constrained collection
    public function recentComments(): HasMany
    {
        return $this->hasMany(Comment::class)
            ->where('approved', true)
            ->latest()
            ->limit(5);
    }
}

// Usage
$user->comments;          // all comments
$user->approvedComments;  // only approved
$user->latestLogin;       // single model — most recent login

// Scoped relationships work with eager loading
$users = User::with('approvedComments')->get();

// Cannot override constraints at query time
// $user->approvedComments()->where('spam', false) — still has 'approved = true'
```

## Related Topics
- HasOneOfMany — deep dive on `ofMany` mechanics
- Local Scopes — model-level vs relationship-level constraints
- Constrained Eager Loading — runtime constraint closures in `with()`
- Query Builder Chaining — foundation for scoped constraints

## AI Agent Notes
- Scoped relationships encode constraints at DEFINITION time — they can't be overridden at query time
- Name scoped relationships to reflect their constraints: `activeMembers()`, `recentPosts()`
- Keep the base (unscoped) relationship for unfiltered access
- `latestOfMany()` requires an index on the ordering column
- For runtime-varying constraints, use `with(['rel' => fn($q) => ...])` closures instead

## Verification
- [ ] Scoped relationships apply constraints on both eager and lazy loading
- [ ] Base (unscoped) relationship exists alongside scoped variants
- [ ] Relationship names clearly reflect the constraints applied
- [ ] `ofMany()` relationships use indexed ordering columns
- [ ] Scoped constraints cannot be overridden at query time (known limitation)
- [ ] `latestOfMany()` / `oldestOfMany()` return deterministic results
