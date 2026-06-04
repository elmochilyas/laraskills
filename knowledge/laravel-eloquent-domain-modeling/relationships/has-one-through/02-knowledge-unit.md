# HasOneThrough

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships â€” Part 1: Relationship Types
- **Last Updated:** 2026-06-02

## Executive Summary
`HasOneThrough` defines a one-to-one relationship that traverses an intermediate model. The parent model accesses a distant child model via a single intermediate model. Both the intermediate and the distant child satisfy a one-to-one constraint â€” each has exactly one owner. This relationship is read-only by default; creating the distant model requires managing the intermediate separately.

## Core Concepts
- **Three-table chain:** Parent â†’ Intermediate â†’ Target. Example: `User` has one `Profile` (intermediate) which has one `Avatar` (target). `User` has one `Avatar` through `Profile`.
- **Definition syntax:** `return $this->hasOneThrough(Avatar::class, Profile::class);` on `User`. Custom keys: `$this->hasOneThrough(Avatar::class, Profile::class, 'user_id', 'profile_id', 'id', 'id')`.
- **Foreign keys:** The intermediate table has `{parent}_id` (e.g., `user_id`). The target table has `{intermediate}_id` (e.g., `profile_id`).
- **Return type:** A single model instance (or `null`). Same return type as `HasOne`.
- **Read-only nature:** `HasOneThrough` does not support `create()` or `save()` directly because there is no single foreign key to set on the target table that also inserts the intermediate record.

## Mental Models
- **Two-hop relationship:** The parent jumps through an intermediate to reach the target. The intermediate acts as a bridge table, but unlike a pivot, it is a full model with its own table and relationships.
- **"Grandchild" accessor:** The parent can access a grandchild property without exposing the child model. Useful for reducing deep nested access like `$user->profile->avatar->url`.
- **Referential chain:** Each step is a `HasOne` relationship. The chain `User â†’ Profile â†’ Avatar` means `HasOneThrough` connects `User â†’ Avatar` directly.

## Internal Mechanics

> **Reference:** 
- Extends `ThroughOneOrMany`. The query builds joins: `SELECT avatars.* FROM avatars INNER JOIN profiles ON profiles.id = avatars.profile_id WHERE profiles.user_id = ?`.
- `getResults()` calls `first()` to return a single model.
- Eager loading uses a single join query per relationship, not two separate queries. The intermediate table is joined in the same SQL statement.
- `addEagerConstraints()` applies `WHERE profiles.user_id IN (...parent_keys)` to the join query.
- `match()` iterates parent models and attaches the first matching target by matching the intermediate's foreign key to the parent's local key through the join.

## Patterns
- **User has one avatar through profile:** User â†’ Profile â†’ Avatar. The avatar is accessed as `$user->avatar` without exposing the profile.
- **Tenant settings through a membership:** Organization â†’ Membership â†’ Settings. `Organization has one Settings through Membership`.
- **Application config through a deployment:** Project â†’ Deployment â†’ Config. `Project has one Config through Deployment`.

## Architectural Decisions
- **Read-only constraint:** Since `HasOneThrough` doesn't support `create()` or `save()`, any mutation must happen on the intermediate or target model directly. This is a design constraint: the relationship describes a path, not an ownership chain.
- **When to use vs. nested eager loading:** Use `HasOneThrough` when the intermediate model is an implementation detail and should be hidden from consumers. Use nested `->load('profile.avatar')` when the intermediate is meaningful in the domain.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single-query access to distant model | Read-only; no create/save | Must manage intermediate and target separately |
| Hides intermediate complexity | Only works with one-to-one chains | Cannot use with has-many intermediate |
| Simple eager loading (one join) | Key ordering in definition is confusing | Always verify argument order with source docs |

## Performance Considerations
- **Single join query:** `HasOneThrough` uses one SQL join, not two queries. This makes it more efficient than nested eager loading on read.
- **Index requirements:** Both the intermediate's `{parent}_id` and the target's `{intermediate}_id` must be indexed. The join order filters by the parent's FK first, so index that column.
- **No write optimization:** Since writes are not supported, performance concerns are read-only. The join query is efficient with correct indexes.

## Production Considerations
- **Intermediate nullability:** If the intermediate record may not exist, `HasOneThrough` will return `null` without erroring. Ensure the chain is non-nullable at every step or guard with nullsafe.
- **Data integrity:** Deleting the intermediate should cascade to the target. Add `ON DELETE CASCADE` on the target's FK to the intermediate.
- **Validation:** Validate intermediate existence before accessing the target.

## Common Mistakes
- **Wrong argument order:** `hasOneThrough(Target::class, Intermediate::class)` â€” target first, intermediate second. Swapping them produces a broken query.
- **Forgetting intermediate relationship must be `HasOne`:** The target must have a `HasOne` or `HasMany` from the intermediate, not `BelongsTo`.
- **Assuming write support:** Trying `$user->avatar()->create(...)` throws a `BadMethodCallException`.

## Failure Modes
- **Missing intermediate yields null:** `$user->profile` is null â†’ `$user->avatar` returns null without error. Debugging requires checking the intermediate separately.
- **Multiple intermediate matches:** If the intermediate has multiple records for the same parent, `HasOneThrough` returns the first by join order (unpredictable). Enforce uniqueness in the database.
- **Broken join query:** Incorrect key arguments produce a SQL error. Always inspect the generated query with `->toSql()` during development.

## Ecosystem Usage
- **Laravel Spark (team plans):** Organization has one plan through subscription.
- **Laravel Cashier:** `User` has one subscription through customer profile.
- **SaaS tenant systems:** Tenants access settings through a membership/tenant model.

## Related Knowledge Units

### Prerequisites
HasOne, BelongsTo

### Related Topics
`HasManyThrough` (one-to-many variant), `HasOne` (base pattern)

### Advanced Follow-up Topics
`Through` Relationship Fluent API, Nested Eager Loading vs. Through

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Relations\HasOneThrough.php` extends `ThroughOneOrMany`. The class is small (~50 lines) because most logic is in the parent. The join construction is in `ThroughOneOrMany`.
- **Key Insight:** `HasOneThrough` is purely a read optimization. It avoids two queries (parentâ†’intermediate, intermediateâ†’target) by using a single join. If you need writes, use the intermediate model directly.
- **Version-Specific Notes:** Laravel 8+ stable. No significant changes in Laravel 11. The `ThroughOneOrMany` parent class was refactored in Laravel 10 for better join construction.
