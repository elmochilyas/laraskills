# HasOneOfMany Rules

## Rule: Keep-Base-HasMany-For-Writes
---
## Category
Architecture
---
## Rule
Always keep a separate base `HasMany` relationship for writes when using `HasOneOfMany` for reads.
---
## Reason
`HasOneOfMany` is read-only. Without a base `HasMany`, there is no way to create new child records through the relationship.
---
## Bad Example
```php
class User extends Model
{
    // Only HasOneOfMany — no way to create logins
    public function latestLogin(): HasOne
    {
        return $this->hasOne(Login::class)->latestOfMany();
    }
}
```
---
## Good Example
```php
class User extends Model
{
    public function logins(): HasMany
    {
        return $this->hasMany(Login::class);
    }

    public function latestLogin(): HasOne
    {
        return $this->hasOne(Login::class)->latestOfMany();
    }
}
```
---
## Exceptions
When child records are created entirely outside the relationship (rare).
---
## Consequences Of Violation
No way to create children through the model, forcing workarounds and breaking the relationship API.

## Rule: Composite-Index-For-OfMany
---
## Category
Performance
---
## Rule
Create a composite database index on `(foreign_key, ordering_column)` for every `HasOneOfMany` relationship.
---
## Reason
`HasOneOfMany` uses a correlated subquery with `ORDER BY` + `LIMIT 1`. Without a composite index covering both the FK and ordering column, the subquery performs a full scan per parent row.
---
## Bad Example
```php
// Login table: no composite index
Schema::create('logins', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->timestamp('created_at');
});
```
---
## Good Example
```php
Schema::create('logins', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->timestamp('created_at');
    $table->index(['user_id', 'created_at']); // Composite index
});
```
---
## Exceptions
Trivially small tables (under 1,000 rows) where full scan cost is acceptable.
---
## Consequences Of Violation
Slow subqueries, degraded page load times, O(N) scan per parent row.

## Rule: Tiebreaker-For-Determinism
---
## Category
Reliability
---
## Rule
Use composite `ofMany()` with multiple columns as tiebreakers when the primary ordering column can have duplicate values.
---
## Reason
Without tiebreakers, duplicate ordering values produce non-deterministic results. Different queries may return different "best" records for the same parent.
---
## Bad Example
```php
public function bestScore(): HasOne
{
    return $this->hasOne(Score::class)->ofMany('score', 'max');
    // Multiple scores with same value — non-deterministic
}
```
---
## Good Example
```php
public function bestScore(): HasOne
{
    return $this->hasOne(Score::class)->ofMany([
        'score' => 'max',
        'created_at' => 'max',
    ]);
}
```
---
## Exceptions
When the ordering column is guaranteed unique per parent (e.g., auto-increment primary key).
---
## Consequences Of Violation
Non-deterministic results, inconsistent application behavior, hard-to-debug data-dependent bugs.

## Rule: Document-ReadOnly-OfMany
---
## Category
Maintainability
---
## Rule
Document the read-only constraint of `HasOneOfMany` relationships in the method DocBlock.
---
## Reason
Consumers expect all relationships to support `create()` and `save()`. Without documentation, developers discover the read-only constraint at runtime via exceptions.
---
## Bad Example
```php
public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class)->latestOfMany();
}
```
---
## Good Example
```php
/**
 * Read-only. Use logins() for creating login records.
 */
public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class)->latestOfMany();
}
```
---
## Exceptions
When the relationship is private or used only internally.
---
## Consequences Of Violation
Runtime exceptions, developer confusion, wasted debugging time.

## Rule: Name-OfMany-Descriptively
---
## Category
Maintainability
---
## Rule
Name `HasOneOfMany` relationships descriptively (e.g., `latestLogin`, `bestScore`) to distinguish them from the base `HasMany`.
---
## Reason
Generic names like `login` for a `HasOneOfMany` mislead consumers about cardinality and behavior. Descriptive names clarify intent.
---
## Bad Example
```php
public function login(): HasOne // Misleading — not singular
{
    return $this->hasOne(Login::class)->latestOfMany();
}
```
---
## Good Example
```php
public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class)->latestOfMany();
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Confusion about relationship cardinality, misuse of read-only constraints.

## Rule: Not-For-True-HasOne
---
## Category
Framework Usage
---
## Rule
Do not use `HasOneOfMany` when the relationship is genuinely one-to-one with a database unique constraint.
---
## Reason
`HasOneOfMany` adds correlated subquery overhead that is unnecessary when a `UNIQUE` constraint guarantees singleton children. Use `HasOne` for simplicity and performance.
---
## Bad Example
```php
public function profile(): HasOne
{
    return $this->hasOne(Profile::class)->latestOfMany();
    // Profile has UNIQUE user_id — latestOfMany is overkill
}
```
---
## Good Example
```php
public function profile(): HasOne
{
    return $this->hasOne(Profile::class);
}
```
---
## Exceptions
When the "latest" profile among duplicates is desired despite the unique constraint.
---
## Consequences Of Violation
Unnecessary query complexity, potential for slower performance.

## Rule: Not-On-BelongsToMany
---
## Category
Framework Usage
---
## Rule
Do not apply `HasOneOfMany` on `BelongsToMany` or polymorphic relationships.
---
## Reason
`HasOneOfMany` is only supported on `HasMany`/`MorphMany` relationships. Applying it to other types throws a `BadMethodCallException` or produces incorrect SQL.
---
## Bad Example
```php
public function latestRole(): BelongsToMany
{
    return $this->belongsToMany(Role::class)->latestOfMany();
    // Throws exception — not supported
}
```
---
## Good Example
```php
public function latestLogin(): HasOne
{
    return $this->hasOne(Login::class)->latestOfMany();
}
```
---
## Exceptions
None.
---
## Consequences Of Violation
Runtime exceptions, broken application logic.
