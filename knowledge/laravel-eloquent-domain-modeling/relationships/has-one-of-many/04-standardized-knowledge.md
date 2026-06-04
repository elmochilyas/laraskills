# HasOneOfMany — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** HasOneOfMany
- **ECC Version:** 1.0

## Overview
`HasOneOfMany` retrieves a single model from a one-to-many relationship based on an ordering condition (latest, oldest, highest, lowest). Unlike `HasOne` which returns an arbitrary first child, `HasOneOfMany` guarantees which child is returned using a correlated subquery with `ORDER BY` + `LIMIT 1`.

## Core Concepts
- Definition: `$this->hasOne(Login::class)->latestOfMany()` — most recent login
- `->oldestOfMany()` — earliest record; `->ofMany('column', 'max|min')` — custom column aggregate
- Underlying mechanism: `LEFT JOIN` with a correlated subquery, not a simple `LIMIT 1`
- Returns a single model or null; read-only — no `create()` or `save()` support
- Works with `HasMany` only (not `BelongsToMany` or polymorphic)
- Composite ordering: `->ofMany(['score' => 'max', 'created_at' => 'max'])` for tie-breaking

## When To Use
- Latest login per user, most recent order per customer, highest score per player
- Any scenario where you need the "best" record from a has-many collection
- Dashboard aggregates showing latest/highest values per parent
- Eager-loadable alternative to `$user->logins()->latest()->first()` (which is an N+1 generator)

## When NOT To Use
- Do NOT use when the relationship should be truly one-to-one with a unique constraint (use `HasOne`)
- Do NOT use when you need to write/create through the relationship (it's read-only)
- Do NOT use on `BelongsToMany` or polymorphic relationships (not supported)
- Do NOT use when you need all child records (use `HasMany`)

## Best Practices (WHY)
- Always index the ordering column together with the foreign key: composite index on `(foreign_key, ordering_column)`
- Add a tiebreaker column for deterministic results when multiple rows have the same ordering value
- Keep the base `HasMany` relationship for writes — `HasOneOfMany` is read-only
- Use composite `ofMany(['col1' => 'max', 'col2' => 'max'])` for deterministic ordering
- Document the read-only constraint in the relationship method's DocBlock

## Architecture Guidelines
- Define the base `HasMany` relationship separately — needed for creating children
- Name the `HasOneOfMany` relationship descriptively: `latestLogin`, `bestScore`, `mostExpensiveProduct`
- Add the foreign key + ordering column composite index in the same migration as the child table
- Verify eager loading uses a subquery join by inspecting `toSql()` during development
- Ensure the ordering column is `NOT NULL` or handle nulls explicitly

## Performance
- Uses a correlated subquery join — more expensive than a simple `HasOne` but correct for eager loading
- Composite index on `(foreign_key, ordering_column)` is essential for subquery performance
- Eager loading executes a single query with the subquery join, not one query per parent
- `has('latestLogin')` still works but uses the same subquery join, adding overhead over a simple exists check

## Security
- Read-only constraint means no write-security concerns through this relationship
- Ensure authorization for reading the "best" record is consistent with reading any child record
- Null result when no children exist — guard downstream usage with nullsafe operators

## Common Mistakes
- Using on `HasOne` instead of `HasMany` — `HasOneOfMany` is for selecting from a `HasMany` set
- Assuming `latestOfMany` is the same as `->latest()->first()` — the subquery is correct for eager loading
- Missing index on ordering column — subquery performs a full scan per parent group
- Using the `HasOneOfMany` relationship for writes — it throws `BadMethodCallException`

## Anti-Patterns
- **HasOneOfMany for all "latest" access**: using it for simple cases where `HasOne` with unique constraint is more appropriate
- **No base HasMany**: only defining `HasOneOfMany` without a writable `HasMany` — can't create children
- **Unindexed ordering column**: causing slow subqueries on large child tables
- **Non-deterministic results**: not providing tiebreaker columns when ordering values can be equal

## Examples
```php
// Definition
class User extends Model
{
    // Base HasMany for writes
    public function logins(): HasMany
    {
        return $this->hasMany(Login::class);
    }

    // HasOneOfMany for reads
    public function latestLogin(): HasOne
    {
        return $this->hasOne(Login::class)->latestOfMany();
    }

    public function bestScore(): HasOne
    {
        return $this->hasOne(Score::class)->ofMany('score', 'max');
    }

    // Composite tiebreaker
    public function bestScoreWithDate(): HasOne
    {
        return $this->hasOne(Score::class)->ofMany([
            'score' => 'max',
            'achieved_at' => 'max',
        ]);
    }
}

// Reads
$latestLogin = $user->latestLogin;
$bestScore = $user->bestScore;

// Writes must go through base HasMany
$user->logins()->create(['ip' => $ip]);

// Eager loading
$users = User::with('latestLogin')->get();

// Existence
$usersWithLogin = User::has('latestLogin')->get();
```

## Related Topics
- HasOne — simple singular relationship
- HasMany — base relationship for HasOneOfMany
- Scoped Relationships — relationship-level constraints
- Subquery Joins — underlying mechanism

## AI Agent Notes
- `latestOfMany()` and `oldestOfMany()` are shorthands for `ofMany()` with `max`/`min` on `created_at`
- Always keep a base `HasMany` relationship for writes; `HasOneOfMany` is read-only
- Composite index on `(foreign_key, ordering_column)` is required for performance
- Use composite `ofMany()` with multiple columns when tie-breaking is needed
- The subquery join ensures correctness during eager loading, unlike manual `->latest()->first()`

## Verification
- [ ] `$user->latestLogin` returns single Login (most recent)
- [ ] `$user->bestScore` returns single Score (highest)
- [ ] `Parent::with('latestLogin')->get()` executes 1 query with subquery join
- [ ] `has('latestLogin')` filters correctly
- [ ] `$user->latestLogin()->create()` throws exception
- [ ] Composite index is used in subquery (verify via EXPLAIN)
- [ ] Deterministic results with composite tiebreaker
- [ ] Null returned when no children exist
