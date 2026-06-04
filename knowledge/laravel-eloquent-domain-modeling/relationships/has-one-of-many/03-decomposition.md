# HasOneOfMany — Decomposition

## Implementation Tasks

### 1. Create child migration with ordering column
- Create migration for child table (e.g., `logins`)
- Add `{parent}_id` FK (e.g., `user_id`) with index
- Add ordering column (e.g., `created_at`, `score`, `price`)
- Add composite index: `(user_id, created_at)` for query coverage

### 2. Define `hasMany` base relationship
- Add `hasMany(Child::class)` on parent (needed for writes)
- This is the writable relationship through which children are created

### 3. Define `hasOne` with `ofMany` modifier
```php
// Latest login
public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class)->latestOfMany();
}

// Highest score
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
```

### 4. Add eager loading configuration
- `protected $with = ['latestLogin'];` if always needed
- Verify eager loading uses subquery join (check `toSql()`)

### 5. Implement write operations through base HasMany
```php
// Create login (latestLogin is read-only)
$user->logins()->create(['ip' => $ip]);

// Cannot do: $user->latestLogin()->create(...) // throws
```

### 6. Add existence scopes
- `scopeHasLatestLogin($query)` using `has('latestLogin')`
- `scopeWhereLatestLogin($query, $closure)` using `whereHas('latestLogin')`

### 7. Optimize with composite index
- Add migration index: `$table->index(['user_id', 'created_at'])`
- Verify `EXPLAIN` shows index usage for the subquery

### 8. Add fallback/safety for missing ordering column
- Ensure ordering column is `NOT NULL` or handle nulls in ordering
- Add default value for ordering column in migration

### 9. Write feature tests
- Test `latestOfMany` returns most recent child
- Test `oldestOfMany` returns earliest child
- Test `ofMany('column', 'max')` returns highest value
- Test `ofMany('column', 'min')` returns lowest value
- Test composite `ofMany` tiebreaker works correctly
- Test return is `null` when no children exist
- Test eager loading produces single query with subquery join
- Test `has('latestLogin')` produces correct SQL
- Test read-only: `$user->latestLogin()->create()` throws exception
- Test creating child via base `hasMany` is reflected in `HasOneOfMany`
- Test composite index is used (EXPLAIN)

### 10. Add performance monitoring
- Log `EXPLAIN` output for the subquery join on production-like data
- Add query logging for `latestOfMany` with large child sets
- Document index requirements in code comments

## Validation Criteria
- [ ] `$user->latestLogin` returns single Login (most recent)
- [ ] `$user->bestScore` returns single Score (highest)
- [ ] `User::with('latestLogin')->get()` executes 1 query with subquery join
- [ ] `has('latestLogin')` filters correctly
- [ ] `$user->latestLogin()->create()` throws exception
- [ ] Composite index is used in subquery
- [ ] Deterministic results with composite tiebreaker
- [ ] Null returned when no children exist
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization