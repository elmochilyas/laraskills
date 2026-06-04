# Constrained Eager Loading — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Constrained Eager Loading
- **ECC Version:** 1.0

## Overview
Constrained eager loading filters, orders, and limits related models that are eager-loaded via `with()`. Instead of loading all related records, closures apply `where`, `orderBy`, `limit`, and `select` to the eager-loading query. This is essential for loading only relevant subsets of large relationship sets.

## Core Concepts
- Closure syntax: `with(['relation' => fn($q) => $q->where(...)])`
- Any query builder method works inside the closure: `where`, `orderBy`, `limit`, `select`
- Constraints apply only to the eager-loading query, not the parent query or relationship definition
- Nested constrained loading: `with(['posts' => fn($q) => ... , 'posts.comments' => fn($q) => ...])`
- `limit()` is global, not per-parent — use `limitBy()` (Laravel 8.52+) for per-parent limits
- Column reduction via `select()` prevents selecting unnecessary columns from related tables

## When To Use
- Loading only active/approved/published related records
- Limiting to the most recent N related records per parent (with `limitBy()`)
- Column reduction to avoid loading large text/JSON columns from related tables
- Ordered relationships: loading related records in a specific order (e.g., by pivot column)
- Conditional counts: `withCount(['comments' => fn($q) => $q->where('approved', true)])`

## When NOT To Use
- Do NOT use when you need all related records (unconstrained `with()` is simpler)
- Do NOT use `limit()` expecting per-parent behavior (it's global — use `limitBy()`)
- Do NOT omit the foreign key from `select()` — this breaks relationship hydration
- Do NOT use overly complex closures that should be extracted to named scopes

## Best Practices (WHY)
- Always include the foreign key (and morph type for polymorphic) in constrained `select()` calls
- Pair `limit()` with `orderBy()` for deterministic results
- Use `limitBy()` (Laravel 8.52+) when you need per-parent limiting
- Extract complex constraint closures into named methods on the related model
- Verify constraint selectivity with `toSql()` — ensure the constraint actually reduces data

## Architecture Guidelines
- Keep constraint closures short and readable; extract complex logic to methods
- Use constrained loading as the primary tool for controlling eager-loading memory footprint
- For reusable constraints, define query scopes on the related model instead of duplicating closures
- Document constrained relationships clearly — another developer may not expect filtering
- Test constrained loading with realistic data volumes to verify behavior

## Performance
- Constrained loading is the single most effective technique for controlling eager-loading memory usage (10–100× reduction)
- Column reduction via `select()` prevents unnecessary data transfer from the database
- `limit()` without `orderBy()` is non-deterministic and may not reduce data as expected
- `limitBy()` uses window functions internally — test performance on large datasets
- Nested constraints add complexity but don't increase query count

## Security
- Constrained loading filters data at the database level — no data reaches PHP that isn't explicitly selected
- Ensure constraint closures don't leak sensitive data (e.g., eager-loading hidden relationships)
- Column reduction prevents exposing sensitive columns in API responses

## Common Mistakes
- Omitting the foreign key from `select()` in column reduction — Eloquent can't match related models to parents
- Using `limit()` expecting per-parent behavior — limit is global, not per-parent
- Applying constraints that don't reduce data (low selectivity) — negates the benefit
- Nested constraints without parent constraint — loads all parents unnecessarily

## Anti-Patterns
- **Global limit instead of per-parent**: using `limit(5)` expecting 5 per parent, but getting 5 total
- **No foreign key in select**: breaking hydration by omitting the FK from column reduction
- **Constraint in with, no reuse**: duplicating the same constraint closure across multiple queries
- **Unnecessary constraints**: adding where clauses that match 99% of related rows

## Examples
```php
// Load only approved comments
$users = User::with(['comments' => fn($q) => $q->where('approved', true)])->get();

// Limit to 5 most recent posts per user (Laravel 8.52+)
$users = User::with(['posts' => fn($q) => $q->latest()->limitBy(5)])->get();

// Column reduction — always include the FK
$users = User::with(['profile' => fn($q) => $q->select('id', 'user_id', 'avatar_url')])->get();

// Ordered relationship
$users = User::with(['tags' => fn($q) => $q->orderBy('pivot_sort_order')])->get();

// Conditional count
$posts = Post::withCount(['comments' => fn($q) => $q->where('approved', true)])->get();

// Nested constrained loading
$users = User::with([
    'posts' => fn($q) => $q->where('published', true),
    'posts.comments' => fn($q) => $q->where('approved', true),
])->get();
```

## Related Topics
- Eager Loading Fundamentals — core `with()` mechanics
- Lazy Eager Loading — applying constraints via `load()` closures
- `$with` Blast Radius — contrast: `$with` cannot use constraints
- withCount — constrained aggregate loading

## AI Agent Notes
- Always include the foreign key in `select()` calls within constrained loading closures
- Use `limitBy()` for per-parent limiting, not `limit()`
- Constraint closures have full access to the query builder API
- Extract complex closures to named query scopes for reusability
- Column reduction is the biggest performance win — avoid loading columns you don't need

## Verification
- [ ] Constrained loading actually reduces related row count (verify via Telescope/Debugbar)
- [ ] Foreign key is included in any constrained `select()` call
- [ ] Per-parent limiting uses `limitBy()`, not `limit()`
- [ ] Nested constraints correctly limit at each level
- [ ] Constraint closures are readable and testable
- [ ] No unnecessary data transferred from the database
