# SupportsInverseRelations — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** inverse-relations
- **ECC Version:** 1.0

## Overview
The `SupportsInverseRelations` trait (Laravel 11+) automatically sets the inverse side of a relationship when a related model is assigned. When `$post->author()->associate($user)` is called, Eloquent automatically calls `$user->setRelation('posts', $post)`. This eliminates stale relation state in memory across a request.

## Core Concepts
- Applied via `use SupportsInverseRelations;` on the parent model (the one defining `HasMany`/`HasOne`)
- When `associate($model)` is called on `BelongsTo`, the inverse relation is set on the parent
- Relationship name inferred by convention or explicitly via `->inverse('posts')`
- `dissociate()` similarly clears the inverse relation
- `HasMany::save()` and `HasMany::saveMany()` also update inverse relations
- Strictly an in-memory optimization — does not affect database operations

## When To Use
- Laravel 11+ projects where relationship consistency after writes is important
- Queue jobs and long-running processes where model instances persist across operations
- Tests where you read a relationship immediately after writing and expect correct data
- Livewire/Filament applications with frequent AJAX mutations and immediate reads
- Any codebase where `$post->author()->associate($user)` should update `$user->posts` immediately

## When NOT To Use
- Do NOT use in Laravel versions below 11 (trait doesn't exist)
- Do NOT use when you don't need in-memory consistency (simple request-response flows)
- Do NOT expect inverse relations for `BelongsToMany` or polymorphic relationships (not supported)
- Do NOT rely on inverse relations for database synchronization — in-memory only

## Best Practices (WHY)
- Add `use SupportsInverseRelations` to every model that is the "parent" side of relationships
- Use `->inverse('posts')` explicitly when the convention-based guess may be wrong
- Add the trait to BOTH sides of the relationship for full bidirectional sync
- Document that inverse relations are in-memory only — not a persistence guarantee
- Test that inverse relations are correctly set after `associate()` and `save()` operations

## Architecture Guidelines
- Add the trait to all parent models in a consistent way (base model or trait)
- Use `->inverse()` when the relationship name doesn't match convention
- Combine with `chaperone()` when both inverse consistency and instance isolation are needed
- Monitor for potential memory leaks in long-running processes — inverse relations hold references

## Performance
- Inverse update is a simple `setRelation()` call — no database queries involved
- Overhead is a method call, convention-based name resolution, and array push — negligible
- `method_exists()` check adds tiny overhead per relationship action
- For `saveMany()`, the inverse is set for each model individually — O(n) but negligible vs INSERT queries

## Security
- Inverse relations are purely in-memory — no security implications for persistence
- No authorization bypass — the relationship is already defined on the model
- Stale in-memory state before this feature was a correctness bug, not a security issue

## Common Mistakes
- Forgetting to add `->inverse()` when the convention-based guess is wrong — inverse silently not set
- Expecting inverse relations to work across unsupported relationship types (BelongsToMany)
- Adding the trait to only one side — both models need it for full bidirectional sync
- Relying on inverse relations for database synchronization — they are in-memory only

## Anti-Patterns
- **Trait on only one side**: partial consistency — parent sees child updates but not vice versa
- **No inverse declaration**: relying on convention when the relationship has a non-standard name
- **Assuming DB sync**: thinking inverse relations ensure database-level consistency
- **Oversight in long-running processes**: not considering that inverse relations hold model references in memory

## Examples
```php
use Illuminate\Database\Eloquent\Relations\Concerns\SupportsInverseRelations;

class User extends Model
{
    use SupportsInverseRelations;

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class)->inverse('user');
    }
}

class Post extends Model
{
    use SupportsInverseRelations;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->inverse('posts');
    }
}

// Before Laravel 11, this would leave $user->posts stale:
$post = new Post(['title' => 'New Post']);
$user->posts()->save($post);
// Now: $user->posts contains $post immediately

// associate() also updates inverse
$post->user()->associate($user);
$post->save();
// $user->posts now includes $post

// dissociate() clears inverse
$post->user()->dissociate();
$post->save();
// $user->posts no longer includes $post

// No inverse declaration needed if convention works
class Team extends Model
{
    use SupportsInverseRelations;

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
        // inverse 'team' inferred from Team model name
    }
}
```

## Related Topics
- Chaperone — preventing relation leakage across parent models
- Relationship Touch — persistence-level consistency (timestamps)
- BelongsTo / HasMany / HasOne — relationship types supporting inverse

## AI Agent Notes
- Available in Laravel 11+ only — check version before using
- Add the trait to the PARENT model (the one defining HasMany/HasOne)
- Use `->inverse('name')` when the inferred relationship name is wrong
- Both sides need the trait + inverse declaration for full bidirectional sync
- In-memory only — does not affect database writes or transactions

## Verification
- [ ] `use SupportsInverseRelations` is added to relevant parent models
- [ ] `->inverse()` is specified when convention-based guess is wrong
- [ ] Both sides of the relationship have the trait where needed
- [ ] `associate()` + `save()` correctly updates the inverse relation
- [ ] `save()` on HasMany correctly updates the inverse
- [ ] `dissociate()` correctly clears the inverse
- [ ] Tests verify in-memory consistency after relationship mutations
