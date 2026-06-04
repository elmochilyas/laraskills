# Runtime Casting

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Runtime Casting |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Runtime casting allows adding or overriding casts on a model instance after it has been instantiated. Using `withCasts()` or `mergeCasts()`, you can temporarily apply different cast behavior for a specific query or operation without modifying the model class definition. This is useful for one-off queries, eager loading with different types, or handling legacy data.

## Core Concepts

- **withCasts(Model|Builder)**: Creates a new instance or query with additional/overridden casts without modifying the original
- **mergeCasts(array)**: Merges new casts into an existing instance's cast array, overriding any conflicts
- **Instance-scoped**: Runtime casts apply only to the specific model instance or query builder
- **No class modification**: The model class definition remains unchanged

## When To Use

- You need a different cast for a specific query (e.g., treating a JSON column differently for a report)
- You're working with legacy data that needs different casting than new data
- You want to temporarily disable or modify a cast for a bulk operation

## When NOT To Use

- The cast change should apply globally (modify the model's `$casts` or `casts()` method)
- You need runtime casting in multiple places (it's an ad-hoc tool, not a design pattern)

## Best Practices

- **Use `withCasts()` for query builders**: When you need a different cast for a specific query chain, `$query->withCasts()` applies the casts to all results from that query.
- **Use `mergeCasts()` for individual instances**: When you have a loaded model and need to change its cast behavior for the current request.
- **Document runtime cast usage**: Since runtime casts are invisible in the model definition, document them clearly in the code where they're applied.

## Examples

```php
// Query with overridden cast
User::withCasts(['email_verified_at' => 'datetime:Y-m-d'])
    ->where('is_active', true)
    ->get();

// Instance-level override
$user = User::find(1);
$user->mergeCasts(['metadata' => 'array']);
$metadata = $user->metadata; // Now returns array instead of default cast type
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Primitive Casts |
| Prerequisite | Custom Casts |
| Closely Related | CastsAttributes Interface |
| Closely Related | Accessor Patterns |

## AI Agent Notes

- Use `withCasts()` on query builders, `mergeCasts()` on instances
- Runtime casts are instance-scoped — they don't affect the model class
- Document runtime cast usage since it's invisible in the model definition

## Verification

- [ ] Runtime cast usage is documented in code
- [ ] `withCasts()` is used for query-level cast changes
- [ ] `mergeCasts()` is used for instance-level cast changes
- [ ] Global model definition remains unchanged
