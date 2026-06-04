# HasOneThrough — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasOneThrough
- **ECC Version:** 1.0

## Overview
`HasOneThrough` defines a one-to-one relationship that traverses an intermediate model. The parent accesses a distant child via a single intermediate record, using a single join query. This relationship is read-only by default — writes must go through the intermediate model directly.

## Core Concepts
- Three-table chain: Parent → Intermediate (HasOne) → Target (HasOne)
- Definition: `return $this->hasOneThrough(Avatar::class, Profile::class);` on `User` — target first, intermediate second
- Join query: `SELECT avatars.* FROM avatars INNER JOIN profiles ON profiles.id = avatars.profile_id WHERE profiles.user_id = ?`
- Returns a single model or null; does not support `create()` or `save()` directly
- Eager loading uses a single join query, not two separate queries

## When To Use
- Accessing a distant model's data without exposing the intermediate model to consumers
- User → Profile → Avatar: access avatar as `$user->avatar` without exposing profile
- Organization → Membership → Settings: access settings directly
- Hiding implementation details of multi-step ownership chains

## When NOT To Use
- Do NOT use when you need to write/create through the relationship (it's read-only)
- Do NOT use when the intermediate model is meaningful in the domain and should be exposed
- Do NOT use when the intermediate relationship is `HasMany` (use `HasManyThrough` instead)
- Do NOT use for simple one-to-one relationships without an intermediate (use `HasOne`)

## Best Practices (WHY)
- Verify argument order: `hasOneThrough(Target::class, Intermediate::class)` — target first
- Add `UNIQUE` constraints on both intermediate's parent FK and target's intermediate FK
- Create targets through the intermediate: `$user->profile->avatar()->create($data)`
- Add `ON DELETE CASCADE` from target to intermediate for data integrity
- Use nullsafe access: `$user->avatar?->url` since intermediate may not exist

## Architecture Guidelines
- Use `HasOneThrough` when the intermediate is an implementation detail; use nested eager loading when the intermediate is meaningful
- Document the chain clearly in DocBlocks — the argument order is often confusing
- Cache the through relationship if the intermediate rarely changes
- Validate intermediate existence before accessing through-relationship data

## Performance
- Single join query — more efficient than two separate queries (nested eager loading)
- Both `intermediate.parent_id` and `target.intermediate_id` must be indexed
- Eager loading uses `WHERE intermediate.parent_id IN (...)` with join — efficient with indexes
- No write support means no write-performance concerns

## Security
- The intermediate model is not exposed through the relationship — security is through the intermediate
- Ensure authorization gates check through the chain, not just the target
- Null intermediate returns null, not an error — guard downstream usage

## Common Mistakes
- Wrong argument order: `hasOneThrough(Target::class, Intermediate::class)` — many developers swap them
- Assuming write support: `$user->avatar()->create(...)` throws `BadMethodCallException`
- Forgetting intermediate must be `HasOne` (or `HasMany` for `HasManyThrough`) — not `BelongsTo`
- Missing cascade: deleting the intermediate orphans the target

## Anti-Patterns
- **HasOneThrough for mutable data**: using a read-only relationship for data that needs frequent writes
- **Nested access when intermediate is meaningful**: `$user->avatar` hides the profile model which may have its own significance
- **Missing unique constraints**: allowing multiple intermediates per parent breaks the one-to-one guarantee
- **Over-nesting**: 3+ hop chains create complex join SQL that's hard to debug

## Examples
```php
// Definition
class User extends Model
{
    public function avatar(): HasOneThrough
    {
        return $this->hasOneThrough(
            Avatar::class,
            Profile::class,
            'user_id',  // FK on profiles table
            'profile_id', // FK on avatars table
            'id',        // local key on users table
            'id'         // local key on profiles table
        );
    }
}

class Profile extends Model
{
    public function avatar(): HasOne
    {
        return $this->hasOne(Avatar::class);
    }
}

class Avatar extends Model
{
    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}

// Read access
$avatar = $user->avatar;

// Create through intermediate
$user->profile->avatar()->create(['url' => 'photo.jpg']);

// Eager loading
$users = User::with('avatar')->get();

// Existence check
$usersWithAvatar = User::has('avatar')->get();
```

## Related Topics
- HasManyThrough — one-to-many variant across an intermediate
- HasOne — direct one-to-one (no intermediate)
- Fluent Through Relationships — chainable syntax for complex through chains

## AI Agent Notes
- Always verify argument order: `hasOneThrough(Target, Intermediate, ...)` — target first
- Document the read-only constraint in the relationship DocBlock
- For custom keys, pass them in order: intermediate FK, target FK, parent local key, intermediate local key
- Remember that eager loading uses a single JOIN, not two separate queries

## Verification
- [ ] `$parent->target` returns single model or null
- [ ] `Parent::with('target')->get()` executes a single query with JOIN
- [ ] `has('target')` produces correct WHERE EXISTS with join
- [ ] Deleting intermediate cascades to target
- [ ] Creating target through intermediate works
- [ ] Direct `create()` on through relationship throws exception
